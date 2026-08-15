const JIOSAAVN_SEARCH_URL = "https://jiosaavn-api.kjpatel.workers.dev/api/search/songs";

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
  jamkudiTrack?: {
    id: string;
    title: string;
    artist: string;
    album: string;
    artwork: string;
    audioUrl: string;
    duration: number;
  };
}

export interface SpotifyPlaylistPreviewResponse {
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
 * Validate and extract Spotify Playlist ID from a URL.
 */
export function parseSpotifyPlaylistUrl(urlStr: string): { isValid: boolean; playlistId?: string; error?: string } {
  if (!urlStr || typeof urlStr !== "string") {
    return { isValid: false, error: "Please enter a valid Spotify playlist URL." };
  }

  const trimmed = urlStr.trim();

  // Rejections for non-playlist URLs
  if (trimmed.includes("/track/") || trimmed.includes("/album/") || trimmed.includes("/artist/")) {
    return { isValid: false, error: "This URL is not a Spotify playlist. Please paste a playlist URL." };
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname.includes("spotify.com")) {
      return { isValid: false, error: "This doesn't look like a valid Spotify URL." };
    }

    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    const playlistIndex = pathSegments.indexOf("playlist");

    if (playlistIndex !== -1 && pathSegments[playlistIndex + 1]) {
      const rawId = pathSegments[playlistIndex + 1];
      // Clean ID (22 base62 alphanumeric characters)
      const cleanId = rawId.split("?")[0].split("#")[0];
      if (/^[a-zA-Z0-9]{15,30}$/.test(cleanId)) {
        return { isValid: true, playlistId: cleanId };
      }
    }
  } catch {}

  return { isValid: false, error: "This doesn't look like a valid Spotify playlist URL." };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get Spotify API Client Access Token if SPOTIFY_CLIENT_ID & SPOTIFY_CLIENT_SECRET are set.
 */
export async function getSpotifyAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (clientId && clientSecret) {
    try {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        cachedToken = {
          token: data.access_token,
          expiresAt: Date.now() + data.expires_in * 1000,
        };
        return data.access_token;
      }
    } catch (err: any) {
      console.warn("Spotify Client Credentials fetch error:", err.message);
    }
  }

  return null;
}

/**
 * Extract playlist metadata and tracks from Spotify's open web embed iframe.
 * Requires ZERO API tokens / client secrets!
 */
export async function fetchFromSpotifyEmbed(playlistId: string): Promise<{
  playlistInfo: { id: string; name: string; owner: string; artwork: string | null; totalTracks: number };
  tracks: NormalizedSpotifyTrack[];
}> {
  const url = `https://open.spotify.com/embed/playlist/${playlistId}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Spotify playlist embed unavailable (HTTP ${res.status}).`);
  }

  const html = await res.text();
  const startTag = '<script id="__NEXT_DATA__" type="application/json">';
  const start = html.indexOf(startTag);

  if (start === -1) {
    throw new Error("Could not parse Spotify playlist data.");
  }

  const jsonStart = start + startTag.length;
  const jsonEnd = html.indexOf("</script>", jsonStart);
  const jsonStr = html.substring(jsonStart, jsonEnd);
  const data = JSON.parse(jsonStr);

  const entity = data.props?.pageProps?.state?.data?.entity;
  if (!entity) {
    throw new Error("Spotify playlist entity not found.");
  }

  const playlistInfo = {
    id: playlistId,
    name: entity.title || entity.name || "Spotify Playlist",
    owner: entity.subtitle || entity.authors?.[0]?.name || "Spotify User",
    artwork: entity.coverArt?.sources?.[0]?.url || null,
    totalTracks: entity.trackList?.length || 0,
  };

  const rawTracks = entity.trackList || [];
  const tracks: NormalizedSpotifyTrack[] = rawTracks.map((item: any, idx: number) => ({
    id: item.uri || `spotify_tr_${idx}`,
    title: item.title || item.name || "Unknown Track",
    artist: item.subtitle || item.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
    duration_ms: item.duration,
  }));

  return { playlistInfo, tracks };
}

/**
 * Normalize string for comparison (lowercase, strip special chars & common feat tags).
 */
function normalizeString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\(feat\.[^)]+\)/gi, "")
    .replace(/\[official[^\]]*\]/gi, "")
    .replace(/\([^)]*version[^)]*\)/gi, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Match a single Spotify track against JioSaavn API catalog.
 */
