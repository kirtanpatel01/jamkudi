import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { getSupabaseUserClient } from "../lib/supabase.js";
import type { AppEnv } from "../types/env.js";

const playlist = new Hono<AppEnv>();

// Require auth for all playlist operations
playlist.use("*", authMiddleware);

/**
 * GET /playlist
 * Returns all playlists and tracks belonging to the authenticated user.
 */
playlist.get("/", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  const supabase = getSupabaseUserClient(token);

  try {
    const { data: dbPlaylists, error: plErr } = await supabase
      .from("playlists")
      .select("*")
      .order("updated_at", { ascending: false });

    if (plErr) {
      return c.json({ error: "Database error", message: plErr.message }, 500);
    }

    if (!dbPlaylists || dbPlaylists.length === 0) {
      return c.json({ playlists: [] }, 200);
    }

    const playlistIds = dbPlaylists.map((p) => p.id);
    let tracksByPlaylist: Record<string, any[]> = {};

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
            tracksByPlaylist[t.playlist_id].push(t.track_data);
          }
        });
      }
    }

    const result = dbPlaylists.map((p) => ({
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      description: p.description,
      artwork: p.artwork,
      created_at: p.created_at,
      updated_at: p.updated_at,
      tracks: tracksByPlaylist[p.id] || [],
    }));

    return c.json({ playlists: result }, 200);
  } catch (err: any) {
    return c.json({ error: "Internal Server Error", message: err.message }, 500);
  }
});

/**
 * POST /playlist
 * Creates a new playlist for the authenticated user.
 */
playlist.post("/", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  const supabase = getSupabaseUserClient(token);

  const body = await c.req.json().catch(() => ({}));
  const name = (body.name || "").trim();
  const description = (body.description || "").trim();
  const artwork = body.artwork || null;

  if (!name) {
    return c.json({ error: "Validation Error", message: "Playlist name cannot be empty." }, 400);
  }

  try {
    const { data, error } = await supabase
      .from("playlists")
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        artwork,
      })
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Insert Error", message: error?.message || "Failed to create playlist" }, 500);
    }

    return c.json(
      {
        playlist: {
          id: data.id,
          user_id: data.user_id,
          name: data.name,
          description: data.description,
          artwork: data.artwork,
          created_at: data.created_at,
          updated_at: data.updated_at,
          tracks: [],
        },
      },
      201
    );
  } catch (err: any) {
    return c.json({ error: "Internal Server Error", message: err.message }, 500);
  }
});

/**
 * PATCH /playlist/:id
 * Updates playlist details for the authenticated user.
 */
playlist.patch("/:id", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  const id = c.req.param("id");
  const supabase = getSupabaseUserClient(token);

  const body = await c.req.json().catch(() => ({}));
  const name = (body.name || "").trim();
  const description = (body.description || "").trim();

  if (!name) {
    return c.json({ error: "Validation Error", message: "Playlist name cannot be empty." }, 400);
  }

  try {
    const { data, error } = await supabase
      .from("playlists")
      .update({
        name,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Update Error", message: error?.message || "Failed to update playlist" }, 500);
    }

    return c.json({ playlist: data }, 200);
  } catch (err: any) {
    return c.json({ error: "Internal Server Error", message: err.message }, 500);
  }
});

/**
 * DELETE /playlist/:id
 * Deletes a playlist belonging to the authenticated user.
 */
playlist.delete("/:id", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  const id = c.req.param("id");
  const supabase = getSupabaseUserClient(token);

  try {
    // Delete playlist tracks first
    await supabase.from("playlist_tracks").delete().eq("playlist_id", id);

    // Delete playlist
    const { error } = await supabase.from("playlists").delete().eq("id", id).eq("user_id", user.id);

    if (error) {
      return c.json({ error: "Delete Error", message: error.message }, 500);
    }

    return c.json({ success: true }, 200);
  } catch (err: any) {
    return c.json({ error: "Internal Server Error", message: err.message }, 500);
  }
});

/**
 * POST /playlist/:id/tracks
 * Adds a track to a playlist with duplicate protection.
 */
playlist.post("/:id/tracks", async (c) => {
  const token = c.get("token");
  const playlistId = c.req.param("id");
  const supabase = getSupabaseUserClient(token);

  const body = await c.req.json().catch(() => ({}));
  const track = body.track;

  if (!track || !track.id) {
    return c.json({ error: "Validation Error", message: "Track payload is required." }, 400);
  }

  try {
    // Check if song already exists in playlist
    const { data: existing } = await supabase
      .from("playlist_tracks")
      .select("id")
      .eq("playlist_id", playlistId)
      .eq("song_id", track.id)
      .maybeSingle();

    if (existing) {
      return c.json(
        {
          success: false,
          isDuplicate: true,
          message: `"${track.title}" is already in this playlist.`,
        },
        200
      );
    }

    // Get current max position
    const { count } = await supabase
      .from("playlist_tracks")
      .select("*", { count: "exact", head: true })
      .eq("playlist_id", playlistId);

    const position = (count || 0) + 1;

    const { error } = await supabase.from("playlist_tracks").insert({
      playlist_id: playlistId,
      song_id: track.id,
      track_data: track,
      position,
    });

    if (error) {
      return c.json({ error: "Insert Track Error", message: error.message }, 500);
    }

    // Update playlist updated_at
    await supabase.from("playlists").update({ updated_at: new Date().toISOString() }).eq("id", playlistId);

    return c.json({ success: true, isDuplicate: false }, 201);
  } catch (err: any) {
    return c.json({ error: "Internal Server Error", message: err.message }, 500);
  }
});

/**
 * DELETE /playlist/:id/tracks/:songId
 * Removes a track from a playlist.
 */
playlist.delete("/:id/tracks/:songId", async (c) => {
  const token = c.get("token");
  const playlistId = c.req.param("id");
  const songId = c.req.param("songId");
  const supabase = getSupabaseUserClient(token);

  try {
    const { error } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("song_id", songId);

    if (error) {
      return c.json({ error: "Remove Track Error", message: error.message }, 500);
    }

    await supabase.from("playlists").update({ updated_at: new Date().toISOString() }).eq("id", playlistId);

    return c.json({ success: true }, 200);
  } catch (err: any) {
    return c.json({ error: "Internal Server Error", message: err.message }, 500);
  }
});

/**
 * PUT /playlist/:id/tracks/reorder
 * Reorders tracks in a playlist.
 */
playlist.put("/:id/tracks/reorder", async (c) => {
  const token = c.get("token");
  const playlistId = c.req.param("id");
  const supabase = getSupabaseUserClient(token);

  const body = await c.req.json().catch(() => ({}));
  const tracks = body.tracks;

  if (!Array.isArray(tracks)) {
    return c.json({ error: "Validation Error", message: "Tracks array is required." }, 400);
  }

  try {
    const upsertRows = tracks.map((tr: any, idx: number) => ({
      playlist_id: playlistId,
      song_id: tr.id,
      track_data: tr,
      position: idx + 1,
    }));

    if (upsertRows.length > 0) {
      const { error } = await supabase
        .from("playlist_tracks")
        .upsert(upsertRows, { onConflict: "playlist_id,song_id" });

      if (error) {
        return c.json({ error: "Reorder Error", message: error.message }, 500);
      }
    }

    await supabase.from("playlists").update({ updated_at: new Date().toISOString() }).eq("id", playlistId);

    return c.json({ success: true }, 200);
  } catch (err: any) {
    return c.json({ error: "Internal Server Error", message: err.message }, 500);
  }
});

export default playlist;
