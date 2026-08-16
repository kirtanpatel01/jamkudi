import { File, Directory, Paths } from 'expo-file-system';
import { safeStorage } from '@/utils/safeStorage';
import { JioSaavnSong, searchSongs } from '@/services/jiosaavn';

export interface DownloadedSongMetadata {
  songId: string;
  localUri: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string | null;
  duration: number;
  downloadUrl?: string;
  downloadedAt: string;
  fileSize: number;
  status: 'downloading' | 'downloaded' | 'failed';
}

export interface PlaylistDownloadMetadata {
  playlistId: string;
  playlistTitle: string;
  songIds: string[];
  status: 'downloading' | 'downloaded' | 'partially_downloaded' | 'failed';
  totalCount: number;
  completedCount: number;
  downloadedAt: string;
}

export interface PlayableSourceResolution {
  type: 'local' | 'remote' | 'unavailable';
  uri?: string;
  reason?: string;
  song: JioSaavnSong;
}

const METADATA_KEY = 'jamkudi_offline_songs_metadata';
const PLAYLISTS_KEY = 'jamkudi_offline_playlists_metadata';

let initialized = false;
let activePlaylistCancelFlags: Record<string, boolean> = {};

// In-memory cache of download metadata for instant synchronous queries
let songMetadataCache: Record<string, DownloadedSongMetadata> = {};
let playlistMetadataCache: Record<string, PlaylistDownloadMetadata> = {};

// Event listeners for reactive UI updates
type ChangeListener = () => void;
const changeListeners = new Set<ChangeListener>();

export function subscribeToDownloads(listener: ChangeListener): () => void {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
}

function notifyListeners() {
  changeListeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('Download listener error:', e);
    }
  });
}

function getSongsDirectory(): Directory {
  return new Directory(Paths.document, 'jamkudi_offline', 'songs');
}

function getSongFile(cleanId: string): File {
  return new File(getSongsDirectory(), `${cleanId}.mp3`);
}

function getTempSongFile(cleanId: string): File {
  return new File(getSongsDirectory(), `${cleanId}.tmp`);
}

export function sanitizeSongId(id?: string, title?: string, artist?: string): string {
  if (id && typeof id === 'string' && id.trim()) {
    return id.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  }
  if (title && typeof title === 'string' && title.trim()) {
    const fallbackKey = `${title}_${artist || ''}`.toLowerCase().trim();
    return fallbackKey.replace(/[^a-zA-Z0-9_-]/g, '_');
  }
  return 'unknown_track';
}

/**
 * Initialize persistent directory structure and validate local files against metadata.
 */
export async function initDownloadService(): Promise<void> {
  if (initialized) return;

  try {
    const offlineDir = new Directory(Paths.document, 'jamkudi_offline');
    if (!offlineDir.exists) {
      offlineDir.create();
    }

    const songsDir = getSongsDirectory();
    if (!songsDir.exists) {
      songsDir.create();
    }

    // Load persisted metadata maps
    const rawSongs = await safeStorage.getItem(METADATA_KEY);
    if (rawSongs) {
      try {
        songMetadataCache = JSON.parse(rawSongs);
      } catch {
        songMetadataCache = {};
      }
    }

    const rawPlaylists = await safeStorage.getItem(PLAYLISTS_KEY);
    if (rawPlaylists) {
      try {
        playlistMetadataCache = JSON.parse(rawPlaylists);
      } catch {
        playlistMetadataCache = {};
      }
    }

    // Validate local files on disk & clean stale downloading status
    let metadataChanged = false;
    for (const songId of Object.keys(songMetadataCache)) {
      const item = songMetadataCache[songId];
      if (item.status === 'downloading') {
        // App restarted or reloaded while downloading -> reset to idle
        delete songMetadataCache[songId];
        metadataChanged = true;
      } else if (item.status === 'downloaded' && item.localUri) {
        const file = getSongFile(songId);
        if (!file.exists) {
          console.warn(`Local file missing for downloaded song ${songId}, repairing metadata.`);
          delete songMetadataCache[songId];
          metadataChanged = true;
        }
      }
    }

    if (metadataChanged) {
      await saveSongMetadataCache();
    }

    initialized = true;
    notifyListeners();
  } catch (err) {
    console.error('Failed to initialize download service:', err);
    initialized = true;
  }
}

