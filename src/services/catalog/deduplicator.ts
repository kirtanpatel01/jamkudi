import { JioSaavnSong } from "../jiosaavn";
import {
  getCanonicalFingerprint,
  calculateMetadataQuality,
} from "./normalizer";

/**
 * Deduplicates raw track candidate feeds using 2-level canonical identity resolution.
 * - Level 1: Provider ID match (same ID -> duplicate)
 * - Level 2: Canonical fingerprint match (title + artist + durationBucket + versionTag)
 */
export function deduplicateTracks(tracks: JioSaavnSong[]): JioSaavnSong[] {
  if (!tracks || tracks.length === 0) return [];

  // Level 1: Deduplicate by exact Provider ID
  const level1Map = new Map<string, JioSaavnSong>();
  tracks.forEach((track) => {
    if (!level1Map.has(track.id)) {
      level1Map.set(track.id, track);
    }
  });

  const level1Tracks = Array.from(level1Map.values());

  // Level 2: Deduplicate by Canonical Content Fingerprint
  const canonicalMap = new Map<string, JioSaavnSong>();

  level1Tracks.forEach((track) => {
    const fingerprint = getCanonicalFingerprint(track);

    if (!canonicalMap.has(fingerprint)) {
      canonicalMap.set(fingerprint, track);
    } else {
      const existing = canonicalMap.get(fingerprint)!;
      const currentScore = calculateMetadataQuality(track);
      const existingScore = calculateMetadataQuality(existing);

      // Prefer candidate with higher metadata quality score
      if (currentScore > existingScore) {
        canonicalMap.set(fingerprint, track);
      }
    }
  });

  return Array.from(canonicalMap.values());
}
