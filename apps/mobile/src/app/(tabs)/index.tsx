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
import { EditorialHero } from "@/components/common/EditorialHero";
import { MusicShelf } from "@/components/common/MusicShelf";
import { ArtistPortrait } from "@/components/common/ArtistPortrait";
import { JamkudiMascot } from "@/components/common/JamkudiMascot";
import { SongRow } from "@/components/common/SongRow";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useDownloads } from "@/context/DownloadContext";
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
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getGreeting(displayName?: string | null): string {
  const hour = new Date().getHours();
  let baseGreeting = "Good evening";
  if (hour < 12) baseGreeting = "Good morning";
  else if (hour < 18) baseGreeting = "Good afternoon";

  const cleanName = displayName?.trim();
  if (
    cleanName &&
    cleanName.toLowerCase() !== "null" &&
    cleanName.toLowerCase() !== "undefined"
  ) {
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
  const { isSongDownloaded, downloadSongTrack, removeSongDownload } = useDownloads();

  // State for Authenticated Onboarded Users
  const [favoriteArtistsList, setFavoriteArtistsList] = useState<
    FavoriteArtistItem[]
  >([]);
  const [artistShelves, setArtistShelves] = useState<ArtistShelf[]>([]);
  const [genreShelves, setGenreShelves] = useState<GenreShelf[]>([]);
  const [preferenceDiscovery, setPreferenceDiscovery] = useState<
    JioSaavnSong[]
  >([]);

  // State for Anonymous / Un-onboarded Users
  const [popularSongs, setPopularSongs] = useState<JioSaavnSong[]>([]);
  const [discoverySongs, setDiscoverySongs] = useState<JioSaavnSong[]>([]);

  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  const isOnboardedUser = Boolean(
    user &&
    profile &&
    (profile.onboarding_completed ||
      (profile.favorite_artists && profile.favorite_artists.length > 0) ||
      (profile.favorite_genres && profile.favorite_genres.length > 0)),
  );

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadContent = async () => {
      try {
        if (isOnboardedUser && profile) {
          const rawFavArtists: any[] = profile.favorite_artists || [];
          const favArtistNames = rawFavArtists
            .map((item) => (typeof item === "string" ? item : item?.name || ""))
            .filter(Boolean);

          const favGenres = profile.favorite_genres || [];

          // 1. Resolve Favorite Artist Avatars / Images (Process ALL selected artists)
          const resolvedFavArtists: FavoriteArtistItem[] = await Promise.all(
            favArtistNames.map(async (name) => {
              const matched = FEATURED_ARTISTS.find(
                (fa) => fa.name.toLowerCase() === name.toLowerCase(),
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
                  } else if (
                    Array.isArray(topResult.image) &&
                    topResult.image.length > 0
                  ) {
                    const best =
                      topResult.image.find(
                        (i: any) => i?.quality === "500x500",
                      ) || topResult.image[topResult.image.length - 1];
                    imgUrl =
                      typeof best === "string"
                        ? best
                        : best?.url || best?.link || "";
                  }
                  if (imgUrl) return { name, imageUrl: imgUrl };
                }
              } catch {}
              return { name, imageUrl: "" };
            }),
          );

          // 2. Fetch content for ALL favorite artists with artist-matching validation & fallback
          const perArtistDiscoveryPools: Record<string, JioSaavnSong[]> = {};

          const artistPromises = favArtistNames.map(async (artistName) => {
            const primaryHits = await searchSongs(
              `${artistName} top hits`,
              0,
              20,
            ).catch(() => []);
            let validSongs = primaryHits.filter((song) =>
              isSongByArtist(song, artistName),
            );

            if (validSongs.length < 6) {
              const fallbackHits = await searchSongs(artistName, 0, 20).catch(
                () => [],
              );
              const validFallback = fallbackHits.filter((song) =>
                isSongByArtist(song, artistName),
              );

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
            const songs = await searchSongs(
              `${genreName} top songs`,
              0,
              15,
            ).catch(() => []);
            perGenreDiscoveryPools[genreName] = songs;
            return { genreName, songs: songs.slice(0, 10) };
          });

          const resolvedGenreShelves = await Promise.all(genrePromises);

          // 4. Build balanced discovery feed by interleaving pools across ALL favorite artists & genres
          const poolsToInterleave: JioSaavnSong[][] = [
            ...favArtistNames.map(
              (name) => perArtistDiscoveryPools[name] || [],
            ),
            ...favGenres.map((name) => perGenreDiscoveryPools[name] || []),
          ];

          const combinedDiscovery = interleaveArrays(poolsToInterleave);

          if (isMounted) {
            setFavoriteArtistsList(resolvedFavArtists);
            setArtistShelves(
              resolvedArtistShelves.filter((a) => a.songs.length > 0),
            );
            setGenreShelves(
              resolvedGenreShelves.filter((g) => g.songs.length > 0),
            );
            setPreferenceDiscovery(combinedDiscovery);
          }
        } else {
          // Anonymous / Incomplete profile catalog load
          const { popularSongs: trending, discoverySongs: discovery } =
            await fetchHomeCatalog();
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

  const deduplicatedArtistShelves = artistShelves
    .map((shelf) => {
      const filteredSongs = shelf.songs.filter((song) => !isDuplicate(song));
      return { ...shelf, songs: filteredSongs };
    })
    .filter((shelf) => shelf.songs.length > 0);

  const deduplicatedGenreShelves = genreShelves
    .map((shelf) => {
      const filteredSongs = shelf.songs.filter((song) => !isDuplicate(song));
      return { ...shelf, songs: filteredSongs };
    })
    .filter((shelf) => shelf.songs.length > 0);

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
        <View className="flex-row items-center justify-between mt-2 mb-6">
          <View className="flex-row items-center flex-1 mr-3">
            <View
              className="w-11 h-11 rounded-full overflow-hidden mr-3 border shrink-0"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
            >
              <Image
                source={require("../../../assets/images/icon.jpg")}
                className="w-full h-full"
                contentFit="cover"
              />
            </View>
            <View className="flex-1 min-w-0">
              <AppText
                variant="caption"
                color="textSecondary"
                className="text-xs font-bold tracking-wider uppercase"
                numberOfLines={1}
              >
                {isOnboardedUser ? "Jamkudi" : "Welcome to Jamkudi"}
              </AppText>
              <AppText
                variant="screenTitle"
                className="text-2xl font-bold tracking-tight"
                numberOfLines={1}
              >
                {getGreeting(profile?.display_name)}
              </AppText>
            </View>
          </View>

          <View className="flex-row items-center gap-x-2 shrink-0">
            <Pressable
              onPress={() => showToast("No new notifications", "info")}
              className="w-10 h-10 rounded-full items-center justify-center border active:opacity-80 active:scale-[0.94]"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Icon name="bell" size={20} color={theme.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full items-center justify-center border active:opacity-80 active:scale-[0.94]"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Icon name="settings" size={20} color={theme.textPrimary} />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
            <AppText
              variant="caption"
              color="textSecondary"
              className="mt-3 font-medium text-xs"
            >
              Preparing your music sanctuary...
            </AppText>
          </View>
        ) : isOnboardedUser ? (
          /* ============================================================== */
          /* 1. AUTHENTICATED & ONBOARDED USER HOME (ORGANIC MUSIC FLOW)    */
          /* ============================================================== */
          <View>
            {/* 1. Featured Listening Spotlight (EditorialHero) */}
            {onboardedRecentlyPlayed.length > 0 && (
              <View className="mb-6">
                <EditorialHero
                  title={cleanTitle(onboardedRecentlyPlayed[0].title)}
                  subtitle={cleanTitle(onboardedRecentlyPlayed[0].artist)}
                  artworkUri={onboardedRecentlyPlayed[0].artwork}
                  badge="SANCTUARY FOCUS"
                  isPlaying={
                    currentTrack?.id === onboardedRecentlyPlayed[0].id &&
                    isPlaying
                  }
                  onPlayPress={() =>
                    handleSelectSong(onboardedRecentlyPlayed, 0)
                  }
                />

                {/* Remaining Recently Played loose music shelf */}
                {onboardedRecentlyPlayed.length > 1 && (
                  <MusicShelf
                    title="Recently Listened"
                    items={onboardedRecentlyPlayed.slice(1).map((song) => ({
                      id: song.id,
                      title: cleanTitle(song.title),
                      subtitle: cleanTitle(song.artist),
                      artworkUri: song.artwork,
                    }))}
                    currentId={currentTrack?.id}
                    isPlaying={isPlaying}
                    itemWidth={128}
                    onItemPress={(_, idx) =>
                      handleSelectSong(onboardedRecentlyPlayed, idx + 1)
                    }
                  />
                )}
              </View>
            )}

            {/* 2. Your Favorite Artists (Circular portraits) */}
            {favoriteArtistsList.length > 0 && (
              <View className="mb-8">
                <AppText
                  variant="sectionTitle"
                  className="text-base font-bold mb-3.5 px-0.5"
                >
                  Your Favorite Artists
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 18 }}
                >
                  {favoriteArtistsList.map((artist, idx) => (
                    <ArtistPortrait
                      key={`favart-${artist.name}-${idx}`}
                      name={cleanTitle(artist.name)}
                      imageUrl={artist.imageUrl}
                      onPress={() => handleSelectArtist(artist.name)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 3. Because you like [Artist Name] Shelves */}
            {deduplicatedArtistShelves.map((shelf) => (
              <MusicShelf
                key={`shelf-art-${shelf.artistName}`}
                title={`Because you like ${cleanTitle(shelf.artistName)}`}
                items={shelf.songs.map((song) => ({
                  id: song.id,
                  title: cleanTitle(song.title),
                  subtitle: cleanTitle(song.artist),
                  artworkUri: song.artwork,
                }))}
                currentId={currentTrack?.id}
                isPlaying={isPlaying}
                itemWidth={140}
                onItemPress={(_, idx) => handleSelectSong(shelf.songs, idx)}
              />
            ))}

            {/* 4. Made for your taste: [Genre Name] Shelves */}
            {deduplicatedGenreShelves.map((shelf) => (
              <MusicShelf
                key={`shelf-gnr-${shelf.genreName}`}
                title={`Made for your taste: ${cleanTitle(shelf.genreName)}`}
                items={shelf.songs.map((song) => ({
                  id: song.id,
                  title: cleanTitle(song.title),
                  subtitle: cleanTitle(song.artist),
                  artworkUri: song.artwork,
                }))}
                currentId={currentTrack?.id}
                isPlaying={isPlaying}
                itemWidth={140}
                onItemPress={(_, idx) => handleSelectSong(shelf.songs, idx)}
              />
            ))}

            {/* 5. Preference-Aware Discovery Stream */}
            {deduplicatedDiscovery.length > 0 && (
              <View className="mb-8">
                <AppText
                  variant="sectionTitle"
                  className="text-base font-bold mb-3 px-0.5"
                >
                  Discover More For You
                </AppText>
                {deduplicatedDiscovery.map((item, index) => (
                  <SongRow
                    key={`pref-disc-${item.id}`}
                    songId={item.id}
                    title={cleanTitle(item.title)}
                    artist={cleanTitle(item.artist)}
                    artworkUri={item.artwork}
                    duration={formatDuration(item.duration)}
                    isPlaying={currentTrack?.id === item.id}
                    onPress={() =>
                      handleSelectSong(deduplicatedDiscovery, index)
                    }
                    onDownloadPress={() => {
                      if (isSongDownloaded(item.id)) {
                        removeSongDownload(item.id);
                      } else {
                        downloadSongTrack(item);
                      }
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          /* ============================================================== */
          /* 2. ANONYMOUS / UN-ONBOARDED USER HOME (GENERIC DISCOVERY)     */
          /* ============================================================== */
          <View>
            {/* Gentle Profile Completion Reminder Card */}
            {user &&
              profile &&
              !profile.onboarding_completed &&
              !reminderDismissed && (
                <View
                  className="mb-6 p-4 rounded-3xl border flex-row items-center justify-between"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  }}
                >
                  <View className="flex-1 mr-3">
                    <AppText
                      variant="songTitle"
                      className="text-sm font-bold mb-0.5"
                    >
                      Make Jamkudi more personal
                    </AppText>
                    <AppText
                      variant="caption"
                      color="textSecondary"
                      className="text-xs font-medium leading-4"
                    >
                      Add your favorite artists and genres to build your
                      personalized home.
                    </AppText>
                  </View>

                  <View className="flex-row items-center gap-x-2">
                    <Pressable
                      onPress={() => router.push("/(auth)/onboarding")}
                      className="px-3.5 py-2 rounded-full bg-[#9B7CFF] active:bg-[#8062E8] active:scale-[0.96]"
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

            {/* Featured Hero for Anonymous Users */}
            {anonymousSection2.length > 0 && (
              <EditorialHero
                title={cleanTitle(anonymousSection2[0].title)}
                subtitle={cleanTitle(anonymousSection2[0].artist)}
                artworkUri={anonymousSection2[0].artwork}
                badge="POPULAR PICK"
                isPlaying={
                  currentTrack?.id === anonymousSection2[0].id && isPlaying
                }
                onPlayPress={() => handleSelectSong(anonymousSection2, 0)}
                className="mb-6"
              />
            )}

            {/* Popular Right Now Shelf */}
            {popularFeed.length > 0 && (
              <MusicShelf
                title="Popular Right Now"
                items={popularFeed.map((song) => ({
                  id: song.id,
                  title: cleanTitle(song.title),
                  subtitle: cleanTitle(song.artist),
                  artworkUri: song.artwork,
                }))}
                currentId={currentTrack?.id}
                isPlaying={isPlaying}
                itemWidth={140}
                onItemPress={(_, idx) => handleSelectSong(popularFeed, idx)}
              />
            )}

            {/* Featured Artists */}
            <View className="mb-8">
              <AppText
                variant="sectionTitle"
                className="text-base font-bold mb-3.5 px-0.5"
              >
                Featured Artists
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 18 }}
              >
                {FEATURED_ARTISTS.map((artist) => (
                  <ArtistPortrait
                    key={`feat-art-${artist.id}`}
                    name={cleanTitle(artist.name)}
                    imageUrl={artist.imageUrl}
                    onPress={() =>
                      router.push(
                        `/artist/${encodeURIComponent(artist.query)}` as any,
                      )
                    }
                  />
                ))}
              </ScrollView>
            </View>

            {/* Trending Discovery Stream */}
            {discoveryFeed.length > 0 && (
              <View className="mb-8">
                <AppText
                  variant="sectionTitle"
                  className="text-base font-bold mb-3 px-0.5"
                >
                  Trending Discovery
                </AppText>
                {discoveryFeed.map((item, index) => (
                  <SongRow
                    key={`anon-disc-${item.id}`}
                    title={cleanTitle(item.title)}
                    artist={cleanTitle(item.artist)}
                    artworkUri={item.artwork}
                    duration={formatDuration(item.duration)}
                    isPlaying={currentTrack?.id === item.id}
                    onPress={() => handleSelectSong(discoveryFeed, index)}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </Screen>
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