async function saveSongMetadataCache(): Promise<void> {
  await safeStorage.setItem(METADATA_KEY, JSON.stringify(songMetadataCache));
  notifyListeners();
}

async function savePlaylistMetadataCache(): Promise<void> {
  await safeStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlistMetadataCache));
  notifyListeners();
}

/**
 * Check if a song is downloaded and valid on local disk.
 */
export function isSongDownloaded(songId: string, songTitle?: string, songArtist?: string): boolean {
  if (!songId && !songTitle) return false;

  if (songId) {
    const cleanId = sanitizeSongId(songId);
    const meta = songMetadataCache[cleanId];
    if (meta && meta.status === 'downloaded' && meta.localUri) {
      const file = getSongFile(cleanId);
      if (file.exists) return true;
    }
  }

  if (songTitle && songArtist) {
    const normTitle = songTitle.toLowerCase().trim();
    const normArtist = songArtist.toLowerCase().trim();
    const found = Object.values(songMetadataCache).find(
      (m) =>
        m.status === 'downloaded' &&
        m.title.toLowerCase().trim() === normTitle &&
        m.artist.toLowerCase().trim() === normArtist
    );
    if (found) {
      const file = getSongFile(found.songId);
      if (file.exists) return true;
    }
  }

  return false;
}

/**
 * Get downloaded song metadata if exists.
 */
export function getDownloadedSongMetadata(songId: string): DownloadedSongMetadata | null {
  if (!songId) return null;
  const cleanId = sanitizeSongId(songId);
  return songMetadataCache[cleanId] || null;
}

/**
 * Get all downloaded songs as an array.
 */
export function getAllDownloadedSongs(): DownloadedSongMetadata[] {
  return Object.values(songMetadataCache).filter((meta) => {
    if (meta.status !== 'downloaded' || !meta.localUri) return false;
    const file = getSongFile(meta.songId);
    return file.exists;
  });
}

// Active download progress per song (0 - 100)
let songProgressMap: Record<string, number> = {};

/**
 * Get active download progress (0 - 100) for a song.
 */
export function getSongDownloadProgress(songId: string): number {
  if (!songId) return 0;
  const cleanId = sanitizeSongId(songId);
  return songProgressMap[cleanId] || 0;
}

/**
 * Calculate total storage size in bytes used by offline downloaded songs.
 */
export function getTotalStorageUsedBytes(): number {
  return getAllDownloadedSongs().reduce((acc, song) => acc + (song.fileSize || 0), 0);
}

/**
 * Get playlist download metadata if exists.
 */
export function getPlaylistDownloadMetadata(playlistId: string): PlaylistDownloadMetadata | null {
  if (!playlistId) return null;
  return playlistMetadataCache[playlistId] || null;
}

/**
 * Download an individual song to persistent application storage.
 */
