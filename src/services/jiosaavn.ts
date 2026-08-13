import { Track } from "@/types/track";

export interface JioSaavnImage {
  quality: string;
  url: string;
}

export interface JioSaavnDownloadUrl {
  quality: string;
  url: string;
}

export type JioSaavnSong = Track;

export interface FeaturedArtist {
  id: string;
  name: string;
  query: string;
  imageUrl: string;
}

export const FEATURED_ARTISTS: FeaturedArtist[] = [
  {
    id: "arijit",
    name: "Arijit Singh",
    query: "Arijit Singh",
    imageUrl: "https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_500x500.jpg",
  },
  {
    id: "rahman",
    name: "A.R. Rahman",
    query: "A.R. Rahman",
    imageUrl: "https://c.saavncdn.com/artists/AR_Rahman_002_20210120084455_500x500.jpg",
  },
  {
    id: "diljit",
    name: "Diljit Dosanjh",
    query: "Diljit Dosanjh",
    imageUrl: "https://c.saavncdn.com/artists/Diljit_Dosanjh_005_20231025073054_500x500.jpg",
  },
  {
    id: "shreya",
    name: "Shreya Ghoshal",
    query: "Shreya Ghoshal",
    imageUrl: "https://c.saavncdn.com/artists/Shreya_Ghoshal_007_20241101074144_500x500.jpg",
  },
  {
    id: "anirudh",
    name: "Anirudh Ravichander",
    query: "Anirudh Ravichander",
    imageUrl: "https://c.saavncdn.com/artists/Anirudh_Ravichander_003_20260121134149_500x500.jpg",
  },
  {
    id: "pritam",
    name: "Pritam",
    query: "Pritam",
    imageUrl: "https://c.saavncdn.com/artists/Pritam_Chakraborty-20170711073326_500x500.jpg",
  },
  {
    id: "badshah",
    name: "Badshah",
    query: "Badshah",
    imageUrl: "https://c.saavncdn.com/artists/Badshah_006_20241118064015_500x500.jpg",
  },
];

const BASE_URL = "https://saavn.sumit.co/api";
const FALLBACK_URL = "https://saavn.dev/api";

function decodeHTMLEntities(str: string = ""): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function mapToTrack(rawSong: any): Track | null {
  if (!rawSong || !rawSong.id) return null;

  // Extract best artwork (preferably 500x500)
  let artwork = "";
  if (Array.isArray(rawSong.image) && rawSong.image.length > 0) {
    const lastImg = rawSong.image[rawSong.image.length - 1];
    const bestImgObj =
      rawSong.image.find((img: any) => img?.quality === "500x500") || lastImg;

    if (typeof bestImgObj === "string") {
      artwork = bestImgObj;
    } else if (typeof bestImgObj === "object" && bestImgObj !== null) {
      artwork = bestImgObj.url || bestImgObj.link || "";
    }
  } else if (typeof rawSong.image === "string") {
    artwork = rawSong.image;
  } else if (typeof rawSong.album === "object" && rawSong.album?.image) {
    if (Array.isArray(rawSong.album.image) && rawSong.album.image.length > 0) {
      const lastAlbumImg = rawSong.album.image[rawSong.album.image.length - 1];
      artwork =
        typeof lastAlbumImg === "string"
          ? lastAlbumImg
          : lastAlbumImg?.url || lastAlbumImg?.link || "";
    } else if (typeof rawSong.album.image === "string") {
      artwork = rawSong.album.image;
    }
  }

  // Extract best audio URL (preferably 320kbps or 160kbps)
  let audioUrl = "";
  if (Array.isArray(rawSong.downloadUrl) && rawSong.downloadUrl.length > 0) {
    const bestUrl =
      rawSong.downloadUrl.find((d: JioSaavnDownloadUrl) => d.quality === "320kbps") ||
      rawSong.downloadUrl.find((d: JioSaavnDownloadUrl) => d.quality === "160kbps") ||
      rawSong.downloadUrl[rawSong.downloadUrl.length - 1];
    audioUrl = bestUrl?.url || "";
  } else if (typeof rawSong.downloadUrl === "string") {
    audioUrl = rawSong.downloadUrl;
  }

  if (!audioUrl) return null;

  // Extract artist string
  let artist = "Unknown Artist";
  if (rawSong.artists?.primary && Array.isArray(rawSong.artists.primary)) {
    artist = rawSong.artists.primary.map((a: any) => a.name).join(", ");
  } else if (typeof rawSong.primaryArtists === "string" && rawSong.primaryArtists) {
    artist = rawSong.primaryArtists;
  } else if (typeof rawSong.singers === "string" && rawSong.singers) {
    artist = rawSong.singers;
  }

  // Extract album
  let album = "Single";
  if (typeof rawSong.album === "object" && rawSong.album?.name) {
    album = rawSong.album.name;
  } else if (typeof rawSong.album === "string" && rawSong.album) {
    album = rawSong.album;
  }

  const cleanUrl = audioUrl.replace("http://", "https://");

  return {
    id: rawSong.id,
    title: decodeHTMLEntities(rawSong.name || rawSong.title || "Untitled"),
    artist: decodeHTMLEntities(artist),
    album: decodeHTMLEntities(album),
    artwork: artwork.replace("http://", "https://"),
    audioUrl: cleanUrl,
    url: cleanUrl,
    duration: Number(rawSong.duration) || 0,
  } as Track;
}

