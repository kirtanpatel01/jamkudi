import { getFromCatalogCache, setInCatalogCache } from "./catalog/cache";

export interface LastFmTrack {
  name: string;
  artist: string;
  listeners?: string;
  playcount?: string;
  mbid?: string;
  url?: string;
  artwork?: string | null;
  tag?: string;
}

export interface LastFmArtist {
  name: string;
  listeners?: string;
  mbid?: string;
  url?: string;
}

const LASTFM_API_KEY = "b25b959554ed76058ac220b7b2e0a026"; // Public application API key for music discovery
const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

async function fetchLastFmJson(params: Record<string, string>): Promise<any> {
  try {
    const urlParams = new URLSearchParams({
      ...params,
      api_key: LASTFM_API_KEY,
      format: "json",
    });

    const response = await fetch(`${BASE_URL}?${urlParams.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (err) {
    return null;
  }
}

/**
 * Fetches global top trending tracks from Last.fm
 */
export async function fetchLastFmTopTracks(limit = 20): Promise<LastFmTrack[]> {
  const cacheKey = `lastfm:toptracks:${limit}`;
  const cached = getFromCatalogCache<LastFmTrack[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchLastFmJson({
    method: "chart.gettoptracks",
    limit: limit.toString(),
  });

  if (!data || !data.tracks || !Array.isArray(data.tracks.track)) {
    return [];
  }

  const tracks: LastFmTrack[] = data.tracks.track.map((item: any) => {
    let artwork: string | null = null;
    if (Array.isArray(item.image) && item.image.length > 0) {
      const largestImg = item.image[item.image.length - 1];
      if (largestImg && largestImg["#text"]) {
        artwork = largestImg["#text"];
      }
    }

    return {
      name: item.name || "",
      artist: typeof item.artist === "string" ? item.artist : item.artist?.name || "",
      listeners: item.listeners,
      playcount: item.playcount,
      mbid: item.mbid,
      url: item.url,
      artwork,
    };
  }).filter((t: LastFmTrack) => Boolean(t.name && t.artist));

  setInCatalogCache(cacheKey, tracks, "POPULAR");
  return tracks;
}

/**
 * Fetches top tracks for a specific mood/genre tag from Last.fm
 */
export async function fetchLastFmTagTracks(tag: string, limit = 20): Promise<LastFmTrack[]> {
  const normTag = tag.toLowerCase().trim();
  const cacheKey = `lastfm:tagtracks:${normTag}:${limit}`;
  const cached = getFromCatalogCache<LastFmTrack[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchLastFmJson({
    method: "tag.gettoptracks",
    tag: normTag,
    limit: limit.toString(),
  });

  if (!data || !data.tracks || !Array.isArray(data.tracks.track)) {
    return [];
  }

  const tracks: LastFmTrack[] = data.tracks.track.map((item: any) => {
    let artwork: string | null = null;
    if (Array.isArray(item.image) && item.image.length > 0) {
      const largestImg = item.image[item.image.length - 1];
      if (largestImg && largestImg["#text"]) {
        artwork = largestImg["#text"];
      }
    }

    return {
      name: item.name || "",
      artist: typeof item.artist === "string" ? item.artist : item.artist?.name || "",
      listeners: item.listeners,
      mbid: item.mbid,
      url: item.url,
      artwork,
      tag: normTag,
    };
  }).filter((t: LastFmTrack) => Boolean(t.name && t.artist));

  setInCatalogCache(cacheKey, tracks, "POPULAR");
  return tracks;
}

/**
 * Fetches similar artists for candidate recommendations
 */
export async function fetchLastFmSimilarArtists(artistName: string, limit = 10): Promise<LastFmArtist[]> {
  const normArtist = artistName.toLowerCase().trim();
  const cacheKey = `lastfm:similar:${normArtist}:${limit}`;
  const cached = getFromCatalogCache<LastFmArtist[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchLastFmJson({
    method: "artist.getsimilar",
    artist: normArtist,
    limit: limit.toString(),
  });

  if (!data || !data.similarartists || !Array.isArray(data.similarartists.artist)) {
    return [];
  }

  const artists: LastFmArtist[] = data.similarartists.artist.map((item: any) => ({
    name: item.name || "",
    listeners: item.listeners,
    mbid: item.mbid,
    url: item.url,
  })).filter((a: LastFmArtist) => Boolean(a.name));

  setInCatalogCache(cacheKey, artists, "ARTIST");
  return artists;
}
