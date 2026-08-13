export interface JioSaavnImage {
  quality: string;
  url: string;
}

export interface JioSaavnDownloadUrl {
  quality: string;
  url: string;
}

export interface JioSaavnSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  url: string;
  duration: number;
}

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

export function formatJioSaavnSong(rawSong: any): JioSaavnSong | null {
  if (!rawSong || !rawSong.id) return null;

  // Extract best artwork (preferably 500x500)
  let artwork = "";
  if (Array.isArray(rawSong.image) && rawSong.image.length > 0) {
    const bestImage =
      rawSong.image.find((img: JioSaavnImage) => img.quality === "500x500") ||
      rawSong.image[rawSong.image.length - 1];
    artwork = bestImage?.url || "";
  } else if (typeof rawSong.image === "string") {
    artwork = rawSong.image;
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

  return {
    id: rawSong.id,
    title: decodeHTMLEntities(rawSong.name || rawSong.title || "Untitled"),
    artist: decodeHTMLEntities(artist),
    album: decodeHTMLEntities(album),
    artwork: artwork.replace("http://", "https://"),
    url: audioUrl.replace("http://", "https://"),
    duration: Number(rawSong.duration) || 0,
  };
}

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
