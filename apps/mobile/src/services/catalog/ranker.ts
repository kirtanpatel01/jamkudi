import { JioSaavnSong, FEATURED_ARTISTS } from "../jiosaavn";
import { normalizeQuery, extractVersionTag } from "./normalizer";

export type PrimaryIntent = "ARTIST" | "SONG" | "ALBUM" | "PLAYLIST" | "MOOD";
export type RankingProfile = "SEARCH" | "POPULAR" | "FRESH" | "MOOD";

export interface QueryIntentResult {
  primary: PrimaryIntent;
  confidence: number;
}

/**
 * Detects primary search intent & confidence score.
 * Primary intent determines section ordering & score weighting; it NEVER restricts entity retrieval.
 */
export function detectIntent(
  query: string,
  rawSongs: JioSaavnSong[],
  rawArtists: any[]
): QueryIntentResult {
  const q = normalizeQuery(query);
  const moodKeywords = ["chill", "energetic", "romantic", "focus", "party", "nostalgic", "sad", "lofi", "beats", "workout"];

  if (moodKeywords.some((k) => q.includes(k))) {
    return { primary: "MOOD", confidence: 0.9 };
  }

  const artistMatch =
    FEATURED_ARTISTS.some((a) => normalizeQuery(a.name).includes(q) || normalizeQuery(a.query).includes(q)) ||
    rawArtists.some((a) => normalizeQuery(a.name || "").includes(q));

  if (artistMatch) {
    return { primary: "ARTIST", confidence: 0.95 };
  }

  if (rawSongs.length > 0) {
    const topTitle = normalizeQuery(rawSongs[0].title);
    if (topTitle === q) return { primary: "SONG", confidence: 0.98 };
    if (topTitle.includes(q) || q.includes(topTitle)) return { primary: "SONG", confidence: 0.85 };
  }

  return { primary: "SONG", confidence: 0.7 };
}

/**
 * Scores a track based on the target surface ranking profile.
 */
export function scoreTrackByProfile(
  track: JioSaavnSong,
  query: string,
  profile: RankingProfile
): number {
  const q = normalizeQuery(query);
  const title = normalizeQuery(track.title);
  const artist = normalizeQuery(track.artist);
  const album = normalizeQuery(track.album || "");

  let score = 0;

  if (profile === "SEARCH") {
    if (title === q) score += 100;
    else if (title.startsWith(q)) score += 60;
    else if (title.includes(q)) score += 30;
    if (artist.includes(q)) score += 50;
    if (album.includes(q)) score += 20;
    if (track.artwork && track.artwork.startsWith("https")) score += 5;
  } else if (profile === "FRESH") {
    if (album && album !== title) score += 40;
    if (track.artwork && track.artwork.startsWith("https")) score += 20;
  } else if (profile === "POPULAR") {
    if (track.duration > 120 && track.duration < 360) score += 30;
    if (track.artwork) score += 20;
    if (title.length > 0) score += 10;
  } else if (profile === "MOOD") {
    if (extractVersionTag(track.title)) score += 25;
    score += 15;
  }

  return score;
}

/**
 * Ranks tracks by multi-factor relevance score using a specified ranking profile.
 */
export function rankTracksByProfile(
  tracks: JioSaavnSong[],
  query: string,
  profile: RankingProfile = "SEARCH"
): JioSaavnSong[] {
  return [...tracks].sort(
    (a, b) => scoreTrackByProfile(b, query, profile) - scoreTrackByProfile(a, query, profile)
  );
}
