import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { FilterChip } from "@/components/common/FilterChip";
import { AddToPlaylistModal } from "@/components/common/AddToPlaylistModal";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { JioSaavnSong, searchSongs } from "@/services/jiosaavn";
import {
  fetchSearchCatalog,
  CatalogSearchResult,
  deduplicateTracks,
} from "@/services/catalogEngine";
import {
  loadSearchHistory,
  addSearchQuery,
  removeSearchQuery,
  clearSearchHistory,
} from "@/utils/storage";
import { View, TextInput, Pressable } from "@/tw";

const EXPLORE_CATEGORIES = [
  { id: "popular", label: "Popular", query: "Top Hits" },
  { id: "bollywood", label: "Bollywood", query: "Bollywood Hits" },
  { id: "punjabi", label: "Punjabi", query: "Punjabi Hits" },
  { id: "pop", label: "Pop", query: "Pop Hits" },
  { id: "lofi", label: "Lo-Fi", query: "Lo-Fi Beats" },
  { id: "dance", label: "Dance", query: "Dance Party Hits" },
];

type EntityFilter = "All" | "Songs" | "Artists" | "Albums" | "Playlists";

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
  const { playQueue, playNext, addToQueue, currentTrack, isPlaying } = usePlayer();

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Popular");
  const [activeEntityFilter, setActiveEntityFilter] = useState<EntityFilter>("All");

  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<JioSaavnSong | null>(null);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);

  const [searchResults, setSearchResults] = useState<CatalogSearchResult>({
    query: "",
    normalizedQuery: "",
    intent: { primary: "SONG", confidence: 0 },
    sections: { artists: [], songs: [], albums: [], playlists: [] },
    totalResults: 0,
    metadata: { fromCache: false, fetchedAt: Date.now() },
  });

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);

  // Pagination states for Songs
  const [songPage, setSongPage] = useState(0);
  const [hasMoreSongs, setHasMoreSongs] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginationError, setPaginationError] = useState(false);

  // Stale-response protection sequence counter
  const requestSeqRef = useRef(0);

  // Load recent search history on mount
  useEffect(() => {
    loadSearchHistory().then((history) => {
      setRecentSearches(history.slice(0, 6));
    });
  }, []);

  // Load default category songs on mount or category change
  useEffect(() => {
    if (query.trim()) return;

    let isMounted = true;
    setLoading(true);
    setSearchError(false);

    const catObj =
      EXPLORE_CATEGORIES.find((c) => c.label === activeCategory) || EXPLORE_CATEGORIES[0];

    searchSongs(catObj.query, 0, 20)
      .then((data) => {
        if (isMounted) {
          setSearchResults({
            query: "",
            normalizedQuery: "",
            intent: { primary: "SONG", confidence: 0 },
            sections: {
              artists: [],
              songs: deduplicateTracks(data),
              albums: [],
              playlists: [],
            },
            totalResults: data.length,
            metadata: { fromCache: false, fetchedAt: Date.now() },
          });
          setLoading(false);
          setSongPage(0);
          setHasMoreSongs(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
          setSearchError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  // Debounced search with Stale-Response Protection
  useEffect(() => {
    if (!query.trim()) {
      setActiveEntityFilter("All");
      return;
    }

    const currentSeq = ++requestSeqRef.current;

    const timer = setTimeout(() => {
      setLoading(true);
      setSearchError(false);
      setPaginationError(false);

      fetchSearchCatalog(query)
        .then((groupedData) => {
          if (currentSeq !== requestSeqRef.current) return;

          setSearchResults(groupedData);
          setLoading(false);
          setSongPage(0);
          setHasMoreSongs(groupedData.sections.songs.length >= 20);

          addSearchQuery(query).then((updated) => setRecentSearches(updated.slice(0, 6)));
        })
        .catch(() => {
          if (currentSeq !== requestSeqRef.current) return;
          setLoading(false);
          setSearchError(true);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleRetrySearch = () => {
    if (!query.trim()) return;
    const currentSeq = ++requestSeqRef.current;
    setLoading(true);
    setSearchError(false);

    fetchSearchCatalog(query)
      .then((groupedData) => {
        if (currentSeq !== requestSeqRef.current) return;
        setSearchResults(groupedData);
        setLoading(false);
        setSongPage(0);
        setHasMoreSongs(groupedData.sections.songs.length >= 20);
      })
      .catch(() => {
        if (currentSeq !== requestSeqRef.current) return;
        setLoading(false);
        setSearchError(true);
      });
  };

  const handleLoadMoreSongs = async () => {
    if (loadingMore || !hasMoreSongs || !query.trim() || loading || searchError) return;

    setLoadingMore(true);
    setPaginationError(false);
    const nextPage = songPage + 1;

    try {
      const newSongs = await searchSongs(query.trim(), nextPage, 20);
      if (newSongs.length > 0) {
        setSearchResults((prev) => {
          const existingIds = new Set(prev.sections.songs.map((s) => s.id));
          const filteredNew = newSongs.filter((s) => !existingIds.has(s.id));
          return {
            ...prev,
            sections: {
              ...prev.sections,
              songs: [...prev.sections.songs, ...filteredNew],
            },
          };
        });
        setSongPage(nextPage);
        if (newSongs.length < 20) setHasMoreSongs(false);
      } else {
        setHasMoreSongs(false);
      }
    } catch (err) {
      console.warn("Pagination fetch notice:", err);
      setPaginationError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSelectSong = async (song: JioSaavnSong, index: number) => {
    await playQueue(searchResults.sections.songs, index);
    showToast(`Playing ${song.title}`, "info");
  };

  const handleSelectCategory = (catLabel: string) => {
    setActiveCategory(catLabel);
    setQuery("");
  };

  const handleSelectRecentQuery = (searchTerm: string) => {
    setQuery(searchTerm);
  };

  const handleRemoveRecentQuery = (termToRemove: string) => {
    removeSearchQuery(termToRemove).then((updated) => {
      setRecentSearches(updated.slice(0, 6));
      showToast(`Removed "${termToRemove}" from search history`, "info");
    });
  };

  const handleClearHistory = () => {
    clearSearchHistory().then(() => {
      setRecentSearches([]);
      showToast("Search history cleared", "info");
    });
  };

  const { artists, songs, albums, playlists } = searchResults.sections;

  // Filtered views based on local EntityFilter choice
  const showArtists = (activeEntityFilter === "All" || activeEntityFilter === "Artists") && artists.length > 0;
  const showAlbums = (activeEntityFilter === "All" || activeEntityFilter === "Albums") && albums.length > 0;
  const showPlaylists = (activeEntityFilter === "All" || activeEntityFilter === "Playlists") && playlists.length > 0;
  const showSongs = (activeEntityFilter === "All" || activeEntityFilter === "Songs") && songs.length > 0;

  const displaySongsList = showSongs ? songs : [];

  return (
    <Screen>
      <AppText variant="screenTitle" className="mb-4">
        Search
      </AppText>

      {/* Search Input Box */}
      <View
        className="flex-row items-center px-4 h-13 rounded-2xl border mb-5 shadow-sm"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <Icon name="search" size={20} color="#C084FC" />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search songs, artists, albums, playlists..."
          placeholderTextColor={theme.isDark ? '#52525B' : '#9CA3AF'}
          className="flex-1 ml-3 text-base font-semibold h-full py-0"
          style={{ color: theme.textPrimary }}
          accessibilityLabel="Search music input"
          autoCorrect={false}
        />

        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery("")}
            className="p-1.5 rounded-full active:opacity-70"
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search input"
          >
            <Icon name="x" size={18} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Recent Searches Row with Edge-to-Edge Horizontal Scroll */}
      {!query.trim() && recentSearches.length > 0 ? (
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2.5">
            <AppText variant="caption" color="textSecondary" className="text-xs uppercase tracking-wider font-bold ml-1">
              Recent Searches
            </AppText>
            <Pressable onPress={handleClearHistory} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear all search history">
              <AppText className="text-xs text-purple-400 font-bold">Clear All</AppText>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-4"
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {recentSearches.map((term) => (
              <View
                key={term}
                className="flex-row items-center rounded-full border pl-3.5 pr-1.5 py-1.5 active:scale-[0.96]"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
              >
                <Pressable
                  onPress={() => handleSelectRecentQuery(term)}
                  className="flex-row items-center mr-1"
                  accessibilityRole="button"
                  accessibilityLabel={`Search ${term}`}
                >
                  <Icon name="clock" size={13} color="#C084FC" />
                  <AppText variant="caption" color="textPrimary" className="text-xs font-semibold ml-2">{term}</AppText>
                </Pressable>

                <Pressable
                  onPress={() => handleRemoveRecentQuery(term)}
                  hitSlop={8}
                  className="p-1 rounded-full active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${term} from search history`}
                >
                  <Icon name="x" size={12} color={theme.textMuted} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Explore Category Pills Bar (when query is empty) */}
      {!query.trim() ? (
        <View className="mb-5">
          <AppText variant="caption" color="textSecondary" className="text-xs uppercase tracking-wider font-bold mb-2.5 ml-1">
            Explore
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-4"
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {EXPLORE_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.label;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => handleSelectCategory(cat.label)}
                  className={`px-4 py-2 rounded-full border active:scale-[0.96] ${
                    isActive
                      ? "bg-purple-600 border-purple-500 shadow-md shadow-purple-950/30"
                      : ""
                  }`}
                  style={!isActive ? { backgroundColor: theme.surface, borderColor: theme.border } : undefined}
                >
                  <AppText
                    variant="caption"
                    color={isActive ? "onPrimary" : "textPrimary"}
                    className="text-xs font-bold"
                  >
                    {cat.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Entity Filter Chips (when query is active) */}
      {query.trim().length > 0 && (
        <View className="mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-4"
            contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
          >
            {(["All", "Songs", "Artists", "Albums", "Playlists"] as EntityFilter[]).map((filterLabel) => (
              <FilterChip
                key={filterLabel}
                label={filterLabel}
                active={activeEntityFilter === filterLabel}
                onPress={() => setActiveEntityFilter(filterLabel)}
                accessibilityLabel={`Show ${filterLabel} filter`}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Loading, Error, or Results */}
      {loading ? (
        <View className="py-16 items-center justify-center">
          <ActivityIndicator size="large" color="#A855F7" />
          <AppText variant="caption" color="textSecondary" className="mt-3 font-medium">
            Searching catalog...
          </AppText>
        </View>
      ) : searchError ? (
        <View className="py-16 items-center px-6">
          <Icon name="alert-circle" size={36} color="#F87171" />
          <AppText variant="songTitle" className="text-base font-bold text-center mt-3 mb-1">
            Couldn't load search results
          </AppText>
          <AppText variant="caption" color="textSecondary" className="text-xs font-medium text-center mb-4">
            Please check your network connection and try again.
          </AppText>
          <Pressable
            onPress={handleRetrySearch}
            className="px-5 py-2.5 rounded-full bg-purple-600 active:bg-purple-700 shadow-md shadow-purple-950/40"
            accessibilityRole="button"
            accessibilityLabel="Try search again"
          >
            <AppText className="text-xs font-bold text-white">Try Again</AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={displaySongsList}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-32"
          onEndReached={handleLoadMoreSongs}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <View>
              {/* Artists Section */}
              {query.trim().length > 0 && showArtists && (
                <View className="mb-6">
                  <AppText variant="caption" color="textSecondary" className="mb-2.5 uppercase tracking-wider text-xs font-bold ml-1">
                    Artists
                  </AppText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="-mx-4"
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                  >
                    {artists.map((artist) => (
                      <Pressable
                        key={artist.id}
                        onPress={() => router.push(`/artist/${encodeURIComponent(artist.query)}` as any)}
                        className="w-44 flex-row items-center p-2.5 rounded-2xl border active:scale-[0.96] pr-3"
                        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                      >
                        <View
                          className="w-11 h-11 rounded-full overflow-hidden mr-2.5 border border-purple-500/40 shrink-0"
                          style={{ backgroundColor: theme.surfacePressed }}
                        >
                          <ArtworkImage uri={artist.imageUrl} iconSize={18} className="w-full h-full" />
                        </View>
                        <View className="flex-1 min-w-0 justify-center">
                          <AppText variant="songTitle" color="textPrimary" className="text-xs font-bold" numberOfLines={1}>
                            {artist.name}
                          </AppText>
                          <AppText variant="caption" color="textSecondary" className="text-[10px] font-medium" numberOfLines={1}>
                            Artist Profile
                          </AppText>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Albums Section */}
              {query.trim().length > 0 && showAlbums && (
                <View className="mb-6">
                  <AppText variant="caption" color="textSecondary" className="mb-2.5 uppercase tracking-wider text-xs font-bold ml-1">
                    Albums
                  </AppText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="-mx-4"
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                  >
                    {albums.map((album) => (
                      <Pressable
                        key={album.id}
                        onPress={() => router.push(`/album/${encodeURIComponent(album.title)}` as any)}
                        className="w-32 active:scale-[0.96]"
                      >
                        <View
                          className="w-32 h-32 rounded-2xl overflow-hidden mb-2 border shadow-md shadow-purple-950/30"
                          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                        >
                          <ArtworkImage uri={album.artwork} iconSize={24} className="w-full h-full" />
                        </View>
                        <AppText variant="songTitle" color="textPrimary" className="text-xs font-bold mb-0.5" numberOfLines={1}>
                          {album.title}
                        </AppText>
                        <AppText variant="artist" color="textSecondary" className="text-[11px] font-medium" numberOfLines={1}>
                          {album.artist}
                        </AppText>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Playlists Section */}
              {query.trim().length > 0 && showPlaylists && (
                <View className="mb-6">
                  <AppText variant="caption" color="textSecondary" className="mb-2.5 uppercase tracking-wider text-xs font-bold ml-1">
                    Playlists
                  </AppText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="-mx-4"
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                  >
                    {playlists.map((playlist) => (
                      <Pressable
                        key={playlist.id}
                        onPress={() => router.push(`/playlist/${encodeURIComponent(playlist.id)}` as any)}
                        className="w-32 active:scale-[0.96]"
                      >
                        <View
                          className="w-32 h-32 rounded-2xl overflow-hidden mb-2 border shadow-md shadow-purple-950/30"
                          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                        >
                          <ArtworkImage uri={playlist.artwork} iconSize={24} className="w-full h-full" />
                        </View>
                        <AppText variant="songTitle" color="textPrimary" className="text-xs font-bold mb-0.5" numberOfLines={1}>
                          {playlist.title}
                        </AppText>
                        <AppText variant="artist" color="textSecondary" className="text-[11px] font-medium" numberOfLines={1}>
                          {playlist.subtitle}
                        </AppText>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {showSongs && (
                <AppText variant="caption" color="textSecondary" className="mb-2.5 uppercase tracking-wider text-xs font-bold ml-1">
                  {query.trim() ? "Songs" : `${activeCategory} Feed`}
                </AppText>
              )}
            </View>
          }
          ListFooterComponent={
            query.trim() && showSongs ? (
              <View className="py-4 items-center justify-center">
                {loadingMore ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#A855F7" />
                    <AppText variant="caption" color="textSecondary" className="ml-2 text-xs font-medium">
                      Loading more songs...
                    </AppText>
                  </View>
                ) : paginationError ? (
                  <Pressable
                    onPress={handleLoadMoreSongs}
                    className="px-4 py-2 rounded-full border active:opacity-80"
                    style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                  >
                    <AppText className="text-xs text-purple-400 font-bold">
                      Couldn't load more. Tap to retry
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            ) : null
          }
          ListEmptyComponent={
            query.trim() ? (
              <View className="py-16 items-center px-6">
                <Icon name="search" size={36} color={theme.textMuted} />
                <AppText variant="songTitle" className="text-base font-bold text-center mt-3 mb-1">
                  No results for "{query}"
                </AppText>
                <AppText variant="caption" color="textSecondary" className="text-xs font-medium text-center">
                  Try checking the spelling or search for an artist, song, or album.
                </AppText>
              </View>
            ) : (
              <View className="py-12 items-center px-4">
                <AppText variant="caption" color="textSecondary" className="text-xs font-medium text-center">
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
                className="flex-row items-center py-2.5 px-3 rounded-2xl mb-1.5 border active:scale-[0.99]"
                style={
                  isCurrent
                    ? { backgroundColor: theme.isDark ? '#221A35' : theme.surfacePressed, borderColor: 'rgba(168, 85, 247, 0.6)' }
                    : { backgroundColor: theme.surface, borderColor: theme.border }
                }
              >
                {/* Artwork */}
                <View
                  className="relative w-12 h-12 rounded-xl overflow-hidden mr-3 shrink-0"
                  style={{ backgroundColor: theme.surfacePressed }}
                >
                  <ArtworkImage uri={item.artwork} iconSize={18} className="w-full h-full" />
                  {isCurrent && (
                    <View className="absolute inset-0 bg-black/60 items-center justify-center">
                      <Icon
                        name={isPlaying ? "pause" : "play"}
                        size={16}
                        color="#C084FC"
                      />
                    </View>
                  )}
                </View>

                {/* Song Title & Artist info with clean flex truncation */}
                <View className="flex-1 min-w-0 mr-3 justify-center">
                  <AppText
                    variant="songTitle"
                    color={isCurrent ? undefined : 'textPrimary'}
                    className={`text-sm font-semibold mb-0.5 ${
                      isCurrent ? "text-purple-300 font-bold" : ""
                    }`}
                    numberOfLines={1}
                  >
                    {item.title}
                  </AppText>
                  <AppText
                    variant="artist"
                    color="textSecondary"
                    className="text-xs font-medium"
                    numberOfLines={1}
                  >
                    {item.artist} • {item.album}
                  </AppText>
                </View>

                {/* Streamlined Action Section */}
                <View className="flex-row items-center gap-x-2 shrink-0">
                  {/* Quick Queue Action */}
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      addToQueue(item, "search");
                      showToast(`Added to queue: ${item.title}`, "info");
                    }}
                    className="px-2.5 py-1 rounded-full bg-purple-600/20 active:bg-purple-600/40 border border-purple-500/40"
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${item.title} to queue`}
                  >
                    <AppText className="text-[10px] text-purple-300 font-bold">+ Queue</AppText>
                  </Pressable>

                  {/* Add to Playlist Modal Action */}
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedSongForPlaylist(item);
                      setShowAddToPlaylistModal(true);
                    }}
                    className="w-7 h-7 rounded-full border items-center justify-center active:opacity-75"
                    style={{ backgroundColor: theme.surfacePressed, borderColor: theme.border }}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${item.title} to playlist`}
                  >
                    <Icon name="plus" size={13} color={theme.textPrimary} />
                  </Pressable>

                  {/* Track Duration */}
                  {item.duration > 0 && (
                    <AppText
                      variant="caption"
                      color="textMuted"
                      className="text-[11px] font-medium ml-0.5"
                    >
                      {formatDuration(item.duration)}
                    </AppText>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={selectedSongForPlaylist}
        visible={showAddToPlaylistModal}
        onClose={() => {
          setShowAddToPlaylistModal(false);
          setSelectedSongForPlaylist(null);
        }}
      />
    </Screen>
  );
}
