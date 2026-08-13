import {
  JioSaavnSong,
  searchSongs,
  searchArtists,
  searchAlbums,
  searchPlaylists,
  FEATURED_ARTISTS,
  getTrendingFeed,
  getArtistDetails,
  getAlbumDetails,
  ArtistDetails,
  AlbumDetails,
} from "../jiosaavn";
import { normalizeQuery } from "./normalizer";
import { deduplicateTracks } from "./deduplicator";
import { detectIntent, rankTracksByProfile, QueryIntentResult } from "./ranker";
import { getFromCatalogCache, setInCatalogCache, getOrFetchInFlight } from "./cache";

export interface SearchArtistEntity {
  type: "artist";
  id: string;
  name: string;
  imageUrl: string;
  query: string;
}

export interface SearchAlbumEntity {
  type: "album";
  id: string;
  title: string;
  artist: string;
  artwork: string;
}

export interface SearchPlaylistEntity {
  type: "playlist";
  id: string;
  title: string;
  subtitle?: string;
  artwork: string;
}

export interface CatalogSearchResult {
  query: string;
  normalizedQuery: string;
  intent: QueryIntentResult;
  sections: {
    artists: SearchArtistEntity[];
    songs: JioSaavnSong[];
    albums: SearchAlbumEntity[];
    playlists: SearchPlaylistEntity[];
  };
  totalResults: number;
  metadata: {
    fromCache: boolean;
    fetchedAt: number;
  };
}

/**
 * Search Catalog Method: Multi-entity parallel API retrieval with intent classification.
 */
export async function fetchSearchCatalog(query: string): Promise<CatalogSearchResult> {
  const normQuery = normalizeQuery(query);

  if (!normQuery) {
    return {
      query,
      normalizedQuery: normQuery,
      intent: { primary: "SONG", confidence: 0 },
      sections: { artists: [], songs: [], albums: [], playlists: [] },
      totalResults: 0,
      metadata: { fromCache: false, fetchedAt: Date.now() },
    };
  }

  const cacheKey = `search:v2:${normQuery}:all`;
  const cached = getFromCatalogCache<CatalogSearchResult>(cacheKey);
  if (cached) {
    return {
      ...cached,
      metadata: { ...cached.metadata, fromCache: true },
    };
  }

  return getOrFetchInFlight(cacheKey, async () => {
    // 1. Parallel Multi-Entity API Retrieval
    const [rawSongs, rawArtists, rawAlbums, rawPlaylists] = await Promise.all([
      searchSongs(normQuery, 0, 30),
      searchArtists(normQuery),
      searchAlbums(normQuery),
      searchPlaylists(normQuery),
    ]);

    // 2. Intent & Confidence Detection
    const intent = detectIntent(normQuery, rawSongs, rawArtists);

    // 3. Process Artists Entities
    const artists: SearchArtistEntity[] = [];
    FEATURED_ARTISTS.forEach((a) => {
      if (normalizeQuery(a.name).includes(normQuery) || normalizeQuery(a.query).includes(normQuery)) {
        artists.push({
          type: "artist",
          id: a.id,
          name: a.name,
          imageUrl: a.imageUrl,
          query: a.query,
        });
      }
    });

    rawArtists.forEach((a) => {
      const name = a.name || "";
      if (name && !artists.some((existing) => normalizeQuery(existing.name) === normalizeQuery(name))) {
        let imageUrl = "";
        if (typeof a.image === "string") imageUrl = a.image;
        else if (Array.isArray(a.image) && a.image.length > 0) imageUrl = a.image[a.image.length - 1].url;

        artists.push({
          type: "artist",
          id: a.id || `artist_${normalizeQuery(name)}`,
          name,
          imageUrl,
          query: name,
        });
      }
    });

    // 4. Level 1 & Level 2 Deduplicate and Rank Songs
    const deduplicatedSongs = deduplicateTracks(rawSongs);
    const rankedSongs = rankTracksByProfile(
      deduplicatedSongs,
      normQuery,
      intent.primary === "MOOD" ? "MOOD" : "SEARCH"
    );

    // 5. Process Albums Entities
    const albums: SearchAlbumEntity[] = [];
    rawAlbums.forEach((alb) => {
      let artwork = "";
      if (typeof alb.image === "string") artwork = alb.image;
      else if (Array.isArray(alb.image) && alb.image.length > 0) artwork = alb.image[alb.image.length - 1].url;

      albums.push({
        type: "album",
        id: alb.id || `album_${normalizeQuery(alb.name)}`,
        title: alb.name,
        artist: alb.artist || "Various Artists",
        artwork,
      });
    });

    if (albums.length === 0) {
      const albumMap = new Map<string, SearchAlbumEntity>();
      rankedSongs.forEach((song) => {
        if (song.album && normalizeQuery(song.album).includes(normQuery)) {
          const albumKey = normalizeQuery(song.album);
          if (!albumMap.has(albumKey)) {
            albumMap.set(albumKey, {
              type: "album",
              id: `album_${albumKey}`,
              title: song.album,
              artist: song.artist,
              artwork: song.artwork || "",
            });
          }
        }
      });
      albums.push(...Array.from(albumMap.values()));
    }

    // 6. Process Playlists Entities
    const playlists: SearchPlaylistEntity[] = [];
    rawPlaylists.forEach((p) => {
      let artwork = "";
      if (typeof p.image === "string") artwork = p.image;
      else if (Array.isArray(p.image) && p.image.length > 0) artwork = p.image[p.image.length - 1].url;

      playlists.push({
        type: "playlist",
        id: p.id || `playlist_${normalizeQuery(p.name)}`,
        title: p.name,
        subtitle: p.subtitle || "JioSaavn Playlist",
        artwork,
      });
    });

    const totalResults =
      artists.length + rankedSongs.length + albums.length + playlists.length;

    const result: CatalogSearchResult = {
      query,
      normalizedQuery: normQuery,
      intent,
      sections: {
        artists: artists.slice(0, 3),
        songs: rankedSongs.slice(0, 20),
        albums: albums.slice(0, 4),
        playlists: playlists.slice(0, 4),
      },
      totalResults,
      metadata: {
        fromCache: false,
        fetchedAt: Date.now(),
      },
    };

    setInCatalogCache(cacheKey, result, "SEARCH");
    return result;
  });
}

