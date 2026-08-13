import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
import { SettingsModal } from "@/components/common/SettingsModal";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import {
  JioSaavnSong,
  searchSongs,
  getTrendingFeed,
  FEATURED_ARTISTS,
  FeaturedArtist,
} from "@/services/jiosaavn";
import { View, Pressable } from "@/tw";
import { Image } from "@/tw/image";

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
  const { playQueue, currentTrack, isPlaying } = usePlayer();

  const [trendingSongs, setTrendingSongs] = useState<JioSaavnSong[]>([]);
  const [topCharts, setTopCharts] = useState<JioSaavnSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      getTrendingFeed(),
      searchSongs("Bollywood Top 20", 0, 15),
    ]).then(([trending, charts]) => {
      if (isMounted) {
        setTrendingSongs(trending);
        setTopCharts(charts);
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
    const artistSongs = await searchSongs(artist.query, 0, 15);
    if (artistSongs.length > 0) {
      await playQueue(artistSongs, 0);
      router.push("/player");
    }
  };

  const quickGridItems = trendingSongs.slice(0, 6);

  return (
    <>
      <Screen scrollable paddingHorizontal={16}>
        {/* Top Header with Dynamic Greeting */}
        <View className="flex-row items-center justify-between mt-2 mb-6">
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
              onPress={() => {}}
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
        <View className="pb-24">
          {/* Quick Access 2-Column Grid */}
          {quickGridItems.length > 0 && (
            <View className="mb-8">
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {quickGridItems.map((item, idx) => {
                  const isCurrent = currentTrack?.id === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectSong(quickGridItems, idx)}
                      className="w-[48.5%] h-14 rounded-xl flex-row items-center overflow-hidden active:opacity-80"
                      style={{
                        backgroundColor: theme.surfaceElevated,
                        borderWidth: 0.5,
                        borderColor: theme.border,
                      }}
                    >
                      <View className="w-14 h-14 bg-zinc-800 relative">
                        {item.artwork ? (
                          <Image
                            source={{ uri: item.artwork }}
                            className="w-full h-full"
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center">
                            <Icon name="music" size={18} color={theme.primary} />
                          </View>
                        )}
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

          {/* Trending Hits Horizontal Scroll */}
          <View className="mb-8">
            <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
              Trending Hits 🔥
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-x-4 pr-4"
            >
              {trendingSongs.map((item, idx) => {
                const isCurrent = currentTrack?.id === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSelectSong(trendingSongs, idx)}
                    className="w-36 active:opacity-85"
                  >
                    <View className="w-36 h-36 rounded-2xl overflow-hidden mb-2 bg-zinc-800 relative shadow-md">
                      {item.artwork ? (
                        <Image
                          source={{ uri: item.artwork }}
                          className="w-full h-full"
                        />
                      ) : (
                        <View className="w-full h-full items-center justify-center bg-purple-900/30">
                          <Icon name="music" size={32} color={theme.primary} />
                        </View>
                      )}

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

          {/* Featured Artists Row */}
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
                  className="items-center w-24 active:opacity-80"
                >
                  <View className="w-20 h-20 rounded-full overflow-hidden mb-2 bg-zinc-800 shadow-md">
                    <Image
                      source={{ uri: artist.imageUrl }}
                      className="w-full h-full"
                    />
                  </View>
                  <AppText
                    variant="body"
                    className="text-xs font-semibold text-center"
                    numberOfLines={1}
                  >
                    {artist.name}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Top Charts List */}
          <View className="mb-4">
            <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
              Top Bollywood Charts 📊
            </AppText>

            {topCharts.map((item, idx) => {
              const isCurrent = currentTrack?.id === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectSong(topCharts, idx)}
                  className="flex-row items-center py-2.5 px-1 rounded-xl mb-1 active:bg-white/5"
                >
                  <View className="relative w-14 h-14 rounded-lg overflow-hidden mr-3.5 bg-zinc-800">
                    {item.artwork ? (
                      <Image source={{ uri: item.artwork }} className="w-full h-full" />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-purple-900/50">
                        <Icon name="music" size={20} color={theme.primary} />
                      </View>
                    )}

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
        </View>
      )}
    </Screen>
    <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
  </>
);
}
