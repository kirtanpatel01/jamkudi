import { Hono } from "hono";
import { parseSpotifyPlaylistUrl, processSpotifyPlaylistImport } from "../services/spotifyService.js";

const spotify = new Hono();

/**
 * POST /spotify/preview
 * Accepts { spotifyUrl: string }, validates URL, fetches Spotify metadata & tracks,
 * matches tracks against Jamkudi catalog, and returns import preview payload.
 */
spotify.post("/preview", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const spotifyUrl = body.spotifyUrl || body.url;

    const validation = parseSpotifyPlaylistUrl(spotifyUrl);
    if (!validation.isValid || !validation.playlistId) {
      return c.json(
        {
          error: "Invalid URL",
          message: validation.error || "This doesn't look like a valid Spotify playlist URL.",
        },
        400
      );
    }

    const previewResult = await processSpotifyPlaylistImport(validation.playlistId);

    return c.json(previewResult, 200);
  } catch (err: any) {
    console.error("[Spotify Import Error]:", err.message);
    return c.json(
      {
        error: "Import Failed",
        message: err.message || "Failed to process Spotify playlist import.",
      },
      400
    );
  }
});

export default spotify;
