import React, { useState } from "react";
import { ScrollView, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
import { SettingsModal } from "@/components/common/SettingsModal";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { FilterChip } from "@/components/common/FilterChip";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { usePlaylists } from "@/context/PlaylistContext";
import { CreatePlaylistModal } from "@/components/common/CreatePlaylistModal";
import { SpotifyImportModal } from "@/components/common/SpotifyImportModal";
import { MADE_FOR_YOU_DATA } from "@/data/mockMusic";
import { Track } from "@/types/track";
import { View, Pressable } from "@/tw";

type LibraryFilter = "All" | "Liked" | "Recent" | "Playlists";

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { profile } = useAuth();
  const {
    playQueue,
    playNext,
    addToQueue,
    likedTracks,
    recentlyPlayed,
    currentTrack,
    isPlaying,
  } = usePlayer();
  const { playlists: userPlaylists } = usePlaylists();

  const [showSettings, setShowSettings] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSpotifyImportModal, setShowSpotifyImportModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Combine user custom playlists with curated mix playlists
  const combinedPlaylists = [
    ...userPlaylists.map((p) => ({
      id: p.id,
      title: p.name,
      description: p.description || `${p.tracks ? p.tracks.length : 0} songs`,
      imageUrl: p.artwork || undefined,
      isUserPlaylist: true,
    })),
    ...MADE_FOR_YOU_DATA.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description || "Curated Playlist",
      imageUrl: p.imageUrl,
      isUserPlaylist: false,
    })),
  ];

  // Handlers
  const handlePlayLiked = async () => {
    if (likedTracks.length > 0) {
      await playQueue(likedTracks, 0);
      showToast("Playing Liked Songs", "success");
    }
  };

  const handlePlayLikedSong = async (track: Track, index: number) => {
    await playQueue(filteredLikedTracks, index);
    showToast(`Playing ${track.title}`, "info");
  };

  const handlePlayRecentTrack = async (index: number) => {
    if (filteredRecentlyPlayed.length > 0) {
      const selected = filteredRecentlyPlayed[index];
      await playQueue(filteredRecentlyPlayed, index);
      showToast(`Playing ${selected?.title || "track"}`, "info");
    }
  };

  // Filtered lists based on searchQuery
  const filteredLikedTracks = likedTracks.filter((t) =>
    searchQuery.trim()
      ? t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const filteredRecentlyPlayed = recentlyPlayed.filter((t) =>
    searchQuery.trim()
      ? t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const filteredPlaylists = combinedPlaylists.filter((p) =>
    searchQuery.trim()
      ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  const isLibraryEmpty = likedTracks.length === 0 && recentlyPlayed.length === 0 && userPlaylists.length === 0;
  const showLikedSection = activeFilter === "All" || activeFilter === "Liked";
  const showRecentSection = activeFilter === "All" || activeFilter === "Recent";
  const showPlaylistsSection = activeFilter === "All" || activeFilter === "Playlists";

  return (
    <Screen scrollable paddingHorizontal={16}>
      {/* 1. Header (Tightened Spacing) */}
      <View className="flex-row items-center justify-between mt-1 mb-3">
        <View>
          <AppText variant="screenTitle" className="text-2xl font-bold">
            Your Library
          </AppText>
          {profile?.display_name && (
            <AppText variant="caption" className="text-xs text-purple-400 font-semibold mt-0.5">
              Welcome, {profile.display_name}
            </AppText>
          )}
        </View>

        <IconButton
          name="settings"
          size={20}
          color={theme.textPrimary}
          onPress={() => setShowSettings(true)}
          accessibilityLabel="Account Settings"
        />
      </View>

      {/* 2. Library Search Bar (Primary interaction placed before filters) */}
      {!isLibraryEmpty && (
        <View
          className="flex-row items-center px-4 h-12 rounded-2xl border border-[#2B233D] bg-[#161224] mb-3.5 shadow-sm"
        >
          <Icon name="search" size={18} color="#C084FC" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search in your library..."
            placeholderTextColor="#52525B"
            className="flex-1 ml-3 text-sm font-semibold text-white h-full py-0"
            accessibilityLabel="Search in library input"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              className="p-1.5 rounded-full active:bg-white/10"
              hitSlop={8}
            >
              <Icon name="x" size={16} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      )}

      {/* 3. Library Filter Chips (Edge-to-Edge Scrollable with Active State) */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        >
          {(["All", "Liked", "Recent", "Playlists"] as LibraryFilter[]).map((filterLabel) => (
            <FilterChip
              key={filterLabel}
              label={filterLabel}
              active={activeFilter === filterLabel}
              onPress={() => setActiveFilter(filterLabel)}
              accessibilityLabel={`Filter by ${filterLabel}`}
            />
          ))}
        </ScrollView>
      </View>

      {/* Complete Empty Library State */}
      {isLibraryEmpty ? (
        <View className="py-16 items-center px-6 rounded-3xl bg-[#161224] border border-[#2B233D] my-4 shadow-lg shadow-purple-950/30">
          <View className="w-16 h-16 rounded-3xl items-center justify-center bg-purple-600/20 border border-purple-500/30 mb-4">
            <Icon name="music" size={32} color="#C084FC" />
          </View>
          <AppText variant="songTitle" className="text-lg font-bold text-center text-white mb-1.5">
            Your Library is empty
          </AppText>
          <AppText variant="caption" className="text-xs text-zinc-400 font-medium text-center mb-6 max-w-[260px]">
            Like songs, listen to tracks, or explore playlists to build your personal music collection.
          </AppText>
          <Pressable
            onPress={() => router.push("/(tabs)/search")}
            className="px-6 py-3 rounded-full bg-purple-600 active:bg-purple-700 shadow-lg shadow-purple-950/40 flex-row items-center gap-x-2 active:scale-[0.98]"
            accessibilityRole="button"
            accessibilityLabel="Start exploring music"
          >
            <Icon name="search" size={16} color="#FFFFFF" />
            <AppText className="text-xs font-bold text-white uppercase tracking-wider">
              Start Exploring
            </AppText>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Liked Songs Featured Banner (Single Clear Entry Point) */}
          {showLikedSection && (
            <View className="mb-6">
              <Pressable
                onPress={handlePlayLiked}
                className="w-full rounded-3xl p-5 flex-row items-center justify-between overflow-hidden bg-purple-900 border border-purple-500/40 shadow-xl shadow-purple-950/50 active:scale-[0.98]"
              >
                <View className="flex-1 pr-4">
                  <View className="w-10 h-10 rounded-full items-center justify-center bg-white/20 mb-3 border border-white/20">
                    <Icon name="heart-filled" size={20} color="#FFFFFF" />
                  </View>

                  <AppText variant="songTitle" className="text-xl font-extrabold text-white mb-0.5 tracking-tight">
                    Liked Songs
                  </AppText>
                  <AppText variant="caption" className="text-xs text-purple-200 font-medium">
                    {likedTracks.length > 0
                      ? `${likedTracks.length} saved ${likedTracks.length === 1 ? "track" : "tracks"}`
                      : "No liked songs yet • Tap ❤️ on any song to save it here."}
                  </AppText>
                </View>

                {likedTracks.length > 0 && (
                  <View className="w-12 h-12 rounded-full items-center justify-center bg-white/20 border border-white/30 shadow-md">
                    <Icon name="play" size={22} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>

              {/* Show Liked Songs List inline when Liked filter is specifically active */}
              {activeFilter === "Liked" && filteredLikedTracks.length > 0 && (
                <View className="mt-4 gap-y-1">
                  <AppText variant="caption" className="mb-2 uppercase tracking-wider text-xs text-zinc-400 font-bold ml-1">
                    Tracks ({filteredLikedTracks.length})
                  </AppText>
                  {filteredLikedTracks.map((item, idx) => {
                    const isCurrent = currentTrack?.id === item.id;
                    return (
                      <Pressable
                        key={`liked-${item.id}-${idx}`}
                        onPress={() => handlePlayLikedSong(item, idx)}
                        className={`flex-row items-center py-2.5 px-3 rounded-2xl mb-1.5 border active:scale-[0.99] ${
                          isCurrent
                            ? 'bg-[#221A35] border-purple-500/60 shadow-md shadow-purple-950/40'
                            : 'bg-[#161224]/80 border-[#2B233D]/60'
                        }`}
                      >
                        <View className="relative w-12 h-12 rounded-xl overflow-hidden mr-3 bg-zinc-800 shrink-0">
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

                        <View className="flex-1 min-w-0 mr-3 justify-center">
                          <AppText
                            variant="songTitle"
                            className={`text-sm font-semibold mb-0.5 ${
                              isCurrent ? "text-purple-300 font-bold" : "text-white"
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
                        </View>

                        <View className="flex-row items-center gap-x-2 shrink-0">
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              addToQueue(item, "library");
                              showToast(`Added to queue: ${item.title}`, "info");
                            }}
                            className="px-2.5 py-1 rounded-full bg-purple-600/20 active:bg-purple-600/40 border border-purple-500/40"
                            hitSlop={4}
                          >
                            <AppText className="text-[10px] text-purple-300 font-bold">+ Queue</AppText>
                          </Pressable>

                          {item.duration > 0 && (
                            <AppText variant="caption" className="text-[11px] text-zinc-400 font-medium ml-0.5">
                              {formatDuration(item.duration)}
                            </AppText>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Recently Played Carousel */}
          {showRecentSection && (
            <View className="mb-6">
              <AppText variant="caption" className="mb-2.5 uppercase tracking-wider text-xs text-zinc-400 font-bold ml-1">
                RECENTLY PLAYED
              </AppText>

              {filteredRecentlyPlayed.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="-mx-4"
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                >
                  {filteredRecentlyPlayed.slice(0, 15).map((item, idx) => {
                    const isCurrent = currentTrack?.id === item.id;
                    return (
                      <Pressable
                        key={`recent-${item.id}-${idx}`}
                        onPress={() => handlePlayRecentTrack(idx)}
                        className="w-32 active:scale-[0.96]"
                      >
                        <View className="relative w-32 h-32 rounded-2xl overflow-hidden mb-2 bg-[#161224] border border-[#2B233D] shadow-md shadow-purple-950/30">
                          <ArtworkImage uri={item.artwork} iconSize={24} className="w-full h-full" />
                          {isCurrent && (
                            <View className="absolute inset-0 bg-black/60 items-center justify-center">
                              <View className="w-9 h-9 rounded-full bg-purple-600 items-center justify-center shadow-md">
                                <Icon
                                  name={isPlaying ? "pause" : "play"}
                                  size={18}
                                  color="#FFFFFF"
                                />
                              </View>
                            </View>
                          )}
                        </View>
                        <AppText variant="songTitle" className={`text-xs font-bold mb-0.5 ${isCurrent ? "text-purple-400" : "text-white"}`} numberOfLines={1}>
                          {item.title}
                        </AppText>
                        <AppText variant="artist" className="text-[11px] text-zinc-400 font-medium" numberOfLines={1}>
                          {item.artist}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <View className="py-7 items-center px-4 rounded-2xl bg-[#161224] border border-[#2B233D]">
                  <Icon name="clock" size={24} color="#9CA3AF" />
                  <AppText variant="songTitle" className="text-xs font-bold text-center text-white mt-2 mb-0.5">
                    Nothing played yet
                  </AppText>
                  <AppText variant="caption" className="text-[11px] text-zinc-400 font-medium text-center">
                    Start listening and your history will appear here.
                  </AppText>
                </View>
              )}
            </View>
          )}

          {/* Your Playlists Carousel */}
          {showPlaylistsSection && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2.5">
                <AppText variant="caption" className="uppercase tracking-wider text-xs text-zinc-400 font-bold ml-1">
                  YOUR PLAYLISTS
                </AppText>
                <View className="flex-row items-center gap-x-2">
                  <Pressable
                    onPress={() => setShowSpotifyImportModal(true)}
                    className="flex-row items-center gap-x-1.5 px-3 py-1.5 rounded-full bg-emerald-600/20 border border-emerald-500/40 active:bg-emerald-600/40 active:scale-[0.96]"
                    accessibilityRole="button"
                    accessibilityLabel="Import Spotify Playlist"
                  >
                    <Icon name="music" size={13} color="#34D399" />
                    <AppText className="text-[11px] text-emerald-400 font-bold">Import Spotify</AppText>
                  </Pressable>

                  <Pressable
                    onPress={() => setShowCreateModal(true)}
                    className="flex-row items-center gap-x-1.5 px-3 py-1.5 rounded-full bg-purple-600 active:bg-purple-700 shadow-md shadow-purple-950/40 active:scale-[0.96]"
                    accessibilityRole="button"
                    accessibilityLabel="Create Playlist"
                  >
                    <Icon name="plus" size={13} color="#FFFFFF" />
                    <AppText className="text-[11px] text-white font-bold">New Playlist</AppText>
                  </Pressable>
                </View>
              </View>

              {filteredPlaylists.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="-mx-4"
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                >
                  {filteredPlaylists.map((playlist) => (
                    <Pressable
                      key={playlist.id}
                      onPress={() => router.push(`/playlist/${encodeURIComponent(playlist.id)}` as any)}
                      className="w-32 active:scale-[0.96]"
                    >
                      <View className="w-32 h-32 rounded-2xl overflow-hidden mb-2 bg-[#161224] border border-[#2B233D] shadow-md shadow-purple-950/30">
                        <ArtworkImage uri={playlist.imageUrl} iconSize={24} className="w-full h-full" />
                      </View>
                      <AppText variant="songTitle" className="text-xs font-bold text-white mb-0.5" numberOfLines={1}>
                        {playlist.title}
                      </AppText>
                      <AppText variant="artist" className="text-[11px] text-zinc-400 font-medium" numberOfLines={1}>
                        {playlist.description || "Playlist"}
                      </AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <View className="py-7 items-center px-4 rounded-2xl bg-[#161224] border border-[#2B233D]">
                  <Icon name="music" size={24} color="#9CA3AF" />
                  <AppText variant="songTitle" className="text-xs font-bold text-center text-white mt-2 mb-0.5">
                    No custom playlists yet
                  </AppText>
                  <AppText variant="caption" className="text-[11px] text-zinc-400 font-medium text-center mb-3">
                    Create custom playlists or import existing Spotify playlists.
                  </AppText>
                  <View className="flex-row items-center gap-x-2">
                    <Pressable
                      onPress={() => setShowSpotifyImportModal(true)}
                      className="px-3.5 py-1.5 rounded-full bg-emerald-600 active:bg-emerald-700"
                    >
                      <AppText className="text-xs font-bold text-white">Import Spotify</AppText>
                    </Pressable>

                    <Pressable
                      onPress={() => setShowCreateModal(true)}
                      className="px-3.5 py-1.5 rounded-full bg-purple-600 active:bg-purple-700"
                    >
                      <AppText className="text-xs font-bold text-white">+ New Playlist</AppText>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}
        </>
      )}

      {/* Bottom padding for tab bar & mini player */}
      <View className="h-28" />

      {/* Settings Modal */}
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Spotify Import Modal */}
      <SpotifyImportModal
        visible={showSpotifyImportModal}
        onClose={() => setShowSpotifyImportModal(false)}
      />
    </Screen>
  );
}
