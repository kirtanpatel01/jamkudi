import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { JioSaavnSong, searchSongs } from "@/services/jiosaavn";
import { View, TextInput, Pressable } from "@/tw";
import { Image } from "@/tw/image";

const CATEGORIES = ["Trending", "Bollywood", "Punjabi", "Romantic", "Pop", "Lo-Fi", "Dance"];

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { playQueue, currentTrack, isPlaying } = usePlayer();

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Trending");
  const [results, setResults] = useState<JioSaavnSong[]>([]);
  const [loading, setLoading] = useState(false);

  // Load default category songs on mount or category change
  useEffect(() => {
    if (query.trim()) return;

    let isMounted = true;
    setLoading(true);
    const searchTerm = activeCategory === "Trending" ? "Top Hits" : `${activeCategory} Songs`;

    searchSongs(searchTerm, 0, 20).then((data) => {
      if (isMounted) {
        setResults(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) return;

    const timer = setTimeout(() => {
      setLoading(true);
      searchSongs(query, 0, 20).then((data) => {
        setResults(data);
        setLoading(false);
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectSong = async (song: JioSaavnSong, index: number) => {
    await playQueue(results, index);
    router.push("/player");
  };

  const handleSelectCategory = (cat: string) => {
    setActiveCategory(cat);
    setQuery("");
  };

  return (
    <Screen>
      <AppText variant="screenTitle" className="mb-4">
        Search
      </AppText>

      {/* Search Input Box */}
      <View
        className="flex-row items-center px-4 h-12 rounded-xl border mb-4"
        style={{
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
        }}
      >
        <Icon name="search" size={20} color={theme.textMuted} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search songs, artists, albums..."
          placeholderTextColor={theme.textSecondary}
          className="flex-1 ml-3 text-sm font-medium"
          style={{ color: theme.textPrimary }}
          accessibilityLabel="Search music input"
          autoCorrect={false}
        />

        {query.length > 0 && (
          <Pressable
            onPress={() => setQuery("")}
            className="p-1 rounded-full active:opacity-70"
          >
            <AppText className="text-xs text-zinc-400 font-bold">✕</AppText>
          </Pressable>
        )}
      </View>

      {/* Category Pills Bar */}
      {!query.trim() && (
        <View className="mb-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-x-2"
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => handleSelectCategory(cat)}
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
                    {cat}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Loading Indicator or Results */}
      {loading ? (
        <View className="py-12 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <AppText variant="caption" className="mt-3 text-zinc-400 font-medium">
            Fetching tracks...
          </AppText>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-24"
          ListHeaderComponent={
            <AppText
              variant="caption"
              className="mb-3 uppercase tracking-wider text-[11px] text-zinc-400 font-bold"
            >
              {query.trim() ? "Search Results" : `${activeCategory} Hits`}
            </AppText>
          }
          ListEmptyComponent={
            <View className="py-12 items-center">
              <AppText variant="body" className="text-zinc-400">
                No songs found for "{query}".
              </AppText>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <Pressable
                onPress={() => handleSelectSong(item, index)}
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
          }}
        />
      )}
    </Screen>
  );
}
