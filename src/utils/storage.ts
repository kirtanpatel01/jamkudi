import AsyncStorage from "@react-native-async-storage/async-storage";
import { Track, RepeatMode } from "@/types/track";

const KEYS = {
  LIKED_SONGS: "@jamkudi/liked_songs",
  RECENTLY_PLAYED: "@jamkudi/recently_played",
  SEARCH_HISTORY: "@jamkudi/search_history",
  AUDIO_SETTINGS: "@jamkudi/audio_settings",
};

export interface AppSettings {
  audioQuality: "320kbps" | "160kbps";
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  audioQuality: "320kbps",
  repeatMode: "OFF",
  shuffleEnabled: false,
};

// Liked Songs
export async function loadLikedSongs(): Promise<Track[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LIKED_SONGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveLikedSongs(songs: Track[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LIKED_SONGS, JSON.stringify(songs));
  } catch {}
}

// Recently Played
export async function loadRecentlyPlayed(): Promise<Track[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.RECENTLY_PLAYED);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addRecentlyPlayed(track: Track): Promise<Track[]> {
  try {
    const current = await loadRecentlyPlayed();
    const filtered = current.filter((t) => t.id !== track.id);
    const updated = [track, ...filtered].slice(0, 50); // Keep latest 50
    await AsyncStorage.setItem(KEYS.RECENTLY_PLAYED, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

// Search History
export async function loadSearchHistory(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SEARCH_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addSearchQuery(query: string): Promise<string[]> {
  if (!query.trim()) return await loadSearchHistory();
  try {
    const current = await loadSearchHistory();
    const filtered = current.filter((q) => q.toLowerCase() !== query.trim().toLowerCase());
    const updated = [query.trim(), ...filtered].slice(0, 10);
    await AsyncStorage.setItem(KEYS.SEARCH_HISTORY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function clearSearchHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.SEARCH_HISTORY);
  } catch {}
}

// Settings
export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.AUDIO_SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const current = await loadSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(KEYS.AUDIO_SETTINGS, JSON.stringify(updated));
  } catch {}
}
