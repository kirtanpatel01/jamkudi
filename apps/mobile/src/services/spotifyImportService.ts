import { apiRequest } from "@/services/apiClient";
import { JioSaavnSong } from "@/services/jiosaavn";

export interface NormalizedSpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration_ms?: number;
}

export interface MatchedTrackResult {
  spotifyTrack: NormalizedSpotifyTrack;
  matched: boolean;
  confidence?: "high" | "medium" | "low";
  jamkudiTrack?: JioSaavnSong;
}

export interface SpotifyPlaylistPreviewResult {
  playlistInfo: {
    id: string;
    name: string;
    owner: string;
    artwork: string | null;
    totalTracks: number;
  };
  matchedTracks: MatchedTrackResult[];
  unmatchedTracks: NormalizedSpotifyTrack[];
}

/**
 * Sends Spotify playlist URL to backend for metadata extraction and track matching.
 */
export async function previewSpotifyImport(spotifyUrl: string): Promise<SpotifyPlaylistPreviewResult> {
  return apiRequest<SpotifyPlaylistPreviewResult>("/spotify/preview", {
    method: "POST",
    body: JSON.stringify({ spotifyUrl }),
  });
}