/**
 * Home Tab Catalog Method: Universal deduplication & per-surface ranking.
 */
export async function fetchHomeCatalog(): Promise<{
  popularSongs: JioSaavnSong[];
  discoverySongs: JioSaavnSong[];
}> {
  const cacheKey = "home:popular:fresh";
  const cached = getFromCatalogCache<{ popularSongs: JioSaavnSong[]; discoverySongs: JioSaavnSong[] }>(cacheKey);
  if (cached) return cached;

  return getOrFetchInFlight(cacheKey, async () => {
    const [rawTrending, rawDiscovery] = await Promise.all([
      getTrendingFeed(),
      searchSongs("Top Trending Hits 2026", 0, 20),
    ]);

    const popularSongs = rankTracksByProfile(deduplicateTracks(rawTrending), "", "POPULAR");
    const discoverySongs = rankTracksByProfile(deduplicateTracks(rawDiscovery), "", "FRESH");

    const result = { popularSongs, discoverySongs };
    setInCatalogCache(cacheKey, result, "POPULAR");
    return result;
  });
}

/**
 * Artist Detail Catalog Method by Artist Entity ID / Query.
 */
export async function fetchArtistCatalog(artistIdOrQuery: string): Promise<ArtistDetails | null> {
  const normKey = normalizeQuery(artistIdOrQuery);
  const cacheKey = `artist:${normKey}`;
  const cached = getFromCatalogCache<ArtistDetails>(cacheKey);
  if (cached) return cached;

  return getOrFetchInFlight(cacheKey, async () => {
    const rawDetails = await getArtistDetails(artistIdOrQuery);
    if (!rawDetails) return null;

    const deduplicated = deduplicateTracks(rawDetails.tracks);
    const ranked = rankTracksByProfile(deduplicated, artistIdOrQuery, "SEARCH");

    const result: ArtistDetails = {
      ...rawDetails,
      tracks: ranked,
    };

    setInCatalogCache(cacheKey, result, "ARTIST");
    return result;
  });
}

/**
 * Album Detail Catalog Method by Album Entity ID / Query.
 */
export async function fetchAlbumCatalog(albumIdOrQuery: string): Promise<AlbumDetails | null> {
  const normKey = normalizeQuery(albumIdOrQuery);
  const cacheKey = `album:${normKey}`;
  const cached = getFromCatalogCache<AlbumDetails>(cacheKey);
  if (cached) return cached;

  return getOrFetchInFlight(cacheKey, async () => {
    const rawDetails = await getAlbumDetails(albumIdOrQuery);
    if (!rawDetails) return null;

    const deduplicated = deduplicateTracks(rawDetails.tracks);

    const result: AlbumDetails = {
      ...rawDetails,
      tracks: deduplicated,
    };

    setInCatalogCache(cacheKey, result, "ALBUM");
    return result;
  });
}
