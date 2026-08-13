import { JioSaavnSong } from "../jiosaavn";

/**
 * Normalizes query strings with Unicode normalization, lowercase, punctuation removal, and space collapsing.
 */
export function normalizeQuery(query: string): string {
  if (!query) return "";
  return query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts version markers (e.g. remix, acoustic, live, lofi) to avoid collapsing distinct recordings.
 */
export function extractVersionTag(title: string): string {
  if (!title) return "";
  const norm = title.toLowerCase();
  const versions = [
    "remix",
    "acoustic",
    "live",
    "unplugged",
    "lofi",
    "lo-fi",
    "reprise",
    "sad version",
    "female version",
    "instrumental",
    "cover",
  ];
  for (const v of versions) {
    if (norm.includes(v)) return v;
  }
  return "";
}

/**
 * Generates a canonical fingerprint key for Level 2 deduplication.
 */
export function getCanonicalFingerprint(track: JioSaavnSong): string {
  const normTitle = normalizeQuery(track.title);
  const normArtist = normalizeQuery(track.artist);
  const version = extractVersionTag(track.title);
  // Group duration into 4-second buckets to account for small trim variations across uploads
  const durationBucket = Math.round((track.duration || 0) / 4);

  return `${normTitle}:${normArtist}:${durationBucket}${version ? `:${version}` : ""}`;
}

/**
 * Calculates a metadata quality score for choosing the canonical candidate.
 */
export function calculateMetadataQuality(track: JioSaavnSong): number {
  let score = 0;
  if (track.artwork && track.artwork.startsWith("https")) score += 40;
  if (track.audioUrl && track.audioUrl.startsWith("https")) score += 30;
  if (track.album && normalizeQuery(track.album) === normalizeQuery(track.title)) score += 20;
  if (track.duration > 30) score += 10;
  return score;
}
