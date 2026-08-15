import { supabase } from "@/lib/supabase";
import { safeStorage } from "@/utils/safeStorage";
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
  Local Storage Helpers for Anonymous/Offline mode
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
 * Fetch all playlists belonging to the current user (or guest local playlists).
 */
export async function fetchUserPlaylists(userId?: string): Promise<UserPlaylist[]> {
  if (userId) {
    try {
      // 1. Fetch playlists from Supabase
      const { data: dbPlaylists, error: plErr } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (plErr) throw plErr;
      if (!dbPlaylists) return [];

      // 2. Fetch tracks for all user playlists
      const playlistIds = dbPlaylists.map((p) => p.id);
      let tracksByPlaylist: Record<string, JioSaavnSong[]> = {};

      if (playlistIds.length > 0) {
        const { data: dbTracks, error: trErr } = await supabase
          .from("playlist_tracks")
          .select("*")
          .in("playlist_id", playlistIds)
          .order("position", { ascending: true });

        if (!trErr && dbTracks) {
          dbTracks.forEach((t) => {
            if (!tracksByPlaylist[t.playlist_id]) {
              tracksByPlaylist[t.playlist_id] = [];
            }
            if (t.track_data) {
              tracksByPlaylist[t.playlist_id].push(t.track_data as JioSaavnSong);
            }
          });
        }
      }

      return dbPlaylists.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        description: p.description,
        artwork: p.artwork,
        created_at: p.created_at,
        updated_at: p.updated_at,
        tracks: tracksByPlaylist[p.id] || [],
      }));
    } catch (err: any) {
      console.warn("Supabase fetchUserPlaylists notice, using local fallback:", err.message);
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
 * Create a new playlist.
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
      const { data, error } = await supabase
        .from("playlists")
        .insert({
          user_id: userId,
          name: trimmedName,
          description: description?.trim() || null,
          created_at: now,
          updated_at: now,
        })
        .select("*")
        .single();

      if (error) throw error;
      if (data) {
        return {
          id: data.id,
          user_id: data.user_id,
          name: data.name,
          description: data.description,
          artwork: data.artwork,
          created_at: data.created_at,
          updated_at: data.updated_at,
          tracks: [],
        };
      }
    } catch (err: any) {
      console.warn("Supabase createUserPlaylist notice, using local fallback:", err.message);
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
      const { error } = await supabase
        .from("playlists")
        .update({
          name: trimmedName,
          description: description?.trim() || null,
          updated_at: now,
        })
        .eq("id", id)
        .eq("user_id", userId);

      if (!error) return;
    } catch (err: any) {
      console.warn("Supabase updateUserPlaylist error:", err.message);
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
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (!error) return;
    } catch (err: any) {
      console.warn("Supabase deleteUserPlaylist error:", err.message);
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
  const formattedSong: JioSaavnSong = {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album || "",
    artwork: track.artwork || "",
    duration: typeof track.duration === "number" ? track.duration : parseInt((track.duration as any) || "0", 10),
    audioUrl: track.audioUrl || "",
  };

  if (userId && !playlistId.startsWith("local_pl_")) {
    try {
      // 1. Check duplicate
      const { data: existing } = await supabase
        .from("playlist_tracks")
        .select("id")
        .eq("playlist_id", playlistId)
        .eq("song_id", track.id)
        .maybeSingle();

      if (existing) {
        return { success: false, isDuplicate: true };
      }

      // 2. Count positions
      const { count } = await supabase
        .from("playlist_tracks")
        .select("*", { count: "exact", head: true })
        .eq("playlist_id", playlistId);

      const nextPos = count || 0;

      // 3. Insert track
      const { error } = await supabase.from("playlist_tracks").insert({
        playlist_id: playlistId,
        song_id: track.id,
        track_data: formattedSong,
        position: nextPos,
      });

      if (error) {
        if (error.code === "23505") {
          return { success: false, isDuplicate: true };
        }
        throw error;
      }

      // Update playlist timestamp and artwork if empty
      await supabase
        .from("playlists")
        .update({
          updated_at: new Date().toISOString(),
          artwork: formattedSong.artwork || null,
        })
        .eq("id", playlistId);

      return { success: true, isDuplicate: false };
    } catch (err: any) {
      console.warn("Supabase addTrackToUserPlaylist notice, using local fallback:", err.message);
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
      const { error } = await supabase
        .from("playlist_tracks")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("song_id", songId);

      if (!error) return;
    } catch (err: any) {
      console.warn("Supabase removeTrackFromUserPlaylist error:", err.message);
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
      // Re-upsert positions in Supabase
      const upsertRows = reorderedTracks.map((t, idx) => ({
        playlist_id: playlistId,
        song_id: t.id,
        track_data: t,
        position: idx,
      }));

      await supabase.from("playlist_tracks").upsert(upsertRows, { onConflict: "playlist_id,song_id" });
      return;
    } catch (err: any) {
      console.warn("Supabase reorderUserPlaylistTracks error:", err.message);
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
