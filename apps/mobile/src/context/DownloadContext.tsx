import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  initDownloadService,
  subscribeToDownloads,
  isSongDownloaded as checkSongDownloaded,
  getSongStatus,
  getAllDownloadedSongs,
  getDownloadedSongMetadata,
  getSongDownloadProgress,
  getTotalStorageUsedBytes,
  downloadSong,
  removeDownload,
  downloadPlaylist,
  cancelPlaylistDownload,
  getPlaylistDownloadMetadata,
  DownloadedSongMetadata,
  PlaylistDownloadMetadata,
  resolvePlayableSource,
  PlayableSourceResolution,
  sanitizeSongId,
} from '@/services/downloadService';
import { JioSaavnSong } from '@/services/jiosaavn';
import { useToast } from '@/context/ToastContext';

export type DownloadState = 'idle' | 'downloading' | 'downloaded' | 'failed';

interface DownloadContextType {
  isOffline: boolean;
  downloadedSongs: DownloadedSongMetadata[];
  totalStorageBytes: number;
  formattedStorageSize: string;
  isSongDownloaded: (songId: string, songTitle?: string, songArtist?: string) => boolean;
  getSongState: (songId: string, songTitle?: string, songArtist?: string) => DownloadState;
  getSongProgress: (songId: string) => number;
  downloadSongTrack: (song: JioSaavnSong) => Promise<void>;
  removeSongDownload: (songId: string) => Promise<void>;
  downloadPlaylistTracks: (
    playlistId: string,
    playlistTitle: string,
    songs: JioSaavnSong[]
  ) => Promise<PlaylistDownloadMetadata>;
  cancelPlaylistDownloadTrack: (playlistId: string) => void;
  getPlaylistStatus: (playlistId: string) => PlaylistDownloadMetadata | null;
  getPlayableSource: (song: JioSaavnSong) => Promise<PlayableSourceResolution>;
  refreshDownloads: () => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
  if (mb > 1000) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

export const DownloadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [downloadedSongs, setDownloadedSongs] = useState<DownloadedSongMetadata[]>([]);
  const [totalStorageBytes, setTotalStorageBytes] = useState<number>(0);
  const [songStatesMap, setSongStatesMap] = useState<Record<string, DownloadState>>({});
  const [updateTick, setUpdateTick] = useState<number>(0);
  const { showToast } = useToast();

  const syncState = useCallback(() => {
    const songs = getAllDownloadedSongs();
    setDownloadedSongs(songs);
    setTotalStorageBytes(getTotalStorageUsedBytes());
    setUpdateTick((prev) => prev + 1);

    const map: Record<string, DownloadState> = {};
    for (const song of songs) {
      map[song.songId] = 'downloaded';
    }
    setSongStatesMap((prev) => ({ ...prev, ...map }));
  }, []);

  useEffect(() => {
    let unsubscribeNet: (() => void) | undefined;
    let unsubscribeSub: (() => void) | undefined;

    initDownloadService().then(() => {
      syncState();
      unsubscribeSub = subscribeToDownloads(syncState);
    });

    unsubscribeNet = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });

    return () => {
      if (unsubscribeNet) unsubscribeNet();
      if (unsubscribeSub) unsubscribeSub();
    };
  }, [syncState]);

  const isSongDownloaded = useCallback(
    (songId: string, songTitle?: string, songArtist?: string): boolean => {
      return checkSongDownloaded(songId, songTitle, songArtist);
    },
    []
  );

  const getSongState = useCallback(
    (songId: string, songTitle?: string, songArtist?: string): DownloadState => {
      if (!songId && !songTitle) return 'idle';
      const cleanId = sanitizeSongId(songId, songTitle, songArtist);
      const serviceStatus = getSongStatus(cleanId, songTitle, songArtist);
      if (serviceStatus !== 'idle') return serviceStatus;
      return songStatesMap[cleanId] || 'idle';
    },
    [songStatesMap]
  );

  const getSongProgress = useCallback((songId: string): number => {
    return getSongDownloadProgress(songId);
  }, []);

  const downloadSongTrack = async (song: JioSaavnSong): Promise<void> => {
    if (!song || (!song.id && !song.title)) return;
    const cleanId = sanitizeSongId(song.id, song.title, song.artist);

    if (isSongDownloaded(cleanId, song.title, song.artist)) {
      showToast('Saved for offline listening', 'info');
      return;
    }

    setSongStatesMap((prev) => ({ ...prev, [cleanId]: 'downloading' }));
    setUpdateTick((prev) => prev + 1);

    try {
      await downloadSong(song);
      setSongStatesMap((prev) => ({ ...prev, [cleanId]: 'downloaded' }));
      syncState();
      showToast('Saved for offline listening', 'info');
    } catch (err: any) {
      setSongStatesMap((prev) => ({ ...prev, [cleanId]: 'failed' }));
      syncState();
      const msg = err.message?.includes('authorized')
        ? "This track isn't available for offline listening."
        : 'Download failed. Tap to retry.';
      showToast(msg, 'error');
    }
  };

  const removeSongDownload = async (songId: string): Promise<void> => {
    if (!songId) return;
    const cleanId = sanitizeSongId(songId);
    try {
      await removeDownload(cleanId);
      setSongStatesMap((prev) => {
        const next = { ...prev };
        delete next[cleanId];
        return next;
      });
      syncState();
      showToast('Removed from downloads', 'info');
    } catch (err: any) {
      showToast('Failed to remove download', 'error');
    }
  };

  const downloadPlaylistTracks = async (
    playlistId: string,
    playlistTitle: string,
    songs: JioSaavnSong[]
  ): Promise<PlaylistDownloadMetadata> => {
    try {
      showToast(`Downloading playlist...`, 'info');
      const result = await downloadPlaylist(playlistId, playlistTitle, songs, (completed, total) => {
        syncState();
      });
      syncState();
      if (result.status === 'downloaded') {
        showToast('Playlist available offline', 'info');
      } else if (result.status === 'partially_downloaded') {
        showToast(`${result.completedCount} of ${result.totalCount} available offline`, 'info');
      } else {
        showToast('Playlist download failed', 'error');
      }
      return result;
    } catch (err: any) {
      syncState();
      showToast(err.message || 'Playlist download failed', 'error');
      throw err;
    }
  };

  const cancelPlaylistDownloadTrack = (playlistId: string) => {
    cancelPlaylistDownload(playlistId);
    showToast('Playlist download paused', 'info');
  };

  const getPlaylistStatus = (playlistId: string): PlaylistDownloadMetadata | null => {
    return getPlaylistDownloadMetadata(playlistId);
  };

  const getPlayableSource = async (song: JioSaavnSong): Promise<PlayableSourceResolution> => {
    return resolvePlayableSource(song, isOffline);
  };

  return (
    <DownloadContext.Provider
      value={{
        isOffline,
        downloadedSongs,
        totalStorageBytes,
        formattedStorageSize: formatBytes(totalStorageBytes),
        isSongDownloaded,
        getSongState,
        getSongProgress,
        downloadSongTrack,
        removeSongDownload,
        downloadPlaylistTracks,
        cancelPlaylistDownloadTrack,
        getPlaylistStatus,
        getPlayableSource,
        refreshDownloads: syncState,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
};

export const useDownloads = () => {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownloads must be used within a DownloadProvider');
  }
  return context;
};
