import { JioSaavnSong, searchSongs, getTrendingFeed } from "./jiosaavn";
import { fetchLastFmTopTracks, fetchLastFmTagTracks } from "./lastfm";
import { fetchMusicBrainzReleaseInfo } from "./musicbrainz";
import { deduplicateTracks } from "./catalog/deduplicator";
import { normalizeQuery } from "./catalog/normalizer";
import { getFromCatalogCache, setInCatalogCache } from "./catalog/cache";

export interface NormalizedTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string | null;
  duration?: number;
  releaseDate?: string | null;
  language?: string;
  jiosaavnId?: string;
  source: "lastfm" | "musicbrainz" | "jiosaavn" | "unified";
}

export interface UserContextSignal {
  history: JioSaavnSong[];
  favoriteArtists: Array<{ name: string; imageUrl?: string }>;
  favoriteGenres: string[];
}

export interface HomeDiscoveryResult {
  freshReleases: JioSaavnSong[];
  trendingHits: JioSaavnSong[];
  favoriteArtistsList: Array<{ name: string; imageUrl: string }>;
  discoverMore: JioSaavnSong[];
}

const MAX_ARTIST_REPETITION_PER_ROW = 2;
const MAX_ARTIST_REPETITION_GLOBAL = 3;
const MIN_FAVORITE_ARTISTS_FOR_SECTION = 3;

const INDIAN_LANGUAGES = new Set([
  "hindi",
  "gujarati",
  "punjabi",
  "tamil",
  "telugu",
  "marathi",
  "bengali",
  "kannada",
  "malayalam",
  "bhojpuri",
  "rajasthani",
  "haryanvi",
  "assamese",
  "odia",
  "santhali",
  "konkani",
  "tulu",
  "urdu",
]);

const INTERNATIONAL_LANGUAGES = new Set([
  "english",
  "spanish",
  "french",
  "german",
  "korean",
  "japanese",
  "italian",
]);

export function getTrackRegionCategory(song: JioSaavnSong): "indian" | "international" | "unknown" {
  if (!song || !song.language) return "unknown";
  const lang = song.language.toLowerCase().trim();
  if (INDIAN_LANGUAGES.has(lang)) return "indian";
  if (INTERNATIONAL_LANGUAGES.has(lang)) return "international";
  return "unknown";
}

