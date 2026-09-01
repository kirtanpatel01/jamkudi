import React, { useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
import { SettingsModal } from "@/components/common/SettingsModal";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { FilterChip } from "@/components/common/FilterChip";
import { EmptyState } from "@/components/common/feedback/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { usePlaylists } from "@/context/PlaylistContext";
import { useDownloads } from "@/context/DownloadContext";
import { CreatePlaylistModal } from "@/components/common/CreatePlaylistModal";
import { SpotifyImportModal } from "@/components/common/SpotifyImportModal";
import { MADE_FOR_YOU_DATA } from "@/data/mockMusic";
import { Track } from "@/types/track";
import { View, Pressable, TextInput } from "@/tw";

type LibraryFilter = "All" | "Liked" | "Downloads" | "Recent" | "Playlists";

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
  const { downloadedSongs, formattedStorageSize } = useDownloads();

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
          {profile?.display_name ? (
            <AppText variant="caption" className="text-xs text-purple-400 font-semibold mt-0.5">
              Welcome, {profile.display_name}
            </AppText>
          ) : null}
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
      {!isLibraryEmpty ? (
        <View
          className="h-12 px-4 rounded-2xl flex-row items-center mb-3"
          style={{ backgroundColor: theme.surface }}
        >
          <Icon name="search" size={18} color={theme.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search saved songs & playlists"
            placeholderTextColor={theme.isDark ? '#52525B' : '#9CA3AF'}
            returnKeyType="search"
            className="flex-1 h-full ml-3 text-sm font-semibold py-0"
            style={{ color: theme.textPrimary }}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={10} accessibilityLabel="Clear search input">
              <Icon name="x" size={18} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* 3. Library Filter Chips (Edge-to-Edge Scrollable with Active State) */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        >
          {(["All", "Liked", "Downloads", "Recent", "Playlists"] as LibraryFilter[]).map((filterLabel) => (
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
        <View
          className="py-12 items-center px-6 rounded-3xl my-4"
          style={{ backgroundColor: theme.surface }}
        >
          <EmptyState
            title="It's a little quiet here"
            message="Like songs, listen to tracks, or explore playlists to build your personal music shelf."
            showMascot={true}
            actionTitle="Find Music"
            onActionPress={() => router.push("/(tabs)/search")}
          />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
          {/* Featured Banner: Downloads Card (Visible when "All" or "Downloads" filter active) */}
          {(activeFilter === "All" || activeFilter === "Downloads") && (
            <View className="mb-4">
              <Pressable
                onPress={() => router.push("/downloads" as any)}
                className="w-full rounded-3xl p-5 flex-row items-center justify-between overflow-hidden active:scale-[0.98]"
                style={{
                  backgroundColor: theme.surface,
                }}
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4 shrink-0"
                    style={{ backgroundColor: "rgba(155, 124, 255, 0.2)" }}
                  >
                    <Icon name="download" size={24} color="#9B7CFF" />
                  </View>

                  <View className="flex-1 min-w-0">
                    <AppText variant="songTitle" color="textPrimary" className="text-lg font-bold mb-0.5 tracking-tight">
                      Downloads
                    </AppText>
                    <AppText variant="caption" color="textSecondary" className="text-xs font-medium">
                      {downloadedSongs.length > 0
                        ? `${downloadedSongs.length} ${downloadedSongs.length === 1 ? "song" : "songs"} · ${formattedStorageSize}`
                        : "No offline downloads yet."}
                    </AppText>
                  </View>
                </View>

                <View className="w-10 h-10 rounded-full items-center justify-center bg-purple-950/60">
                  <Icon name="chevron-right" size={18} color="#9B7CFF" />
                </View>
              </Pressable>
            </View>
          )}

          {/* Featured Banner: Liked Songs Card (Visible when "All" or "Liked" filter active) */}
          {(activeFilter === "All" || activeFilter === "Liked") && (
            <View className="mb-6">
              <Pressable
                onPress={handlePlayLiked}
                className="w-full rounded-3xl p-5 flex-row items-center justify-between overflow-hidden active:scale-[0.98]"
                style={{
                  backgroundColor: theme.surface,
                }}
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4 shrink-0"
                    style={{ backgroundColor: "rgba(239, 175, 198, 0.2)" }}
                  >
                    <Icon name="heart-filled" size={24} color="#EFAFC6" />
                  </View>

                  <View className="flex-1 min-w-0">
                    <AppText variant="songTitle" color="textPrimary" className="text-lg font-bold mb-0.5 tracking-tight">
                      Liked Songs
                    </AppText>
                    <AppText variant="caption" color="textSecondary" className="text-xs font-medium">
                      {likedTracks.length > 0
                        ? `${likedTracks.length} saved ${likedTracks.length === 1 ? "track" : "tracks"}`
                        : "No liked songs yet."}
                    </AppText>
                  </View>
                </View>

                {likedTracks.length > 0 && (
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center bg-[#9B7CFF]"
                  >
                    <Icon name="play" size={18} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>

              {/* Show Liked Songs List inline when Liked filter is specifically active */}
              {activeFilter === "Liked" && filteredLikedTracks.length > 0 && (
                <View className="mt-4 gap-y-1">
                  <AppText variant="caption" color="textSecondary" className="mb-2 uppercase tracking-wider text-xs font-bold ml-1">
                    Tracks ({filteredLikedTracks.length})
                  </AppText>
                  {filteredLikedTracks.map((item, idx) => {
                    const isCurrent = currentTrack?.id === item.id;
                    return (
                      <Pressable
                        key={`liked-${item.id}-${idx}`}
                        onPress={() => handlePlayLikedSong(item, idx)}
                        className="flex-row items-center py-2.5 px-3 rounded-2xl mb-1.5 active:scale-[0.99]"
                        style={
                          isCurrent
                            ? { backgroundColor: theme.isDark ? '#221A35' : theme.surfacePressed }
                            : { backgroundColor: theme.surface }
                        }
                      >
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
                            className="px-2.5 py-1 rounded-full bg-purple-600/20 active:bg-purple-600/40"
                            hitSlop={4}
                          >
                            <AppText className="text-[10px] text-purple-300 font-bold">+ Queue</AppText>
                          </Pressable>

                          {item.duration > 0 && (
                            <AppText variant="caption" color="textMuted" className="text-[11px] font-medium ml-0.5">
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
              <AppText variant="caption" color="textSecondary" className="mb-2.5 uppercase tracking-wider text-xs font-bold ml-1">
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
                        <View
                          className="relative w-32 h-32 rounded-2xl overflow-hidden mb-2"
                          style={{ backgroundColor: theme.surface }}
                        >
                          <ArtworkImage uri={item.artwork} iconSize={24} className="w-full h-full" />
                          {isCurrent && (
                            <View className="absolute inset-0 bg-black/60 items-center justify-center">
                              <View className="w-9 h-9 rounded-full bg-purple-600 items-center justify-center">
                                <Icon
                                  name={isPlaying ? "pause" : "play"}
                                  size={18}
                                  color="#FFFFFF"
                                />
                              </View>
                            </View>
                          )}
                        </View>
                        <AppText
                          variant="songTitle"
                          color={isCurrent ? undefined : 'textPrimary'}
                          className={`text-xs font-bold mb-0.5 ${isCurrent ? "text-purple-400" : ""}`}
                          numberOfLines={1}
                        >
                          {item.title}
                        </AppText>
                        <AppText variant="artist" color="textSecondary" className="text-[11px] font-medium" numberOfLines={1}>
                          {item.artist}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <View
                  className="py-7 items-center px-4 rounded-2xl"
                  style={{ backgroundColor: theme.surface }}
                >
                  <Icon name="clock" size={24} color={theme.textMuted} />
                  <AppText variant="songTitle" className="text-xs font-bold text-center mt-2 mb-0.5">
                    Nothing played yet
                  </AppText>
                  <AppText variant="caption" color="textSecondary" className="text-[11px] font-medium text-center">
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
                <AppText variant="caption" color="textSecondary" className="uppercase tracking-wider text-xs font-bold ml-1">
                  YOUR PLAYLISTS
                </AppText>
                <View className="flex-row items-center gap-x-2">
                  <Pressable
                    onPress={() => setShowSpotifyImportModal(true)}
                    className="flex-row items-center gap-x-1.5 px-3 py-1.5 rounded-full bg-emerald-600/20 active:bg-emerald-600/40 active:scale-[0.96]"
                    accessibilityRole="button"
                    accessibilityLabel="Import Spotify Playlist"
                  >
                    <Icon name="music" size={13} color="#34D399" />
                    <AppText className="text-[11px] text-emerald-400 font-bold">Import Spotify</AppText>
                  </Pressable>

                  <Pressable
                    onPress={() => setShowCreateModal(true)}
                    className="flex-row items-center gap-x-1.5 px-3 py-1.5 rounded-full bg-purple-600 active:bg-purple-700 active:scale-[0.96]"
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
                      <View
                        className="w-32 h-32 rounded-2xl overflow-hidden mb-2"
                        style={{ backgroundColor: theme.surface }}
                      >
                        <ArtworkImage uri={playlist.imageUrl} iconSize={24} className="w-full h-full" />
                      </View>
                      <AppText variant="songTitle" color="textPrimary" className="text-xs font-bold mb-0.5" numberOfLines={1}>
                        {playlist.title}
                      </AppText>
                      <AppText variant="artist" color="textSecondary" className="text-[11px] font-medium" numberOfLines={1}>
                        {playlist.description || "Playlist"}
                      </AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <View
                  className="py-7 items-center px-4 rounded-2xl"
                  style={{ backgroundColor: theme.surface }}
                >
                  <Icon name="music" size={24} color={theme.textMuted} />
                  <AppText variant="songTitle" className="text-xs font-bold text-center mt-2 mb-0.5">
                    No custom playlists yet
                  </AppText>
                  <AppText variant="caption" color="textSecondary" className="text-[11px] font-medium text-center mb-3">
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
        </ScrollView>
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
