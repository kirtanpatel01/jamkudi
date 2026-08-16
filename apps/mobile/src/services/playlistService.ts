import { safeStorage } from "@/utils/safeStorage";
import { apiRequest } from "@/services/apiClient";
import { Track } from "@/types/track";
import { JioSaavnSong } from "./jiosaavn";

const LOCAL_PLAYLISTS_KEY = "@jamkudi/user_playlists";

export interface UserPlaylist {
  id: string;
  user_id?: string;
  name: string;
  description?: string | null;
  artwork?: string | null;
  created_at: string;
  updated_at: string;
  tracks: JioSaavnSong[];
}

/**
 * Local Storage Helpers for Anonymous/Offline mode
 */
async function getLocalPlaylists(): Promise<UserPlaylist[]> {
  try {
    const raw = await safeStorage.getItem(LOCAL_PLAYLISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveLocalPlaylists(playlists: UserPlaylist[]): Promise<void> {
  try {
    await safeStorage.setItem(LOCAL_PLAYLISTS_KEY, JSON.stringify(playlists));
  } catch {}
}

/**
 * Fetch all playlists belonging to the current user (via Backend API or guest local fallback).
 */
export async function fetchUserPlaylists(userId?: string): Promise<UserPlaylist[]> {
  if (userId) {
    try {
      const res = await apiRequest<{ playlists: UserPlaylist[] }>("/playlist");
      if (res && Array.isArray(res.playlists)) {
        return res.playlists;
      }
    } catch (err: any) {
      console.warn("Backend fetchUserPlaylists notice, using local fallback:", err.message);
    }
  }

  return await getLocalPlaylists();
}

/**
 * Fetch a single user playlist by ID.
 */
export async function fetchUserPlaylistById(id: string, userId?: string): Promise<UserPlaylist | null> {
  const playlists = await fetchUserPlaylists(userId);
  return playlists.find((p) => p.id === id) || null;
}

/**
 * Create a new playlist via Backend API or local storage fallback.
 */
export async function createUserPlaylist(
  name: string,
  description?: string,
  userId?: string
): Promise<UserPlaylist> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Playlist name cannot be empty");
  }

  const now = new Date().toISOString();

  if (userId) {
    try {
      const res = await apiRequest<{ playlist: UserPlaylist }>("/playlist", {
        method: "POST",
        body: JSON.stringify({
          name: trimmedName,
          description: description?.trim() || null,
        }),
      });

      if (res && res.playlist) {
        return res.playlist;
      }
    } catch (err: any) {
      console.warn("Backend createUserPlaylist notice, using local fallback:", err.message);
    }
  }

  const localPlaylists = await getLocalPlaylists();
  const newPlaylist: UserPlaylist = {
    id: `local_pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: trimmedName,
    description: description?.trim() || null,
    created_at: now,
    updated_at: now,
    tracks: [],
  };

  await saveLocalPlaylists([newPlaylist, ...localPlaylists]);
  return newPlaylist;
}

/**
 * Update a playlist's metadata (name & description).
 */
export async function updateUserPlaylist(
  id: string,
  name: string,
  description?: string,
  userId?: string
): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Playlist name cannot be empty");

  const now = new Date().toISOString();

  if (userId && !id.startsWith("local_pl_")) {
    try {
      await apiRequest(`/playlist/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: trimmedName,
          description: description?.trim() || null,
        }),
      });
      return;
    } catch (err: any) {
      console.warn("Backend updateUserPlaylist error:", err.message);
    }
  }

  const local = await getLocalPlaylists();
  const updated = local.map((p) =>
    p.id === id
      ? { ...p, name: trimmedName, description: description?.trim() || null, updated_at: now }
      : p
  );
  await saveLocalPlaylists(updated);
}

/**
 * Delete a playlist completely.
 */
