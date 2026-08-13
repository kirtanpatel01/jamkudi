import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView } from "react-native";
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
import {
  JioSaavnSong,
  searchSongs,
  getTrendingFeed,
  FEATURED_ARTISTS,
  FeaturedArtist,
} from "@/services/jiosaavn";
import { View, Pressable } from "@/tw";

interface VibeOption {
  id: string;
  label: string;
  query: string;
}

const VIBE_OPTIONS: VibeOption[] = [
  { id: "chill", label: "Chill 🌊", query: "Chill Melodies" },
  { id: "energetic", label: "Energetic ⚡", query: "High Energy Beats" },
  { id: "romantic", label: "Romantic 💖", query: "Romantic Songs" },
  { id: "focus", label: "Focus 🧠", query: "Focus Ambient" },
  { id: "party", label: "Party 🎉", query: "Party Dance Hits" },
  { id: "nostalgic", label: "Nostalgic 📻", query: "Nostalgic Retro Hits" },
  { id: "sad", label: "Sad 🌧️", query: "Sad Melodies" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { playQueue, currentTrack, isPlaying, recentlyPlayed } = usePlayer();

  const [popularSongs, setPopularSongs] = useState<JioSaavnSong[]>([]);
  const [discoverySongs, setDiscoverySongs] = useState<JioSaavnSong[]>([]);
  const [activeVibe, setActiveVibe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [vibeLoading, setVibeLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      getTrendingFeed(),
      searchSongs("Top Trending Hits", 0, 15),
    ]).then(([trending, discovery]) => {
      if (isMounted) {
        setPopularSongs(trending);
        setDiscoverySongs(discovery);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectSong = async (songsList: JioSaavnSong[], index: number) => {
    await playQueue(songsList, index);
    router.push("/player");
  };

  const handleSelectArtist = async (artist: FeaturedArtist) => {
    showToast(`Loading ${artist.name}...`, "info");
    const artistSongs = await searchSongs(artist.query, 0, 15);
    if (artistSongs.length > 0) {
      await playQueue(artistSongs, 0);
      router.push("/player");
    }
  };

  const handleSelectVibe = async (vibe: VibeOption) => {
    setActiveVibe(vibe.id);
    setVibeLoading(true);
    showToast(`Setting vibe: ${vibe.label}`, "info");

    const vibeSongs = await searchSongs(vibe.query, 0, 20);
    setVibeLoading(false);

    if (vibeSongs.length > 0) {
      await playQueue(vibeSongs, 0);
      router.push("/player");
    }
  };

  // Global Deduplication Engine across all Home sections
  const seenTrackIds = new Set<string>();

  // Section 2 Data: History or Quick Picks
  const section2Items: JioSaavnSong[] = [];
  if (recentlyPlayed.length > 0) {
    recentlyPlayed.slice(0, 6).forEach((track) => {
      if (!seenTrackIds.has(track.id)) {
        seenTrackIds.add(track.id);
        section2Items.push(track);
      }
    });
  } else {
    popularSongs.slice(0, 6).forEach((track) => {
      if (!seenTrackIds.has(track.id)) {
        seenTrackIds.add(track.id);
        section2Items.push(track);
      }
    });
  }

  // Section 3 Data: Popular Right Now (Deduplicated)
  const popularFeed: JioSaavnSong[] = [];
  popularSongs.forEach((song) => {
    if (!seenTrackIds.has(song.id)) {
      seenTrackIds.add(song.id);
      popularFeed.push(song);
    }
  });

  // Section 5 Data: Trending Discovery (Deduplicated)
  const discoveryFeed: JioSaavnSong[] = [];
  discoverySongs.forEach((song) => {
    if (!seenTrackIds.has(song.id)) {
      seenTrackIds.add(song.id);
      discoveryFeed.push(song);
    }
  });

  return (
    <>
      <Screen scrollable paddingHorizontal={16}>
        {/* Header */}
        <View className="flex-row items-center justify-between mt-2 mb-5">
          <View>
            <AppText variant="caption" className="text-xs text-zinc-400 font-medium">
              WELCOME BACK
            </AppText>
            <AppText variant="screenTitle" className="text-2xl font-bold">
              {getGreeting()}
            </AppText>
          </View>

          <View className="flex-row items-center gap-x-2">
            <IconButton
              name="bell"
              size={22}
              color={theme.textPrimary}
              onPress={() => showToast("No new notifications", "info")}
              accessibilityLabel="Notifications"
            />
            <IconButton
              name="settings"
              size={22}
              color={theme.textPrimary}
              onPress={() => setShowSettings(true)}
              accessibilityLabel="Settings"
            />
          </View>
        </View>

        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
            <AppText variant="caption" className="mt-3 text-zinc-400 font-medium">
              Loading your music feed...
            </AppText>
          </View>
        ) : (
          <View>
            {/* 1. Set the Vibe ✨ (Jamkudi Identity First) */}
            <View className="mb-7 p-4 rounded-3xl bg-purple-950/25 border border-purple-500/20 shadow-md">
              <View className="flex-row items-center justify-between mb-1">
                <AppText variant="sectionTitle" className="text-lg font-bold">
                  Set the Vibe ✨
                </AppText>
                {vibeLoading && <ActivityIndicator size="small" color={theme.primary} />}
              </View>
              <AppText variant="caption" className="text-xs text-zinc-400 font-medium mb-3.5">
                What are you feeling right now?
              </AppText>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-x-2"
              >
                {VIBE_OPTIONS.map((vibe) => {
                  const isActive = activeVibe === vibe.id;
                  return (
                    <Pressable
                      key={vibe.id}
                      onPress={() => handleSelectVibe(vibe)}
                      className={`px-4 py-2 rounded-full border ${
                        isActive
                          ? "bg-purple-600 border-purple-500"
                          : "bg-white/5 border-white/10"
                      } active:opacity-80`}
                    >
                      <AppText
                        className={`text-xs font-semibold ${
                          isActive ? "text-white font-bold" : "text-zinc-300"
                        }`}
                      >
                        {vibe.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. Continue Listening / Quick Picks (Dynamic) */}
            {section2Items.length > 0 && (
              <View className="mb-8">
                <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
                  {recentlyPlayed.length > 0 ? "Continue Listening 🎧" : "Quick Picks ⚡"}
                </AppText>
                <View className="flex-row flex-wrap gap-2.5">
                  {section2Items.map((item, idx) => {
                    const isCurrent = currentTrack?.id === item.id;
                    return (
                      <Pressable
                        key={`${item.id}-${idx}`}
                        onPress={() => handleSelectSong(section2Items, idx)}
                        className="w-[48%] h-14 rounded-xl flex-row items-center overflow-hidden active:opacity-80"
                        style={{
                          backgroundColor: theme.surfaceElevated,
                          borderWidth: 0.5,
                          borderColor: theme.border,
                        }}
                      >
                        <View className="w-14 h-14 bg-zinc-800 relative">
                          <ArtworkImage
                            uri={item.artwork}
                            iconSize={18}
                            className="w-full h-full"
                          />
                          {isCurrent && (
                            <View className="absolute inset-0 bg-black/50 items-center justify-center">
                              <Icon
                                name={isPlaying ? "pause" : "play"}
                                size={16}
                                color="#FFFFFF"
                              />
                            </View>
                          )}
                        </View>
                        <AppText
                          variant="body"
                          className={`text-xs font-semibold px-2 flex-1 ${
                            isCurrent ? "text-purple-400" : ""
                          }`}
                          numberOfLines={2}
                        >
                          {item.title}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 3. Popular Right Now (Deduplicated) */}
            {popularFeed.length > 0 && (
              <View className="mb-8">
                <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
                  Popular Right Now 🔥
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-x-4 pr-4"
                >
                  {popularFeed.map((item, idx) => {
                    const isCurrent = currentTrack?.id === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => handleSelectSong(popularFeed, idx)}
                        className="w-36 active:opacity-85"
                      >
                        <View className="w-36 h-36 rounded-2xl overflow-hidden mb-2 bg-zinc-800 relative shadow-md">
                          <ArtworkImage
                            uri={item.artwork}
                            iconSize={32}
                            className="w-full h-full"
                          />
                          {isCurrent && (
                            <View className="absolute inset-0 bg-black/50 items-center justify-center">
                              <Icon
                                name={isPlaying ? "pause" : "play"}
                                size={28}
                                color="#FFFFFF"
                              />
                            </View>
                          )}
                        </View>

                        <AppText
                          variant="songTitle"
                          className={`text-sm font-semibold mb-0.5 ${
                            isCurrent ? "text-purple-400 font-bold" : ""
                          }`}
                          numberOfLines={1}
                        >
                          {item.title}
                        </AppText>
                        <AppText
                          variant="artist"
                          className="text-xs text-zinc-400 font-medium"
                          numberOfLines={1}
                        >
                          {item.artist}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* 4. Featured Artists */}
            <View className="mb-8">
              <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
                Featured Artists 🎤
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-x-5 pr-4"
              >
                {FEATURED_ARTISTS.map((artist) => (
                  <Pressable
                    key={artist.id}
                    onPress={() => handleSelectArtist(artist)}
                    className="items-center w-20 active:opacity-80"
                  >
                    <View className="w-20 h-20 rounded-full overflow-hidden mb-2 bg-zinc-800 border-2 border-purple-500/40">
                      <ArtworkImage
                        uri={artist.imageUrl}
                        iconSize={24}
                        className="w-full h-full"
                      />
                    </View>
                    <AppText
                      variant="caption"
                      className="text-xs font-semibold text-center"
                      numberOfLines={1}
                    >
                      {artist.name}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* 5. Trending Discovery */}
            {discoveryFeed.length > 0 && (
              <View className="mb-8">
                <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
                  Trending Discovery 🎵
                </AppText>

                {discoveryFeed.map((item, index) => {
                  const isCurrent = currentTrack?.id === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectSong(discoveryFeed, index)}
                      className="flex-row items-center py-2 px-1 rounded-xl mb-1 active:bg-white/5"
                    >
                      <View className="relative w-12 h-12 rounded-lg overflow-hidden mr-3 bg-zinc-800">
                        <ArtworkImage
                          uri={item.artwork}
                          iconSize={20}
                          className="w-full h-full"
                        />
                        {isCurrent && (
                          <View className="absolute inset-0 bg-black/50 items-center justify-center">
                            <Icon
                              name={isPlaying ? "pause" : "play"}
                              size={18}
                              color="#FFFFFF"
                            />
                          </View>
                        )}
                      </View>

                      <View className="flex-1 mr-2">
                        <AppText
                          variant="songTitle"
                          className={`text-sm font-semibold mb-0.5 ${
                            isCurrent ? "text-purple-400 font-bold" : ""
                          }`}
                          numberOfLines={1}
                        >
                          {item.title}
                        </AppText>
                        <AppText
                          variant="artist"
                          className="text-xs text-zinc-400 font-medium"
                          numberOfLines={1}
                        >
                          {item.artist} • {item.album}
                        </AppText>
                      </View>

                      {item.duration > 0 && (
                        <AppText
                          variant="caption"
                          className="text-xs text-zinc-400 font-medium"
                        >
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
