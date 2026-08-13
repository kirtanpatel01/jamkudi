import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { JioSaavnSong, searchSongs } from "@/services/jiosaavn";
import { loadSearchHistory, addSearchQuery, clearSearchHistory } from "@/utils/storage";
import { View, TextInput, Pressable } from "@/tw";

const EXPLORE_CATEGORIES = [
  { id: "popular", label: "Popular", query: "Top Hits" },
  { id: "bollywood", label: "Bollywood", query: "Bollywood Hits" },
  { id: "punjabi", label: "Punjabi", query: "Punjabi Hits" },
  { id: "pop", label: "Pop", query: "Pop Hits" },
  { id: "lofi", label: "Lo-Fi", query: "Lo-Fi Beats" },
  { id: "dance", label: "Dance", query: "Dance Party Hits" },
];

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { playQueue, playNext, currentTrack, isPlaying } = usePlayer();

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Popular");
  const [results, setResults] = useState<JioSaavnSong[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load recent search history on mount
  useEffect(() => {
    loadSearchHistory().then((history) => {
      setRecentSearches(history.slice(0, 6)); // Cap at 6 terms horizontally
    });
  }, []);

  // Load default category songs on mount or category change (WITHOUT saving category to search history)
  useEffect(() => {
    if (query.trim()) return;

    let isMounted = true;
    setLoading(true);

    const catObj =
      EXPLORE_CATEGORIES.find((c) => c.label === activeCategory) || EXPLORE_CATEGORIES[0];

    searchSongs(catObj.query, 0, 20).then((data) => {
      if (isMounted) {
        setResults(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  // Debounced search for INTENTIONAL user typing (saves query to search history)
  useEffect(() => {
    if (!query.trim()) return;

    const timer = setTimeout(() => {
      setLoading(true);
      searchSongs(query, 0, 20).then((data) => {
        setResults(data);
        setLoading(false);
        // Strictly save intentional typed queries
        addSearchQuery(query).then((updated) => setRecentSearches(updated.slice(0, 6)));
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectSong = async (song: JioSaavnSong, index: number) => {
    await playQueue(results, index);
    showToast(`Playing ${song.title}`, "info");
  };

  const handleSelectCategory = (catLabel: string) => {
    setActiveCategory(catLabel);
    setQuery("");
  };

  const handleSelectRecentQuery = (searchTerm: string) => {
    setQuery(searchTerm);
  };

  const handleClearHistory = () => {
    clearSearchHistory().then(() => {
      setRecentSearches([]);
      showToast("Search history cleared", "info");
    });
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
            className="p-1.5 rounded-full active:opacity-70"
            hitSlop={8}
          >
            <AppText className="text-xs text-zinc-400 font-bold">✕</AppText>
          </Pressable>
        )}
      </View>

      {/* Intentional Recent Searches Row (Capped at 6) */}
      {!query.trim() && recentSearches.length > 0 && (
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <AppText variant="caption" className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
              Recent Searches
            </AppText>
            <Pressable onPress={handleClearHistory} hitSlop={8}>
              <AppText className="text-xs text-purple-400 font-semibold">Clear</AppText>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-x-2">
            {recentSearches.map((term) => (
              <Pressable
                key={term}
                onPress={() => handleSelectRecentQuery(term)}
                className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 active:opacity-80 flex-row items-center"
              >
                <Icon name="clock" size={12} color={theme.textMuted} />
                <AppText className="text-xs text-zinc-300 font-medium ml-1.5">{term}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Explore Category Pills Bar */}
      {!query.trim() && (
        <View className="mb-5">
          <AppText variant="caption" className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-2">
            Explore
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-x-2"
          >
            {EXPLORE_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.label;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => handleSelectCategory(cat.label)}
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
                    {cat.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Loading Indicator or Results */}
      {loading ? (
        <View className="py-16 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <AppText variant="caption" className="mt-3 text-zinc-400 font-medium">
            Searching catalog...
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
              {query.trim() ? "Search Results" : `${activeCategory} Feed`}
            </AppText>
          }
          ListEmptyComponent={
            query.trim() ? (
              <View className="py-16 items-center px-6">
                <Icon name="search" size={36} color={theme.textMuted} />
                <AppText variant="songTitle" className="text-base font-bold text-center mt-3 mb-1">
                  No results for "{query}"
                </AppText>
                <AppText variant="caption" className="text-xs text-zinc-400 font-medium text-center">
                  Try checking the spelling or search for an artist, song, or album.
                </AppText>
              </View>
            ) : (
              <View className="py-12 items-center px-4">
                <AppText variant="caption" className="text-xs text-zinc-400 font-medium text-center">
                  Search for a song, artist, or album, or pick a category above to explore.
                </AppText>
              </View>
            )
          }
          renderItem={({ item, index }) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <Pressable
                onPress={() => handleSelectSong(item, index)}
                className="flex-row items-center py-2.5 px-1 rounded-xl mb-1 active:bg-white/5"
              >
                <View className="relative w-12 h-12 rounded-lg overflow-hidden mr-3 bg-zinc-800">
                  <ArtworkImage uri={item.artwork} iconSize={18} className="w-full h-full" />
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

                {/* Subordinate "Play Next" Action */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    playNext(item);
                    showToast(`Playing next: ${item.title}`, "success");
                  }}
                  className="px-2 py-1 rounded-full bg-white/5 active:bg-white/15 border border-white/10 mr-2"
                >
                  <AppText className="text-[10px] text-purple-300 font-bold">Play Next</AppText>
                </Pressable>

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