export async function matchSpotifyTrack(spotifyTrack: NormalizedSpotifyTrack): Promise<MatchedTrackResult> {
  const normTitle = normalizeString(spotifyTrack.title);
  const normArtist = normalizeString(spotifyTrack.artist);

  const searchQuery = `${spotifyTrack.title} ${spotifyTrack.artist}`;

  try {
    const res = await fetch(`${JIOSAAVN_SEARCH_URL}?query=${encodeURIComponent(searchQuery)}&limit=5`);
    if (!res.ok) {
      return { spotifyTrack, matched: false };
    }

    const json = (await res.json()) as any;
    const results = json?.data?.results || json?.results || [];

    if (!Array.isArray(results) || results.length === 0) {
      return { spotifyTrack, matched: false };
    }

    // Find best match in search results
    for (const item of results) {
      const resTitle = normalizeString(item.name || item.title || "");
      const resArtist = normalizeString(
        typeof item.primaryArtists === "string"
          ? item.primaryArtists
          : typeof item.artist === "string"
          ? item.artist
          : item.artists?.primary?.[0]?.name || ""
      );

      const titleMatch = normTitle === resTitle || normTitle.includes(resTitle) || resTitle.includes(normTitle);
      const artistMatch =
        normArtist === resArtist || normArtist.includes(resArtist) || resArtist.includes(normArtist);

      if (titleMatch && artistMatch) {
        const audioUrl =
          item.downloadUrl?.[item.downloadUrl?.length - 1]?.url ||
          item.downloadUrl?.[0]?.url ||
          item.media_url ||
          "";

        const artwork =
          item.image?.[item.image?.length - 1]?.url ||
          item.image?.[0]?.url ||
          item.artwork ||
          "";

        return {
          spotifyTrack,
          matched: true,
          confidence: "high",
          jamkudiTrack: {
            id: item.id,
            title: item.name || item.title || spotifyTrack.title,
            artist: item.primaryArtists || item.artist || spotifyTrack.artist,
            album: item.album?.name || item.album || "",
            artwork: artwork,
            audioUrl: audioUrl,
            duration: typeof item.duration === "number" ? item.duration : parseInt(item.duration || "0", 10),
          },
        };
      }
    }

    // Secondary fallback: relaxed match on top 1 result if title overlaps strongly
    const top = results[0];
    const topTitle = normalizeString(top.name || top.title || "");
    if (normTitle === topTitle || normTitle.startsWith(topTitle) || topTitle.startsWith(normTitle)) {
      const audioUrl =
        top.downloadUrl?.[top.downloadUrl?.length - 1]?.url ||
        top.downloadUrl?.[0]?.url ||
        top.media_url ||
        "";

      const artwork =
        top.image?.[top.image?.length - 1]?.url ||
        top.image?.[0]?.url ||
        top.artwork ||
        "";

      return {
        spotifyTrack,
        matched: true,
        confidence: "medium",
        jamkudiTrack: {
          id: top.id,
          title: top.name || top.title || spotifyTrack.title,
          artist: top.primaryArtists || top.artist || spotifyTrack.artist,
          album: top.album?.name || top.album || "",
          artwork: artwork,
          audioUrl: audioUrl,
          duration: typeof top.duration === "number" ? top.duration : parseInt(top.duration || "0", 10),
        },
      };
    }
  } catch (err: any) {
    console.warn(`JioSaavn match fetch error for ${spotifyTrack.title}:`, err.message);
  }

  return { spotifyTrack, matched: false };
}

/**
 * Fetch Spotify playlist details and items, then perform track matching.
 */
export async function processSpotifyPlaylistImport(playlistId: string): Promise<SpotifyPlaylistPreviewResponse> {
  let playlistInfo: any;
  let spotifyTracks: NormalizedSpotifyTrack[] = [];

  // Method 1: Try public web embed extraction (No token needed!)
  try {
    const embedData = await fetchFromSpotifyEmbed(playlistId);
    playlistInfo = embedData.playlistInfo;
    spotifyTracks = embedData.tracks;
  } catch (embedErr: any) {
    console.warn("Spotify Embed fetch fallback notice:", embedErr.message);

    // Method 2: Try Web API if client credentials token is available
    const token = await getSpotifyAccessToken();
    if (!token) {
      throw new Error(embedErr.message || "Failed to parse Spotify playlist.");
    }

    const plRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!plRes.ok) {
      throw new Error(`Spotify API error ${plRes.status}. Please check playlist URL.`);
    }

    const plData = (await plRes.json()) as any;
    playlistInfo = {
      id: playlistId,
      name: plData.name || "Spotify Playlist",
      owner: plData.owner?.display_name || "Spotify User",
      artwork: plData.images?.[0]?.url || null,
      totalTracks: plData.tracks?.total || 0,
    };

    const itemsRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/items?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (itemsRes.ok) {
      const itemsData = (await itemsRes.json()) as any;
      (itemsData.items || []).forEach((item: any, idx: number) => {
        const tr = item.track || item;
        if (tr && tr.name) {
          spotifyTracks.push({
            id: tr.id || `spotify_tr_${idx}`,
            title: tr.name,
            artist: tr.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
            duration_ms: tr.duration_ms,
          });
        }
      });
    }
  }

  if (spotifyTracks.length === 0) {
    throw new Error("No playable tracks found in this Spotify playlist.");
  }

  // Perform Track Matching in Parallel (batches of 5)
  const matchedTracks: MatchedTrackResult[] = [];
  const unmatchedTracks: NormalizedSpotifyTrack[] = [];

  const BATCH_SIZE = 5;
  for (let i = 0; i < spotifyTracks.length; i += BATCH_SIZE) {
    const batch = spotifyTracks.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((t) => matchSpotifyTrack(t)));

    results.forEach((res) => {
      if (res.matched && res.jamkudiTrack) {
        matchedTracks.push(res);
      } else {
        unmatchedTracks.push(res.spotifyTrack);
      }
    });
  }

  return {
    playlistInfo,
    matchedTracks,
    unmatchedTracks,
  };
}