export const formatJioSaavnSong = mapToTrack;

export async function searchSongs(
  query: string,
  page: number = 0,
  limit: number = 20
): Promise<JioSaavnSong[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    query: query.trim(),
    page: page.toString(),
    limit: limit.toString(),
  });

  const tryFetch = async (baseUrl: string) => {
    const res = await fetch(`${baseUrl}/search/songs?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    const items = json?.data?.results || [];
    return items.map(formatJioSaavnSong).filter((s: JioSaavnSong | null): s is JioSaavnSong => s !== null);
  };

  try {
    return await tryFetch(BASE_URL);
  } catch (err) {
    try {
      return await tryFetch(FALLBACK_URL);
    } catch (fallbackErr) {
      console.error("JioSaavn API fetch failed:", fallbackErr);
      return [];
    }
  }
}

export async function getTrendingFeed(): Promise<JioSaavnSong[]> {
  return searchSongs("Top Hits 2026", 0, 15);
}

export async function getLyrics(songId: string): Promise<string | null> {
  if (!songId) return null;

  const tryFetch = async (baseUrl: string) => {
    const res = await fetch(`${baseUrl}/songs/${songId}/lyrics`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    const rawLyrics = json?.data?.lyrics || json?.data?.snippet;
    if (typeof rawLyrics === "string" && rawLyrics.trim()) {
      return decodeHTMLEntities(rawLyrics.replace(/<br\s*\/?>/gi, "\n"));
    }
    return null;
  };

  try {
    return await tryFetch(BASE_URL);
  } catch {
    try {
      return await tryFetch(FALLBACK_URL);
    } catch {
      return null;
    }
  }
}

export async function getSongById(id: string): Promise<JioSaavnSong | null> {
  const tryFetch = async (baseUrl: string) => {
    const res = await fetch(`${baseUrl}/songs/${id}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data[0] : json?.data;
    return formatJioSaavnSong(data);
  };

  try {
    return await tryFetch(BASE_URL);
  } catch (err) {
    try {
      return await tryFetch(FALLBACK_URL);
    } catch {
      return null;
    }
  }
}

export interface ArtistDetails {
  name: string;
  imageUrl: string;
  tracks: JioSaavnSong[];
}

export interface AlbumDetails {
  title: string;
  artist: string;
  artwork: string;
  year?: string;
  tracks: JioSaavnSong[];
}

export async function getArtistDetails(query: string): Promise<ArtistDetails | null> {
  if (!query) return null;
  const decodedQuery = decodeURIComponent(query);
  const featured = FEATURED_ARTISTS.find(
    (a) => a.query.toLowerCase() === decodedQuery.toLowerCase() || a.name.toLowerCase() === decodedQuery.toLowerCase()
  );

  const songs = await searchSongs(decodedQuery, 0, 20);
  const imageUrl = featured?.imageUrl || (songs.length > 0 ? songs[0].artwork || "" : "");

  return {
    name: featured?.name || decodedQuery,
    imageUrl: imageUrl || "",
    tracks: songs,
  };
}

export async function getAlbumDetails(query: string): Promise<AlbumDetails | null> {
  if (!query) return null;
  const decodedQuery = decodeURIComponent(query);
  const songs = await searchSongs(decodedQuery, 0, 20);

  if (songs.length === 0) return null;

  return {
    title: songs[0].album || decodedQuery,
    artist: songs[0].artist || "Various Artists",
    artwork: songs[0].artwork || "",
    tracks: songs,
  };
}