function cleanTitle(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getFingerprint(title: string, artist: string): string {
  return `${normalizeQuery(title)}::${normalizeQuery(artist)}`;
}

/**
 * Resolves metadata track candidates to playable JioSaavnSong objects
 */
export async function resolveNormalizedTrackToJioSaavn(
  title: string,
  artist: string
): Promise<JioSaavnSong | null> {
  const normTitle = normalizeQuery(title);
  const normArtist = normalizeQuery(artist);
  const cacheKey = `resolve:${normArtist}:${normTitle}`;

  const cached = getFromCatalogCache<JioSaavnSong>(cacheKey);
  if (cached) return cached;

  try {
    const results = await searchSongs(`${title} ${artist}`, 0, 5);
    if (!results || results.length === 0) return null;

    let bestMatch = results[0];
    for (const song of results) {
      const songTitle = normalizeQuery(song.title);
      const songArtist = normalizeQuery(song.artist);

      if (songTitle === normTitle && songArtist.includes(normArtist)) {
        bestMatch = song;
        break;
      }
    }

    setInCatalogCache(cacheKey, bestMatch, "SEARCH");
    return bestMatch;
  } catch {
    return null;
  }
}

export interface FilterResult {
  accepted: JioSaavnSong[];
  removedAlreadySeen: number;
  removedArtistLimit: number;
}

/**
 * Applies generic artist diversity caps, balanced cultural language mix, and track-level cross-section deduplication
 */
export function applyBalancedDiscoveryFilter(
  candidates: JioSaavnSong[],
  globalSeenFingerprints: Set<string>,
  globalArtistCounts: Map<string, number>,
  maxTargetCount = 12,
  maxPerRow = MAX_ARTIST_REPETITION_PER_ROW,
  maxGlobal = MAX_ARTIST_REPETITION_GLOBAL
): FilterResult {
  const rowArtistCounts = new Map<string, number>();
  
  const indianCandidates: JioSaavnSong[] = [];
  const internationalCandidates: JioSaavnSong[] = [];
  const unknownCandidates: JioSaavnSong[] = [];

  let removedAlreadySeen = 0;
  let removedArtistLimit = 0;

  for (const song of candidates) {
    if (!song || !song.title || !song.artist) continue;

    const fingerprint = getFingerprint(song.title, song.artist);
    if (globalSeenFingerprints.has(fingerprint)) {
      removedAlreadySeen++;
      continue;
    }

    const normArtist = normalizeQuery(song.artist);
    const rowCount = rowArtistCounts.get(normArtist) || 0;
    const globalCount = globalArtistCounts.get(normArtist) || 0;

    if (rowCount >= maxPerRow || globalCount >= maxGlobal) {
      removedArtistLimit++;
      continue;
    }

    const cat = getTrackRegionCategory(song);
    if (cat === "indian") indianCandidates.push(song);
    else if (cat === "international") internationalCandidates.push(song);
    else unknownCandidates.push(song);
  }

  // Interleave candidates to maintain a balanced cultural mix (~65% Indian, ~25% International, ~10% Unknown)
  const accepted: JioSaavnSong[] = [];
  let iIdx = 0, intIdx = 0, uIdx = 0;

  while (
    accepted.length < maxTargetCount &&
    (iIdx < indianCandidates.length || intIdx < internationalCandidates.length || uIdx < unknownCandidates.length)
  ) {
    // Add up to 2 Indian candidates
    for (let count = 0; count < 2 && iIdx < indianCandidates.length && accepted.length < maxTargetCount; count++) {
      const song = indianCandidates[iIdx++];
      const fp = getFingerprint(song.title, song.artist);
      const normArtist = normalizeQuery(song.artist);
      globalSeenFingerprints.add(fp);
      rowArtistCounts.set(normArtist, (rowArtistCounts.get(normArtist) || 0) + 1);
      globalArtistCounts.set(normArtist, (globalArtistCounts.get(normArtist) || 0) + 1);
      accepted.push(song);
    }

    // Add 1 International candidate
    if (intIdx < internationalCandidates.length && accepted.length < maxTargetCount) {
      const song = internationalCandidates[intIdx++];
      const fp = getFingerprint(song.title, song.artist);
      const normArtist = normalizeQuery(song.artist);
      globalSeenFingerprints.add(fp);
      rowArtistCounts.set(normArtist, (rowArtistCounts.get(normArtist) || 0) + 1);
      globalArtistCounts.set(normArtist, (globalArtistCounts.get(normArtist) || 0) + 1);
      accepted.push(song);
    }

    // Add 1 Unknown metadata candidate
    if (uIdx < unknownCandidates.length && accepted.length < maxTargetCount) {
      const song = unknownCandidates[uIdx++];
      const fp = getFingerprint(song.title, song.artist);
      const normArtist = normalizeQuery(song.artist);
      globalSeenFingerprints.add(fp);
      rowArtistCounts.set(normArtist, (rowArtistCounts.get(normArtist) || 0) + 1);
      globalArtistCounts.set(normArtist, (globalArtistCounts.get(normArtist) || 0) + 1);
      accepted.push(song);
    }
  }

  return {
    accepted,
    removedAlreadySeen,
    removedArtistLimit,
  };
}

const HOME_FEED_CACHE_VERSION = "v3";

/**
 * Main Home recommendation & discovery pipeline
 */
export async function generateHomeDiscoveryFeed(
  userContext: UserContextSignal
): Promise<HomeDiscoveryResult> {
  const cacheKey = `recommendation:home:feed:${HOME_FEED_CACHE_VERSION}:${userContext.favoriteArtists.length}`;
  const cached = getFromCatalogCache<HomeDiscoveryResult>(cacheKey);
  if (cached) {
    console.log(`[HOME FEED CACHE] HIT - Key: ${cacheKey}`);
    return cached;
  }
  console.log(`[HOME FEED CACHE] MISS - Key: ${cacheKey} - Generating fresh feed...`);

  const globalSeenFingerprints = new Set<string>();
  const globalArtistCounts = new Map<string, number>();

  const hasSufficientFavArtists =
    userContext.favoriteArtists.length >= MIN_FAVORITE_ARTISTS_FOR_SECTION;

  // 1. Multi-Source Candidate Retrieval
  const [lastFmIndian, lastFmBollywood, lastFmPunjabi, lastFmIndie, lastFmRock, lastFmPop, rawTrending] = await Promise.all([
    fetchLastFmTagTracks("indian", 30),
    fetchLastFmTagTracks("bollywood", 30),
    fetchLastFmTagTracks("punjabi", 20),
    fetchLastFmTagTracks("indie", 20),
    fetchLastFmTagTracks("rock", 20),
    fetchLastFmTagTracks("pop", 20),
    getTrendingFeed(),
  ]);

  console.log(`[POOL:RAW] LastFmIndian=${lastFmIndian.length}, LastFmBollywood=${lastFmBollywood.length}, LastFmPunjabi=${lastFmPunjabi.length}, LastFmIndie=${lastFmIndie.length}, LastFmRock=${lastFmRock.length}, LastFmPop=${lastFmPop.length}, JioSaavnTrending=${rawTrending.length}`);

  // 2. Resolve Metadata Candidates to Playable Streamable Tracks
  const regionalMetadata = deduplicateTracks([
    ...lastFmBollywood.map(t => ({ id: `lfm_${t.name}`, title: t.name, artist: t.artist, artwork: t.artwork || "", audioUrl: "", duration: 0 })),
    ...lastFmIndian.map(t => ({ id: `lfm_${t.name}`, title: t.name, artist: t.artist, artwork: t.artwork || "", audioUrl: "", duration: 0 })),
    ...lastFmPunjabi.map(t => ({ id: `lfm_${t.name}`, title: t.name, artist: t.artist, artwork: t.artwork || "", audioUrl: "", duration: 0 })),
  ]);

  const genreMetadata = deduplicateTracks([
    ...lastFmIndie.map(t => ({ id: `lfm_${t.name}`, title: t.name, artist: t.artist, artwork: t.artwork || "", audioUrl: "", duration: 0 })),
    ...lastFmRock.map(t => ({ id: `lfm_${t.name}`, title: t.name, artist: t.artist, artwork: t.artwork || "", audioUrl: "", duration: 0 })),
    ...lastFmPop.map(t => ({ id: `lfm_${t.name}`, title: t.name, artist: t.artist, artwork: t.artwork || "", audioUrl: "", duration: 0 })),
  ]);

  const resolvedRegionalPromises = regionalMetadata.slice(0, 35).map((t) =>
    resolveNormalizedTrackToJioSaavn(t.title, t.artist)
  );
  const resolvedRegional = (await Promise.all(resolvedRegionalPromises)).filter(
    (s): s is JioSaavnSong => Boolean(s)
  );

  const resolvedGenrePromises = genreMetadata.slice(0, 25).map((t) =>
    resolveNormalizedTrackToJioSaavn(t.title, t.artist)
  );
  const resolvedGenre = (await Promise.all(resolvedGenrePromises)).filter(
    (s): s is JioSaavnSong => Boolean(s)
  );

  console.log(`[POOL:RESOLVED] RegionalResolved=${resolvedRegional.length}, GenreResolved=${resolvedGenre.length}, TrendingDirect=${rawTrending.length}`);

  // 3. FRESH DISCOVERY
  const freshCandidatePool = deduplicateTracks([...rawTrending, ...resolvedRegional]);
  const freshValidatedPromises = freshCandidatePool.map(async (song) => {
    if (!song.title || !song.artist) return null;
    const mbInfo = await fetchMusicBrainzReleaseInfo(song.title, song.artist);
    if (mbInfo && mbInfo.isFresh) {
      return song;
    }
    if (!mbInfo && song.artwork) {
      return song;
    }
    return null;
  });

  const freshCandidates = (await Promise.all(freshValidatedPromises)).filter(
    (s): s is JioSaavnSong => Boolean(s)
  );

  const freshFilterResult = applyBalancedDiscoveryFilter(
    freshCandidates,
    globalSeenFingerprints,
    globalArtistCounts,
    12
  );

  console.log(`[FILTER:FRESH] Before=${freshCandidatePool.length}, AfterFreshness=${freshCandidates.length}, Accepted=${freshFilterResult.accepted.length}, RemovedAlreadySeen=${freshFilterResult.removedAlreadySeen}, RemovedArtistLimit=${freshFilterResult.removedArtistLimit}`);

  // 4. TRENDING HITS
  const trendingCandidatePool = deduplicateTracks([...rawTrending, ...resolvedRegional, ...resolvedGenre]);
  const trendingFilterResult = applyBalancedDiscoveryFilter(
    trendingCandidatePool,
    globalSeenFingerprints,
    globalArtistCounts,
    12
  );

  console.log(`[FILTER:TRENDING] Before=${trendingCandidatePool.length}, Accepted=${trendingFilterResult.accepted.length}, RemovedAlreadySeen=${trendingFilterResult.removedAlreadySeen}, RemovedArtistLimit=${trendingFilterResult.removedArtistLimit}`);

  // 5. FAVORITE ARTISTS LIST (Conditional based on evidence threshold >= 3)
  const favoriteArtistsList: Array<{ name: string; imageUrl: string }> = [];
  if (hasSufficientFavArtists) {
    userContext.favoriteArtists.forEach((a) => {
      if (a.name && favoriteArtistsList.length < 8) {
        favoriteArtistsList.push({
          name: cleanTitle(a.name),
          imageUrl: a.imageUrl || "",
        });
      }
    });
  }

  // 6. DISCOVER MORE
  const discoverMorePool = deduplicateTracks([...resolvedGenre, ...resolvedRegional, ...rawTrending]);
  const discoverFilterResult = applyBalancedDiscoveryFilter(
    discoverMorePool,
    globalSeenFingerprints,
    globalArtistCounts,
    15
  );

  console.log(`[FILTER:DISCOVER] Before=${discoverMorePool.length}, Accepted=${discoverFilterResult.accepted.length}, RemovedAlreadySeen=${discoverFilterResult.removedAlreadySeen}, RemovedArtistLimit=${discoverFilterResult.removedArtistLimit}`);

  // Overall Categorization Report
  const allResolvedCandidates = deduplicateTracks([...rawTrending, ...resolvedRegional, ...resolvedGenre]);
  let totalIndian = 0, totalInternational = 0, totalUnknown = 0;
  const allDetectedLangs = new Set<string>();

  allResolvedCandidates.forEach((s) => {
    if (s.language) allDetectedLangs.add(s.language);
    const cat = getTrackRegionCategory(s);
    if (cat === "indian") totalIndian++;
    else if (cat === "international") totalInternational++;
    else totalUnknown++;
  });

  console.log(`[OVERALL CATEGORIZATION REPORT]`);
  console.log(`Total Resolved Playable Candidates: ${allResolvedCandidates.length}`);
  console.log(`Indian: ${totalIndian}, International: ${totalInternational}, Unknown: ${totalUnknown}`);
  console.log(`Detected Languages: ${Array.from(allDetectedLangs).join(", ") || "none"}`);

  const result: HomeDiscoveryResult = {
    freshReleases: freshFilterResult.accepted,
    trendingHits: trendingFilterResult.accepted,
    favoriteArtistsList,
    discoverMore: discoverFilterResult.accepted,
  };

  setInCatalogCache(cacheKey, result, "POPULAR");
  return result;
}