export async function deleteUserPlaylist(id: string, userId?: string): Promise<void> {
  if (userId && !id.startsWith("local_pl_")) {
    try {
      await apiRequest(`/playlist/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return;
    } catch (err: any) {
      console.warn("Backend deleteUserPlaylist error:", err.message);
    }
  }

  const local = await getLocalPlaylists();
  const updated = local.filter((p) => p.id !== id);
  await saveLocalPlaylists(updated);
}

/**
 * Add a track to a playlist. Guarantees no duplicate songs in a playlist.
 */
export async function addTrackToUserPlaylist(
  playlistId: string,
  track: Track | JioSaavnSong,
  userId?: string
): Promise<{ success: boolean; isDuplicate: boolean }> {
  // Standardize track object
  let rawAudio =
    track.audioUrl ||
    (track as any).url ||
    (Array.isArray((track as any).downloadUrl)
      ? (track as any).downloadUrl.find((d: any) => d?.quality === '320kbps')?.url ||
        (track as any).downloadUrl[(track as any).downloadUrl.length - 1]?.url
      : (track as any).downloadUrl) ||
    '';

  const formattedSong: JioSaavnSong = {
    id: track.id || `${track.title}_${track.artist}`,
    title: track.title,
    artist: track.artist,
    album: track.album || "",
    artwork: track.artwork || "",
    duration: typeof track.duration === "number" ? track.duration : parseInt((track.duration as any) || "0", 10),
    audioUrl: rawAudio,
    downloadUrl: (track as any).downloadUrl || rawAudio,
  } as any;

  if (userId && !playlistId.startsWith("local_pl_")) {
    try {
      const res = await apiRequest<{ success: boolean; isDuplicate: boolean }>(
        `/playlist/${encodeURIComponent(playlistId)}/tracks`,
        {
          method: "POST",
          body: JSON.stringify({ track: formattedSong }),
        }
      );
      if (res) {
        return res;
      }
    } catch (err: any) {
      console.warn("Backend addTrackToUserPlaylist notice, using local fallback:", err.message);
    }
  }

  const local = await getLocalPlaylists();
  const targetIndex = local.findIndex((p) => p.id === playlistId);

  if (targetIndex !== -1) {
    const target = local[targetIndex];
    const isDup = target.tracks.some((t) => t.id === track.id);
    if (isDup) {
      return { success: false, isDuplicate: true };
    }

    const updatedTarget: UserPlaylist = {
      ...target,
      artwork: target.artwork || formattedSong.artwork || null,
      updated_at: new Date().toISOString(),
      tracks: [...target.tracks, formattedSong],
    };

    local[targetIndex] = updatedTarget;
    await saveLocalPlaylists(local);
    return { success: true, isDuplicate: false };
  }

  return { success: false, isDuplicate: false };
}

/**
 * Remove a track from a playlist.
 */
export async function removeTrackFromUserPlaylist(
  playlistId: string,
  songId: string,
  userId?: string
): Promise<void> {
  if (userId && !playlistId.startsWith("local_pl_")) {
    try {
      await apiRequest(`/playlist/${encodeURIComponent(playlistId)}/tracks/${encodeURIComponent(songId)}`, {
        method: "DELETE",
      });
      return;
    } catch (err: any) {
      console.warn("Backend removeTrackFromUserPlaylist error:", err.message);
    }
  }

  const local = await getLocalPlaylists();
  const updated = local.map((p) => {
    if (p.id === playlistId) {
      return {
        ...p,
        updated_at: new Date().toISOString(),
        tracks: p.tracks.filter((t) => t.id !== songId),
      };
    }
    return p;
  });

  await saveLocalPlaylists(updated);
}

/**
 * Reorder tracks within a playlist.
 */
export async function reorderUserPlaylistTracks(
  playlistId: string,
  reorderedTracks: JioSaavnSong[],
  userId?: string
): Promise<void> {
  if (userId && !playlistId.startsWith("local_pl_")) {
    try {
      await apiRequest(`/playlist/${encodeURIComponent(playlistId)}/tracks/reorder`, {
        method: "PUT",
        body: JSON.stringify({ tracks: reorderedTracks }),
      });
      return;
    } catch (err: any) {
      console.warn("Backend reorderUserPlaylistTracks error:", err.message);
    }
  }

  const local = await getLocalPlaylists();
  const updated = local.map((p) => {
    if (p.id === playlistId) {
      return { ...p, tracks: reorderedTracks, updated_at: new Date().toISOString() };
    }
    return p;
  });

  await saveLocalPlaylists(updated);
}
