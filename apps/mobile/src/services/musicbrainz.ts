import { getFromCatalogCache, setInCatalogCache } from "./catalog/cache";

export interface MusicBrainzReleaseInfo {
  title: string;
  artist: string;
  releaseDate: string | null; // Format: "YYYY-MM-DD" or "YYYY"
  releaseYear: number | null;
  isFresh: boolean;
}

const MUSICBRAINZ_BASE = "https://musicbrainz.org/ws/2/";
const USER_AGENT = "JamkudiMusicApp/1.0.0 ( contact@jamkudi.app )";

/**
 * Searches MusicBrainz for canonical release metadata and release dates.
 */
export async function fetchMusicBrainzReleaseInfo(
  title: string,
  artist: string
): Promise<MusicBrainzReleaseInfo | null> {
  const normTitle = title.toLowerCase().trim();
  const normArtist = artist.toLowerCase().trim();
  const cacheKey = `mb:release:${normArtist}:${normTitle}`;

  const cached = getFromCatalogCache<MusicBrainzReleaseInfo>(cacheKey);
  if (cached) return cached;

  try {
    const luceneQuery = `recording:"${encodeURIComponent(title)}" AND artist:"${encodeURIComponent(artist)}"`;
    const url = `${MUSICBRAINZ_BASE}recording?query=${luceneQuery}&fmt=json&limit=3`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !Array.isArray(data.recordings) || data.recordings.length === 0) {
      return null;
    }

    const recording = data.recordings[0];
    let earliestDate: string | null = null;

    // Check first-release-date or release events
    if (recording["first-release-date"]) {
      earliestDate = recording["first-release-date"];
    } else if (Array.isArray(recording.releases) && recording.releases.length > 0) {
      for (const rel of recording.releases) {
        if (rel.date) {
          if (!earliestDate || rel.date < earliestDate) {
            earliestDate = rel.date;
          }
        }
      }
    }

    let releaseYear: number | null = null;
    if (earliestDate) {
      const yearPart = parseInt(earliestDate.split("-")[0], 10);
      if (!isNaN(yearPart)) {
        releaseYear = yearPart;
      }
    }

    const isFresh = isDateFresh(earliestDate);

    const info: MusicBrainzReleaseInfo = {
      title,
      artist,
      releaseDate: earliestDate,
      releaseYear,
      isFresh,
    };

    setInCatalogCache(cacheKey, info, "FRESH");
    return info;
  } catch (err) {
    return null;
  }
}

/**
 * Checks if a release date is fresh (e.g. within current or previous year / < 365 days).
 */
export function isDateFresh(dateStr?: string | null, maxDays = 365): boolean {
  if (!dateStr) return false;

  const currentYear = new Date().getFullYear();
  const yearPart = parseInt(dateStr.split("-")[0], 10);

  if (isNaN(yearPart)) return false;

  // Release within last 1-2 years
  if (yearPart >= currentYear - 1) {
    if (dateStr.length >= 10) {
      const releaseTimestamp = new Date(dateStr).getTime();
      if (!isNaN(releaseTimestamp)) {
        const diffDays = (Date.now() - releaseTimestamp) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= maxDays;
      }
    }
    return true;
  }

  return false;
}