export async function downloadSong(
  song: JioSaavnSong,
  onProgress?: (progressPercent: number) => void
): Promise<DownloadedSongMetadata> {
  await initDownloadService();

  if (!song || (!song.id && !song.title)) {
    throw new Error('Invalid song object provided for download.');
  }

  const cleanId = sanitizeSongId(song.id, song.title, song.artist);

  // Duplicate Check: Return existing if already downloaded and valid
  if (isSongDownloaded(cleanId, song.title, song.artist)) {
    const existing = songMetadataCache[cleanId];
    if (existing && getSongFile(cleanId).exists) {
      if (onProgress) onProgress(100);
      return existing;
    }
  }

  // Resolve authorized audio URL (supports string, downloadUrl array, or url object)
  let rawAudio: any = (song as any).audioUrl || (song as any).downloadUrl || (song as any).url;

  if (Array.isArray(rawAudio) && rawAudio.length > 0) {
    const bestObj =
      rawAudio.find((d: any) => d?.quality === '320kbps') ||
      rawAudio.find((d: any) => d?.quality === '160kbps') ||
      rawAudio[rawAudio.length - 1];
    rawAudio = typeof bestObj === 'string' ? bestObj : bestObj?.url || bestObj?.link || '';
  } else if (typeof rawAudio === 'object' && rawAudio !== null) {
    rawAudio = rawAudio.url || rawAudio.link || '';
  }

  if (!rawAudio || typeof rawAudio !== 'string' || !rawAudio.trim()) {
    try {
      const cleanTitle = (song.title || '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/\(From.*?\)/gi, '')
        .replace(/\|.*/, '')
        .trim();
      const queryStr = `${cleanTitle} ${song.artist || ''}`.trim();
      const searchRes = await searchSongs(queryStr, 0, 1);
      if (searchRes.length > 0) {
        const fetched = searchRes[0];
        rawAudio = (fetched as any).audioUrl || (fetched as any).downloadUrl || (fetched as any).url;
        if (Array.isArray(rawAudio) && rawAudio.length > 0) {
          const bestObj =
            rawAudio.find((d: any) => d?.quality === '320kbps') ||
            rawAudio.find((d: any) => d?.quality === '160kbps') ||
            rawAudio[rawAudio.length - 1];
          rawAudio = typeof bestObj === 'string' ? bestObj : bestObj?.url || bestObj?.link || '';
        }
      }
    } catch (e) {
      console.warn('Search fallback notice:', e);
    }
  }

  if (!rawAudio || typeof rawAudio !== 'string' || !rawAudio.trim()) {
    throw new Error('No authorized downloadable audio URL available for this track.');
  }

  const sanitizedUrl = rawAudio.trim().replace(/^http:\/\//i, 'https://');
  const songsDir = getSongsDirectory();
  if (!songsDir.exists) {
    songsDir.create();
  }
  const targetFile = getSongFile(cleanId);

  // Update status to downloading
  songProgressMap[cleanId] = 10;
  songMetadataCache[cleanId] = {
    songId: cleanId,
    localUri: targetFile.uri,
    title: song.title || 'Untitled Track',
    artist: song.artist || 'Unknown Artist',
    album: song.album || undefined,
    artwork: song.artwork || null,
    duration: song.duration || 0,
    downloadUrl: sanitizedUrl,
    downloadedAt: new Date().toISOString(),
    fileSize: 0,
    status: 'downloading',
  };
  await saveSongMetadataCache();

  try {
    songProgressMap[cleanId] = 10;
    notifyListeners();
    if (onProgress) onProgress(10);

    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => {
      controller.abort('Network transfer timeout');
    }, 25000);

    try {
      await File.downloadFileAsync(sanitizedUrl, targetFile, {
        idempotent: true,
        signal: controller.signal,
        onProgress: (p) => {
          if (p.totalBytes > 0) {
            const pct = Math.min(95, Math.max(10, Math.round((p.bytesWritten / p.totalBytes) * 100)));
            songProgressMap[cleanId] = pct;
            notifyListeners();
            if (onProgress) onProgress(pct);
          }
        },
      });
      clearTimeout(timeoutTimer);
    } catch (downloadErr: any) {
      clearTimeout(timeoutTimer);
      throw downloadErr;
    }

    songProgressMap[cleanId] = 95;
    notifyListeners();

    if (!targetFile.exists || (targetFile.size ?? 0) === 0) {
      throw new Error('Download failed: Local file is empty or missing.');
    }

    const completedMeta: DownloadedSongMetadata = {
      songId: cleanId,
      localUri: targetFile.uri,
      title: song.title || 'Untitled Track',
      artist: song.artist || 'Unknown Artist',
      album: song.album || undefined,
      artwork: song.artwork || null,
      duration: song.duration || 0,
      downloadUrl: sanitizedUrl,
      downloadedAt: new Date().toISOString(),
      fileSize: targetFile.size || 0,
      status: 'downloaded',
    };

    delete songProgressMap[cleanId];
    songMetadataCache[cleanId] = completedMeta;
    await saveSongMetadataCache();

    if (onProgress) onProgress(100);
    return completedMeta;
  } catch (err: any) {
    console.error(`Download error for track ${cleanId}:`, err);
    delete songProgressMap[cleanId];
    try {
      if (targetFile.exists) targetFile.delete();
    } catch {}

    if (songMetadataCache[cleanId]) {
      songMetadataCache[cleanId] = {
        ...songMetadataCache[cleanId],
        status: 'failed',
      };
      await saveSongMetadataCache();
    } else {
      notifyListeners();
    }

    throw new Error(err.message || 'Download failed');
  }
}

/**
 * Remove a downloaded song from persistent storage.
 */
export async function removeDownload(songId: string): Promise<void> {
  await initDownloadService();

  if (!songId) return;
  const cleanId = sanitizeSongId(songId);

  const file = getSongFile(cleanId);
  if (file.exists) {
    try {
      file.delete();
    } catch (e) {
      console.warn('File delete notice:', e);
    }
  }

  delete songMetadataCache[cleanId];
  await saveSongMetadataCache();
}

/**
 * Get active download status ('idle' | 'downloading' | 'downloaded' | 'failed') for a song.
 */
export function getSongStatus(
  songId?: string,
  songTitle?: string,
  songArtist?: string
): 'idle' | 'downloading' | 'downloaded' | 'failed' {
  if (!songId && !songTitle) return 'idle';
  const cleanId = sanitizeSongId(songId, songTitle, songArtist);
  const meta = songMetadataCache[cleanId];
  if (meta) {
    if (meta.status === 'downloaded') {
      const file = getSongFile(cleanId);
      return file.exists ? 'downloaded' : 'idle';
    }
    return meta.status || 'idle';
  }
  if (isSongDownloaded(songId || '', songTitle, songArtist)) {
    return 'downloaded';
  }
  return 'idle';
}

/**
 * Download an entire playlist with controlled concurrency and sharing existing downloads.
 */
export async function downloadPlaylist(
  playlistId: string,
  playlistTitle: string,
  songs: JioSaavnSong[],
  onProgress?: (completedCount: number, totalCount: number) => void
): Promise<PlaylistDownloadMetadata> {
  await initDownloadService();

  if (!playlistId || !songs || songs.length === 0) {
    throw new Error('Playlist has no tracks to download.');
  }

  activePlaylistCancelFlags[playlistId] = false;

  const validSongs = songs
    .filter((s) => s != null)
    .map((s: any) => ({
      ...s,
      id: s.id || s.songId || s._id || '',
      title: s.title || s.name || s.song || 'Untitled Track',
      artist:
        s.artist ||
        (Array.isArray(s.artists?.primary)
          ? s.artists.primary.map((a: any) => a.name).join(', ')
          : s.primaryArtists || s.singers || 'Unknown Artist'),
      audioUrl:
        s.audioUrl ||
        (Array.isArray(s.downloadUrl)
          ? s.downloadUrl[s.downloadUrl.length - 1]?.url
          : s.downloadUrl) ||
        s.url ||
        '',
    }));

  const totalCount = validSongs.length;
  let completedCount = validSongs.filter((s) => isSongDownloaded(s.id, s.title, s.artist)).length;

  playlistMetadataCache[playlistId] = {
    playlistId,
    playlistTitle,
    songIds: validSongs.map((s) => sanitizeSongId(s.id, s.title, s.artist)),
    status: completedCount === totalCount ? 'downloaded' : 'downloading',
    totalCount,
    completedCount,
    downloadedAt: new Date().toISOString(),
  };
  await savePlaylistMetadataCache();

  for (const song of validSongs) {
    if (activePlaylistCancelFlags[playlistId]) {
      console.log(`Playlist download ${playlistId} cancelled by user.`);
      delete activePlaylistCancelFlags[playlistId];
      playlistMetadataCache[playlistId] = {
        ...playlistMetadataCache[playlistId],
        status: completedCount > 0 ? 'partially_downloaded' : 'failed',
        completedCount,
      };
      await savePlaylistMetadataCache();
      throw new Error('Playlist download cancelled.');
    }

    const cleanId = sanitizeSongId(song.id, song.title, song.artist);
    if (isSongDownloaded(cleanId, song.title, song.artist)) {
      completedCount = validSongs.filter((s) => isSongDownloaded(s.id, s.title, s.artist)).length;
      playlistMetadataCache[playlistId] = {
        ...playlistMetadataCache[playlistId],
        completedCount,
        status: completedCount === totalCount ? 'downloaded' : 'downloading',
      };
      await savePlaylistMetadataCache();
      continue;
    }

    try {
      await downloadSong(song);
    } catch (e) {
      console.warn(`Track download failed in playlist ${playlistId}:`, e);
    }

    completedCount = validSongs.filter((s) => isSongDownloaded(s.id, s.title, s.artist)).length;
    playlistMetadataCache[playlistId] = {
      ...playlistMetadataCache[playlistId],
      completedCount,
      status: completedCount === totalCount ? 'downloaded' : 'downloading',
    };
    await savePlaylistMetadataCache();

    if (onProgress) {
      onProgress(completedCount, totalCount);
    }
  }

  const finalStatus =
    completedCount === totalCount
      ? 'downloaded'
      : completedCount > 0
      ? 'partially_downloaded'
      : 'failed';

  const finalMetadata: PlaylistDownloadMetadata = {
    playlistId,
    playlistTitle,
    songIds: validSongs.map((s) => sanitizeSongId(s.id, s.title, s.artist)),
    status: finalStatus,
    totalCount,
    completedCount,
    downloadedAt: new Date().toISOString(),
  };

  playlistMetadataCache[playlistId] = finalMetadata;
  await savePlaylistMetadataCache();

  delete activePlaylistCancelFlags[playlistId];
  return finalMetadata;
}

/**
 * Cancel an ongoing playlist download.
 */
export function cancelPlaylistDownload(playlistId: string): void {
  activePlaylistCancelFlags[playlistId] = true;
}

/**
 * Centralized Playable Source Resolver:
 * Checks whether song is downloaded locally. If yes -> local file. If no & online -> remote URL. If no & offline -> unavailable.
 */
export async function resolvePlayableSource(
  song: JioSaavnSong,
  isOfflineMode: boolean = false
): Promise<PlayableSourceResolution> {
  await initDownloadService();

  if (!song) {
    return {
      type: 'unavailable',
      reason: 'No song specified.',
      song,
    };
  }

  const cleanId = sanitizeSongId(song.id, song.title, song.artist);
  const meta = songMetadataCache[cleanId];

  if (meta && meta.status === 'downloaded' && meta.localUri) {
    const file = getSongFile(cleanId);
    if (file.exists) {
      return {
        type: 'local',
        uri: file.uri,
        song,
      };
    }
  }

  // Not downloaded locally
  if (isOfflineMode) {
    return {
      type: 'unavailable',
      reason: "You're offline. Download this song to listen without internet.",
      song,
    };
  }

  const remoteUri = (song as any).downloadUrl || (song as any).url || (song as any).audioUrl;
  if (!remoteUri) {
    return {
      type: 'unavailable',
      reason: 'No streaming audio URL available for this track.',
      song,
    };
  }

  return {
    type: 'remote',
    uri: remoteUri,
    song,
  };
}
