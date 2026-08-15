import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
import { SettingsModal } from "@/components/common/SettingsModal";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import {
  JioSaavnSong,
  searchSongs,
  searchArtists,
  FEATURED_ARTISTS,
} from "@/services/jiosaavn";
import { fetchHomeCatalog } from "@/services/catalogEngine";
import { View, Pressable } from "@/tw";

interface ArtistShelf {
  artistName: string;
  songs: JioSaavnSong[];
}

interface GenreShelf {
  genreName: string;
  songs: JioSaavnSong[];
}

interface FavoriteArtistItem {
  name: string;
  imageUrl: string;
}

function cleanTitle(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function getGreeting(displayName?: string | null): string {
  const hour = new Date().getHours();
  let baseGreeting = "Good evening";
  if (hour < 12) baseGreeting = "Good morning";
  else if (hour < 18) baseGreeting = "Good afternoon";

  const cleanName = displayName?.trim();
  if (cleanName && cleanName.toLowerCase() !== "null" && cleanName.toLowerCase() !== "undefined") {
    return `${baseGreeting}, ${cleanName}`;
  }
  return baseGreeting;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function normalizeArtistName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSongByArtist(song: JioSaavnSong, targetArtistName: string): boolean {
  if (!song || !song.artist) return false;
  const targetNorm = normalizeArtistName(targetArtistName);
  if (!targetNorm) return false;

  const songArtistNorm = normalizeArtistName(song.artist);
  if (songArtistNorm.includes(targetNorm)) return true;

  const parts = song.artist
    .split(/[,&/|]|\bft\.?\b|\bfeat\.?\b/i)
    .map((p) => normalizeArtistName(p))
    .filter(Boolean);

  return parts.some((p) => p.includes(targetNorm) || targetNorm.includes(p));
}

function interleaveArrays<T>(arrays: T[][]): T[] {
  const result: T[] = [];
  let maxLen = 0;
  for (const arr of arrays) {
    if (arr.length > maxLen) maxLen = arr.length;
  }
  for (let i = 0; i < maxLen; i++) {
    for (const arr of arrays) {
      if (i < arr.length) {
        result.push(arr[i]);
      }
    }
  }
  return result;
}

function getNormalizedTrackKey(song: JioSaavnSong): string {
  const title = (song.title || "")
    .toLowerCase()
    .replace(/[\(\[\{].*?[\)\]\}]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
  const artist = (song.artist || "")
    .toLowerCase()
    .split(/[,&]/)[0]
    .replace(/[^a-z0-9]/g, "")
    .trim();
  return `${title}_${artist}`;
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { playQueue, currentTrack, isPlaying, recentlyPlayed } = usePlayer();
  const { user, profile } = useAuth();

  // State for Authenticated Onboarded Users
  const [favoriteArtistsList, setFavoriteArtistsList] = useState<FavoriteArtistItem[]>([]);
  const [artistShelves, setArtistShelves] = useState<ArtistShelf[]>([]);
  const [genreShelves, setGenreShelves] = useState<GenreShelf[]>([]);
  const [preferenceDiscovery, setPreferenceDiscovery] = useState<JioSaavnSong[]>([]);

  // State for Anonymous / Un-onboarded Users
  const [popularSongs, setPopularSongs] = useState<JioSaavnSong[]>([]);
  const [discoverySongs, setDiscoverySongs] = useState<JioSaavnSong[]>([]);

  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  const isOnboardedUser = Boolean(
    user && profile && (
      profile.onboarding_completed ||
      (profile.favorite_artists && profile.favorite_artists.length > 0) ||
      (profile.favorite_genres && profile.favorite_genres.length > 0)
    )
  );

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadContent = async () => {
      try {
        if (isOnboardedUser && profile) {
          const rawFavArtists: any[] = profile.favorite_artists || [];
          const favArtistNames = rawFavArtists.map((item) =>
            typeof item === "string" ? item : item?.name || ""
          ).filter(Boolean);

          const favGenres = profile.favorite_genres || [];

          // 1. Resolve Favorite Artist Avatars / Images (Process ALL selected artists)
          const resolvedFavArtists: FavoriteArtistItem[] = await Promise.all(
            favArtistNames.map(async (name) => {
              const matched = FEATURED_ARTISTS.find(
                (fa) => fa.name.toLowerCase() === name.toLowerCase()
              );
              if (matched && matched.imageUrl) {
                return { name, imageUrl: matched.imageUrl };
              }
              try {
                const results = await searchArtists(name);
                if (results && results.length > 0) {
                  const topResult = results[0];
                  let imgUrl = "";
                  if (typeof topResult.image === "string") {
                    imgUrl = topResult.image;
                  } else if (Array.isArray(topResult.image) && topResult.image.length > 0) {
                    const best =
                      topResult.image.find((i: any) => i?.quality === "500x500") ||
                      topResult.image[topResult.image.length - 1];
                    imgUrl = typeof best === "string" ? best : best?.url || best?.link || "";
                  }
                  if (imgUrl) return { name, imageUrl: imgUrl };
                }
              } catch {}
              return { name, imageUrl: "" };
            })
          );

          // 2. Fetch content for ALL favorite artists with artist-matching validation & fallback
          const perArtistDiscoveryPools: Record<string, JioSaavnSong[]> = {};

          const artistPromises = favArtistNames.map(async (artistName) => {
            const primaryHits = await searchSongs(`${artistName} top hits`, 0, 20).catch(() => []);
            let validSongs = primaryHits.filter((song) => isSongByArtist(song, artistName));

            if (validSongs.length < 6) {
              const fallbackHits = await searchSongs(artistName, 0, 20).catch(() => []);
              const validFallback = fallbackHits.filter((song) => isSongByArtist(song, artistName));

              const seenIds = new Set(validSongs.map((s) => s.id));
              validFallback.forEach((song) => {
                if (!seenIds.has(song.id)) {
                  seenIds.add(song.id);
                  validSongs.push(song);
                }
              });
            }

            perArtistDiscoveryPools[artistName] = validSongs;
            return { artistName, songs: validSongs.slice(0, 10) };
          });

          const resolvedArtistShelves = await Promise.all(artistPromises);

          // 3. Fetch content for favorite genres
          const perGenreDiscoveryPools: Record<string, JioSaavnSong[]> = {};
          const genrePromises = favGenres.slice(0, 4).map(async (genreName) => {
            const songs = await searchSongs(`${genreName} top songs`, 0, 15).catch(() => []);
            perGenreDiscoveryPools[genreName] = songs;
            return { genreName, songs: songs.slice(0, 10) };
          });

          const resolvedGenreShelves = await Promise.all(genrePromises);

          // 4. Build balanced discovery feed by interleaving pools across ALL favorite artists & genres
          const poolsToInterleave: JioSaavnSong[][] = [
            ...favArtistNames.map((name) => perArtistDiscoveryPools[name] || []),
            ...favGenres.map((name) => perGenreDiscoveryPools[name] || []),
          ];

          const combinedDiscovery = interleaveArrays(poolsToInterleave);

          if (isMounted) {
            setFavoriteArtistsList(resolvedFavArtists);
            setArtistShelves(resolvedArtistShelves.filter((a) => a.songs.length > 0));
            setGenreShelves(resolvedGenreShelves.filter((g) => g.songs.length > 0));
            setPreferenceDiscovery(combinedDiscovery);
          }
        } else {
          // Anonymous / Incomplete profile catalog load
          const { popularSongs: trending, discoverySongs: discovery } = await fetchHomeCatalog();
          if (isMounted) {
            setPopularSongs(trending);
            setDiscoverySongs(discovery);
          }
        }
      } catch (err) {
        console.warn("Home content load notice:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [isOnboardedUser, profile?.favorite_artists, profile?.favorite_genres]);

  const handleSelectSong = async (songsList: JioSaavnSong[], index: number) => {
    const selected = songsList[index];
    await playQueue(songsList, index);
    showToast(`Playing ${selected?.title || "track"}`, "info");
  };

  const handleSelectArtist = (artistName: string) => {
    router.push(`/artist/${encodeURIComponent(artistName)}` as any);
  };

  // Dual Deduplication Sets (by stable ID and normalized title+artist key)
  const seenTrackIds = new Set<string>();
  const seenTrackKeys = new Set<string>();

  const isDuplicate = (song: JioSaavnSong) => {
    if (!song || !song.id) return true;
    const key = getNormalizedTrackKey(song);
    if (seenTrackIds.has(song.id) || (key && seenTrackKeys.has(key))) {
      return true;
    }
    seenTrackIds.add(song.id);
    if (key) seenTrackKeys.add(key);
    return false;
  };

  // DEDUPLICATED LISTS FOR ONBOARDED HOME:
  const onboardedRecentlyPlayed: JioSaavnSong[] = [];
  if (recentlyPlayed.length > 0) {
    recentlyPlayed.slice(0, 6).forEach((track) => {
      if (!isDuplicate(track)) {
        onboardedRecentlyPlayed.push(track);
      }
    });
  }

  const deduplicatedArtistShelves = artistShelves.map((shelf) => {
    const filteredSongs = shelf.songs.filter((song) => !isDuplicate(song));
    return { ...shelf, songs: filteredSongs };
  }).filter((shelf) => shelf.songs.length > 0);

  const deduplicatedGenreShelves = genreShelves.map((shelf) => {
    const filteredSongs = shelf.songs.filter((song) => !isDuplicate(song));
    return { ...shelf, songs: filteredSongs };
  }).filter((shelf) => shelf.songs.length > 0);

  const deduplicatedDiscovery: JioSaavnSong[] = [];
  preferenceDiscovery.forEach((song) => {
    if (!isDuplicate(song)) {
      deduplicatedDiscovery.push(song);
    }
  });

  // DEDUPLICATED LISTS FOR ANONYMOUS HOME:
  const anonymousSection2: JioSaavnSong[] = [];
  popularSongs.slice(0, 6).forEach((track) => {
    if (!isDuplicate(track)) {
      anonymousSection2.push(track);
    }
  });

  const popularFeed: JioSaavnSong[] = [];
  popularSongs.forEach((song) => {
    if (!isDuplicate(song)) {
      popularFeed.push(song);
    }
  });

  const discoveryFeed: JioSaavnSong[] = [];
  discoverySongs.forEach((song) => {
    if (!isDuplicate(song)) {
      discoveryFeed.push(song);
    }
  });

  return (
    <>
      <Screen scrollable paddingHorizontal={16}>
        {/* Header */}
        <View className="flex-row items-center justify-between mt-2 mb-5">
          <View className="flex-row items-center flex-1 mr-3">
            <View className="w-11 h-11 rounded-2xl overflow-hidden mr-3 bg-purple-950 border border-purple-500/40 shrink-0">
              <Image
                source={require("../../../assets/images/icon.jpg")}
                className="w-full h-full"
                contentFit="cover"
              />
            </View>
            <View className="flex-1 min-w-0">
              <AppText variant="caption" className="text-xs text-purple-400 font-bold tracking-wider uppercase" numberOfLines={1}>
                {isOnboardedUser ? "Jamkudi" : "Welcome to Jamkudi"}
              </AppText>
              <AppText variant="screenTitle" className="text-2xl font-extrabold tracking-tight" numberOfLines={1}>
                {getGreeting(profile?.display_name)}
              </AppText>
            </View>
          </View>

          <View className="flex-row items-center gap-x-2 shrink-0">
            <Pressable
              onPress={() => showToast("No new notifications", "info")}
              className="w-10 h-10 rounded-full items-center justify-center border active:opacity-80 active:scale-[0.94]"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Icon name="bell" size={20} color={theme.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full items-center justify-center border active:opacity-80 active:scale-[0.94]"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Icon name="settings" size={20} color={theme.textPrimary} />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View className="py-8">
            {/* Skeleton Loader Placeholders */}
            <View className="mb-8">
              <View className="w-40 h-6 rounded-md mb-4" style={{ backgroundColor: theme.skeletonBase }} />
              <View className="flex-row flex-wrap justify-between" style={{ rowGap: 10 }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <View
                    key={i}
                    className="h-14 w-[48.5%] rounded-2xl border flex-row items-center overflow-hidden opacity-60"
                    style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                  >
                    <View className="w-14 h-14" style={{ backgroundColor: theme.skeletonHighlight }} />
                    <View className="flex-1 px-3">
                      <View className="w-full h-3 rounded mb-1.5" style={{ backgroundColor: theme.skeletonBase }} />
                      <View className="w-2/3 h-2.5 rounded" style={{ backgroundColor: theme.skeletonHighlight }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View className="mb-8">
              <View className="w-48 h-6 rounded-md mb-4" style={{ backgroundColor: theme.skeletonBase }} />
              <View className="flex-row" style={{ gap: 16 }}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} className="items-center w-20 opacity-60">
                    <View className="w-20 h-20 rounded-full mb-2 border" style={{ backgroundColor: theme.skeletonHighlight, borderColor: theme.border }} />
                    <View className="w-14 h-3 rounded" style={{ backgroundColor: theme.skeletonBase }} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : isOnboardedUser ? (
          /* ============================================================== */
          /* 1. AUTHENTICATED & ONBOARDED USER HOME (100% PERSONALIZED)     */
          /* ============================================================== */
          <View>
            {/* 1. Continue Listening (Shown ONLY if user has listening history) */}
            {onboardedRecentlyPlayed.length > 0 && (
              <View className="mb-8">
                <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
                  Continue Listening
                </AppText>
                <View className="flex-row flex-wrap justify-between" style={{ rowGap: 10 }}>
                  {onboardedRecentlyPlayed.map((item, idx) => {
                    const isCurrent = currentTrack?.id === item.id;
                    return (
                      <Pressable
                        key={`rec-${item.id}-${idx}`}
                        onPress={() => handleSelectSong(onboardedRecentlyPlayed, idx)}
                        className="h-14 w-[48.5%] rounded-2xl flex-row items-center overflow-hidden border active:scale-[0.97]"
                        style={
                          isCurrent
                            ? { backgroundColor: theme.isDark ? '#221A35' : theme.surfacePressed, borderColor: 'rgba(168, 85, 247, 0.8)' }
                            : { backgroundColor: theme.surface, borderColor: theme.border }
                        }
                      >
                        <View className="w-14 h-14 relative shrink-0" style={{ backgroundColor: theme.surfacePressed }}>
                          <ArtworkImage uri={item.artwork} iconSize={18} className="w-full h-full" />
                          {isCurrent && (
                            <View className="absolute inset-0 bg-black/60 items-center justify-center">
                              <Icon name={isPlaying ? "pause" : "play"} size={16} color="#C084FC" />
                            </View>
                          )}
                        </View>
                        <AppText
                          variant="body"
                          color={isCurrent ? undefined : 'textPrimary'}
                          className={`text-xs font-semibold px-2.5 flex-1 ${isCurrent ? "text-purple-300 font-bold" : ""}`}
                          numberOfLines={2}
                        >
                          {cleanTitle(item.title)}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 2. Your Favorite Artists (Visual photos of user's onboarding choices) */}
            {favoriteArtistsList.length > 0 && (
              <View className="mb-8">
                <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
                  Your Favorite Artists
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
                  {favoriteArtistsList.map((artist, idx) => (
                    <Pressable
                      key={`favart-${artist.name}-${idx}`}
                      onPress={() => handleSelectArtist(artist.name)}
                      className="items-center w-20 active:scale-[0.94]"
                    >
                      <View
                        className="w-20 h-20 rounded-full overflow-hidden mb-2 border border-purple-500/40"
                        style={{ backgroundColor: theme.surface }}
                      >
                        <ArtworkImage uri={artist.imageUrl} iconSize={26} className="w-full h-full" />
                      </View>
                      <AppText variant="caption" color="textSecondary" className="text-xs font-semibold text-center" numberOfLines={1}>
                        {cleanTitle(artist.name)}
                      </AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 3. Because you like [Artist Name] Shelves */}
            {deduplicatedArtistShelves.map((shelf) => (
              <View key={`shelf-art-${shelf.artistName}`} className="mb-8">
                <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
                  Because you like {cleanTitle(shelf.artistName)}
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                  {shelf.songs.map((item, idx) => {
                    const isCurrent = currentTrack?.id === item.id;
                    return (
                      <Pressable
                        key={`art-song-${item.id}`}
                        onPress={() => handleSelectSong(shelf.songs, idx)}
                        className="w-36 active:scale-[0.96]"
                      >
                        <View
                          className={`w-36 h-36 rounded-2xl overflow-hidden mb-2.5 border relative ${
                            isCurrent ? 'border-purple-500' : ''
                          }`}
                          style={{ backgroundColor: theme.surface, borderColor: isCurrent ? undefined : theme.border }}
                        >
                          <ArtworkImage uri={item.artwork} iconSize={32} className="w-full h-full" />
                          {isCurrent && (
                            <View className="absolute inset-0 bg-black/60 items-center justify-center">
                              <View className="w-10 h-10 rounded-full bg-purple-600 items-center justify-center">
                                <Icon name={isPlaying ? "pause" : "play"} size={22} color="#FFFFFF" />
                              </View>
                            </View>
                          )}
                        </View>
                        <AppText
                          variant="songTitle"
                          color={isCurrent ? undefined : 'textPrimary'}
                          className={`text-sm font-semibold mb-0.5 ${isCurrent ? "text-purple-400 font-bold" : ""}`}
                          numberOfLines={1}
                        >
                          {cleanTitle(item.title)}
                        </AppText>
                        <AppText variant="artist" color="textSecondary" className="text-xs font-medium" numberOfLines={1}>
                          {cleanTitle(item.artist)}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ))}

            {/* 4. Made for your taste: [Genre Name] Shelves */}
            {deduplicatedGenreShelves.map((shelf) => (
              <View key={`shelf-gnr-${shelf.genreName}`} className="mb-8">
                <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
                  Made for your taste: {cleanTitle(shelf.genreName)}
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                  {shelf.songs.map((item, idx) => {
                    const isCurrent = currentTrack?.id === item.id;
                    return (
                      <Pressable
                        key={`gnr-song-${item.id}`}
                        onPress={() => handleSelectSong(shelf.songs, idx)}
                        className="w-36 active:scale-[0.96]"
                      >
                        <View
                          className={`w-36 h-36 rounded-2xl overflow-hidden mb-2.5 border relative ${
                            isCurrent ? 'border-purple-500' : ''
                          }`}
                          style={{ backgroundColor: theme.surface, borderColor: isCurrent ? undefined : theme.border }}
                        >
                          <ArtworkImage uri={item.artwork} iconSize={32} className="w-full h-full" />
                          {isCurrent && (
                            <View className="absolute inset-0 bg-black/60 items-center justify-center">
                              <View className="w-10 h-10 rounded-full bg-purple-600 items-center justify-center">
                                <Icon name={isPlaying ? "pause" : "play"} size={22} color="#FFFFFF" />
                              </View>
                            </View>
                          )}
                        </View>
                        <AppText
                          variant="songTitle"
                          color={isCurrent ? undefined : 'textPrimary'}
                          className={`text-sm font-semibold mb-0.5 ${isCurrent ? "text-purple-400 font-bold" : ""}`}
                          numberOfLines={1}
                        >
                          {cleanTitle(item.title)}
                        </AppText>
                        <AppText variant="artist" color="textSecondary" className="text-xs font-medium" numberOfLines={1}>
                          {cleanTitle(item.artist)}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ))}

            {/* 5. Preference-Aware Discovery */}
            {deduplicatedDiscovery.length > 0 && (
              <View className="mb-8">
                <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
                  Discover More For You
                </AppText>
                {deduplicatedDiscovery.map((item, index) => {
                  const isCurrent = currentTrack?.id === item.id;
                  return (
                    <Pressable
                      key={`pref-disc-${item.id}`}
                      onPress={() => handleSelectSong(deduplicatedDiscovery, index)}
                      className="flex-row items-center py-2.5 px-3 rounded-2xl mb-1.5 border active:scale-[0.99]"
                      style={
                        isCurrent
                          ? { backgroundColor: theme.isDark ? '#221A35' : theme.surfacePressed, borderColor: 'rgba(168, 85, 247, 0.6)' }
                          : { backgroundColor: theme.surface, borderColor: theme.border }
                      }
                    >
                      <View className="relative w-12 h-12 rounded-xl overflow-hidden mr-3 shrink-0" style={{ backgroundColor: theme.surfacePressed }}>
                        <ArtworkImage uri={item.artwork} iconSize={20} className="w-full h-full" />
                        {isCurrent && (
                          <View className="absolute inset-0 bg-black/60 items-center justify-center">
                            <Icon name={isPlaying ? "pause" : "play"} size={18} color="#C084FC" />
                          </View>
                        )}
                      </View>
                      <View className="flex-1 mr-2 min-w-0">
                        <AppText
                          variant="songTitle"
                          color={isCurrent ? undefined : 'textPrimary'}
                          className={`text-sm font-semibold mb-0.5 ${isCurrent ? "text-purple-400 font-bold" : ""}`}
                          numberOfLines={1}
                        >
                          {cleanTitle(item.title)}
                        </AppText>
                        <AppText variant="artist" color="textSecondary" className="text-xs font-medium" numberOfLines={1}>
                          {cleanTitle(item.artist)} {item.album ? `• ${cleanTitle(item.album)}` : ""}
                        </AppText>
                      </View>
                      {item.duration > 0 && (
                        <AppText variant="caption" color="textMuted" className="text-xs font-medium shrink-0">
                          {formatDuration(item.duration)}
                        </AppText>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          /* ============================================================== */
          /* 2. ANONYMOUS / UN-ONBOARDED USER HOME (GENERIC DISCOVERY)     */
          /* ============================================================== */
          <View>
            {/* Gentle Profile Completion Reminder Card */}
            {user && profile && !profile.onboarding_completed && !reminderDismissed && (
              <View
                className="mb-6 p-4 rounded-2xl border flex-row items-center justify-between"
                style={{ backgroundColor: theme.isDark ? '#1C162E' : theme.surfaceElevated, borderColor: '#A855F7' }}
              >
                <View className="flex-1 mr-3">
                  <AppText variant="songTitle" className="text-sm font-bold mb-0.5">
                    Make Jamkudi more personal
                  </AppText>
                  <AppText variant="caption" color="textSecondary" className="text-xs font-medium leading-4">
                    Add your favorite artists and genres to build your personalized home.
                  </AppText>
                </View>

                <View className="flex-row items-center gap-x-2">
                  <Pressable
                    onPress={() => router.push("/(auth)/onboarding")}
                    className="px-3.5 py-2 rounded-full bg-purple-600 active:bg-purple-700 active:scale-[0.96]"
                  >
                    <AppText className="text-xs font-bold text-white">
                      Complete profile
                    </AppText>
                  </Pressable>

                  <Pressable
                    onPress={() => setReminderDismissed(true)}
                    hitSlop={8}
                    className="p-1 rounded-full active:bg-white/10"
                  >
                    <Icon name="x" size={18} color={theme.textMuted} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Quick Picks */}
            {anonymousSection2.length > 0 && (
              <View className="mb-8">
                <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
                  Quick Picks
                </AppText>
                <View className="flex-row flex-wrap justify-between" style={{ rowGap: 10 }}>
                  {anonymousSection2.map((item, idx) => {
                    const isCurrent = currentTrack?.id === item.id;
                    return (
                      <Pressable
                        key={`anon-qp-${item.id}-${idx}`}
                        onPress={() => handleSelectSong(anonymousSection2, idx)}
                        className="h-14 w-[48.5%] rounded-2xl flex-row items-center overflow-hidden border active:scale-[0.97]"
                        style={
                          isCurrent
                            ? { backgroundColor: theme.isDark ? '#221A35' : theme.surfacePressed, borderColor: 'rgba(168, 85, 247, 0.8)' }
                            : { backgroundColor: theme.surface, borderColor: theme.border }
                        }
                      >
                        <View className="w-14 h-14 relative shrink-0" style={{ backgroundColor: theme.surfacePressed }}>
                          <ArtworkImage uri={item.artwork} iconSize={18} className="w-full h-full" />
                          {isCurrent && (
                            <View className="absolute inset-0 bg-black/60 items-center justify-center">
                              <Icon name={isPlaying ? "pause" : "play"} size={16} color="#C084FC" />
                            </View>
                          )}
                        </View>
                        <AppText
                          variant="body"
                          color={isCurrent ? undefined : 'textPrimary'}
                          className={`text-xs font-semibold px-2.5 flex-1 ${isCurrent ? "text-purple-300 font-bold" : ""}`}
                          numberOfLines={2}
                        >
                          {cleanTitle(item.title)}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Popular Right Now */}
            {popularFeed.length > 0 && (
              <View className="mb-8">
                <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
                  Popular Right Now
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                  {popularFeed.map((item, idx) => {
                    const isCurrent = currentTrack?.id === item.id;
                    return (
                      <Pressable
                        key={`pop-${item.id}`}
                        onPress={() => handleSelectSong(popularFeed, idx)}
                        className="w-36 active:scale-[0.96]"
                      >
                        <View
                          className={`w-36 h-36 rounded-2xl overflow-hidden mb-2.5 border relative ${
                            isCurrent ? 'border-purple-500' : ''
                          }`}
                          style={{ backgroundColor: theme.surface, borderColor: isCurrent ? undefined : theme.border }}
                        >
                          <ArtworkImage uri={item.artwork} iconSize={32} className="w-full h-full" />
                          {isCurrent && (
                            <View className="absolute inset-0 bg-black/60 items-center justify-center">
                              <View className="w-10 h-10 rounded-full bg-purple-600 items-center justify-center">
                                <Icon name={isPlaying ? "pause" : "play"} size={22} color="#FFFFFF" />
                              </View>
                            </View>
                          )}
                        </View>
                        <AppText
                          variant="songTitle"
                          color={isCurrent ? undefined : 'textPrimary'}
                          className={`text-sm font-semibold mb-0.5 ${isCurrent ? "text-purple-400 font-bold" : ""}`}
                          numberOfLines={1}
                        >
                          {cleanTitle(item.title)}
                        </AppText>
                        <AppText variant="artist" color="textSecondary" className="text-xs font-medium" numberOfLines={1}>
                          {cleanTitle(item.artist)}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Featured Artists */}
            <View className="mb-8">
              <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
                Featured Artists
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
                {FEATURED_ARTISTS.map((artist) => (
                  <Pressable
                    key={`feat-art-${artist.id}`}
                    onPress={() => router.push(`/artist/${encodeURIComponent(artist.query)}` as any)}
                    className="items-center w-20 active:scale-[0.94]"
                  >
                    <View
                      className="w-20 h-20 rounded-full overflow-hidden mb-2 border border-purple-500/40"
                      style={{ backgroundColor: theme.surface }}
                    >
                      <ArtworkImage uri={artist.imageUrl} iconSize={24} className="w-full h-full" />
                    </View>
                    <AppText variant="caption" color="textSecondary" className="text-xs font-semibold text-center" numberOfLines={1}>
                      {cleanTitle(artist.name)}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Trending Discovery */}
            {discoveryFeed.length > 0 && (
              <View className="mb-8">
                <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
                  Trending Discovery
                </AppText>
                {discoveryFeed.map((item, index) => {
                  const isCurrent = currentTrack?.id === item.id;
                  return (
                    <Pressable
                      key={`anon-disc-${item.id}`}
                      onPress={() => handleSelectSong(discoveryFeed, index)}
                      className="flex-row items-center py-2.5 px-3 rounded-2xl mb-1.5 border active:scale-[0.99]"
                      style={
                        isCurrent
                          ? { backgroundColor: theme.isDark ? '#221A35' : theme.surfacePressed, borderColor: 'rgba(168, 85, 247, 0.6)' }
                          : { backgroundColor: theme.surface, borderColor: theme.border }
                      }
                    >
                      <View className="relative w-12 h-12 rounded-xl overflow-hidden mr-3 shrink-0" style={{ backgroundColor: theme.surfacePressed }}>
                        <ArtworkImage uri={item.artwork} iconSize={20} className="w-full h-full" />
                        {isCurrent && (
                          <View className="absolute inset-0 bg-black/60 items-center justify-center">
                            <Icon name={isPlaying ? "pause" : "play"} size={18} color="#C084FC" />
                          </View>
                        )}
                      </View>
                      <View className="flex-1 mr-2 min-w-0">
                        <AppText
                          variant="songTitle"
                          color={isCurrent ? undefined : 'textPrimary'}
                          className={`text-sm font-semibold mb-0.5 ${isCurrent ? "text-purple-400 font-bold" : ""}`}
                          numberOfLines={1}
                        >
                          {cleanTitle(item.title)}
                        </AppText>
                        <AppText variant="artist" color="textSecondary" className="text-xs font-medium" numberOfLines={1}>
                          {cleanTitle(item.artist)} {item.album ? `• ${cleanTitle(item.album)}` : ""}
                        </AppText>
                      </View>
                      {item.duration > 0 && (
                        <AppText variant="caption" color="textMuted" className="text-xs font-medium shrink-0">
                          {formatDuration(item.duration)}
                        </AppText>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </Screen>
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
