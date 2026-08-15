import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Alert, Modal, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { AddToPlaylistModal } from "@/components/common/AddToPlaylistModal";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { usePlaylists } from "@/context/PlaylistContext";
import { PlaylistDetails, JioSaavnSong } from "@/services/jiosaavn";
import { fetchPlaylistCatalog } from "@/services/catalogEngine";
import { View, Pressable } from "@/tw";

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function cleanTitle(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export default function PlaylistDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playQueue, playNext, addToQueue, currentTrack, isPlaying } = usePlayer();
  const {
    playlists: userPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
  } = usePlaylists();

  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const [isUserPlaylist, setIsUserPlaylist] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editing, setEditing] = useState(false);

  const [showAddOtherModal, setShowAddOtherModal] = useState(false);
  const [selectedSongForAdd, setSelectedSongForAdd] = useState<JioSaavnSong | null>(null);

  useEffect(() => {
    if (!id) return;
    const decodedId = decodeURIComponent(id);

    // 1. Check user custom playlists first
    const userPl = getPlaylistById(decodedId);
    if (userPl) {
      setPlaylist({
        id: userPl.id,
        title: userPl.name,
        subtitle: userPl.description || `${userPl.tracks.length} songs`,
        artwork: userPl.artwork || "",
        tracks: userPl.tracks,
      });
      setIsUserPlaylist(true);
      setLoading(false);
      return;
    }

    // 2. Fallback to catalog API playlist
    let isMounted = true;
    setLoading(true);
    fetchPlaylistCatalog(decodedId).then((data) => {
      if (isMounted) {
        if (data) {
          setPlaylist(data);
          setIsUserPlaylist(false);
        } else {
          setPlaylist(null);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id, userPlaylists, getPlaylistById]);

  // Handlers
  const handlePlayAll = async () => {
    if (playlist && playlist.tracks.length > 0) {
      await playQueue(playlist.tracks, 0, "playlist");
      showToast(`Playing playlist: ${cleanTitle(playlist.title)}`, "success");
    }
  };

  const handleShufflePlay = async () => {
    if (playlist && playlist.tracks.length > 0) {
      const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
      await playQueue(shuffled, 0, "playlist");
      showToast(`Shuffling playlist: ${cleanTitle(playlist.title)}`, "info");
    }
  };

  const handleSelectSong = async (song: JioSaavnSong, index: number) => {
    if (playlist) {
      await playQueue(playlist.tracks, index, "playlist");
      showToast(`Playing ${cleanTitle(song.title)}`, "info");
    }
  };

  const handleRemoveTrack = async (song: JioSaavnSong) => {
    if (!playlist || !isUserPlaylist) return;
    try {
      await removeTrackFromPlaylist(playlist.id, song.id);
      showToast(`Removed "${cleanTitle(song.title)}" from playlist`, "info");
    } catch (err: any) {
      showToast("Couldn't remove track", "error");
    }
  };

  const handleMoveTrack = async (index: number, direction: "up" | "down") => {
    if (!playlist || !isUserPlaylist) return;
    const newTracks = [...playlist.tracks];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newTracks.length) return;

    const [moved] = newTracks.splice(index, 1);
    newTracks.splice(targetIdx, 0, moved);

    await reorderPlaylistTracks(playlist.id, newTracks);
    showToast("Updated track order", "info");
  };

  const handleSaveEdit = async () => {
    if (!playlist || !isUserPlaylist) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      showToast("Playlist name cannot be empty", "error");
      return;
    }

    setEditing(true);
    try {
      await updatePlaylist(playlist.id, trimmed, editDesc.trim());
      showToast("Updated playlist details", "success");
      setShowEditModal(false);
    } catch (err: any) {
      showToast("Failed to update playlist", "error");
    } finally {
      setEditing(false);
    }
  };

  const handleDeletePlaylist = () => {
    if (!playlist || !isUserPlaylist) return;

    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${cleanTitle(playlist.title)}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deletePlaylist(playlist.id);
            showToast("Playlist deleted", "info");
            router.back();
          },
        },
      ]
    );
  };

  return (
    <Screen scrollable={false}>
      {/* 1. Header Bar */}
      <View className="flex-row items-center justify-between mt-1 mb-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center bg-white/5 border border-white/10 active:bg-white/15"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="chevron-left" size={22} color="#FFFFFF" />
        </Pressable>

        <AppText variant="caption" className="text-xs uppercase tracking-widest text-zinc-400 font-extrabold">
          YOUR PLAYLIST
        </AppText>

        {isUserPlaylist ? (
          <Pressable
            onPress={handleDeletePlaylist}
            className="w-10 h-10 rounded-full items-center justify-center bg-red-900/20 border border-red-500/30 active:bg-red-900/40"
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Delete playlist"
          >
            <Icon name="trash" size={18} color="#F87171" />
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#A855F7" />
          <AppText variant="caption" className="mt-3 text-zinc-400 font-medium">
            Loading playlist...
          </AppText>
        </View>
      ) : !playlist ? (
        <View className="flex-1 items-center justify-center px-6">
          <Icon name="alert-circle" size={40} color="#F87171" />
          <AppText variant="songTitle" className="text-lg font-bold text-center text-white mt-3 mb-1">
            Playlist Not Found
          </AppText>
          <AppText variant="caption" className="text-xs text-zinc-400 font-medium text-center mb-6">
            The playlist you are looking for does not exist or has been removed.
          </AppText>
          <Pressable
            onPress={() => router.back()}
            className="px-6 py-2.5 rounded-full bg-purple-600 active:bg-purple-700 shadow-md shadow-purple-950/40"
          >
            <AppText className="text-xs font-bold text-white">Go Back</AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={playlist.tracks}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-40"
          ListHeaderComponent={
            <View className="items-center mb-5">
              {/* 2. Scaled Artwork */}
              <View className="w-40 h-40 rounded-3xl overflow-hidden mb-3.5 bg-[#161224] border border-[#2B233D] shadow-xl shadow-purple-950/40 items-center justify-center">
                <ArtworkImage
                  uri={playlist.artwork}
                  iconSize={48}
                  className="w-full h-full"
                />
              </View>

              {/* 3. Playlist Title & Inline Edit Icon */}
              <View className="flex-row items-center justify-center gap-x-2 px-4 mb-1">
                <AppText variant="screenTitle" className="text-xl font-extrabold text-center text-white tracking-tight" numberOfLines={1}>
                  {cleanTitle(playlist.title)}
                </AppText>
                {isUserPlaylist && (
                  <Pressable
                    onPress={() => {
                      setEditName(playlist.title);
                      setEditDesc(playlist.subtitle || "");
                      setShowEditModal(true);
                    }}
                    className="p-1 rounded-full active:bg-white/10"
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Edit playlist details"
                  >
                    <Icon name="edit" size={16} color="#C084FC" />
                  </Pressable>
                )}
              </View>

              {/* 4. Description & Song Count */}
              <AppText variant="artist" className="text-xs text-zinc-400 font-medium text-center mb-4 px-6" numberOfLines={1}>
                {cleanTitle(playlist.subtitle || "Custom User Playlist")} • {playlist.tracks.length} {playlist.tracks.length === 1 ? "song" : "songs"}
              </AppText>

              {/* 5. Play & Shuffle Controls */}
              {playlist.tracks.length > 0 ? (
                <View className="flex-row items-center justify-center gap-x-3 mb-4">
                  <Pressable
                    onPress={handlePlayAll}
                    className="flex-row items-center px-7 py-2.5 rounded-full bg-purple-600 active:bg-purple-700 shadow-md shadow-purple-950/40 active:scale-[0.96]"
                  >
                    <Icon name="play" size={16} color="#FFFFFF" />
                    <AppText className="ml-2 text-xs font-bold text-white uppercase tracking-wider">Play</AppText>
                  </Pressable>

                  <Pressable
                    onPress={handleShufflePlay}
                    className="flex-row items-center px-6 py-2.5 rounded-full bg-[#161224] border border-[#2B233D] active:scale-[0.96]"
                  >
                    <Icon name="shuffle" size={16} color="#FFFFFF" />
                    <AppText className="ml-2 text-xs font-bold text-white uppercase tracking-wider">Shuffle</AppText>
                  </Pressable>
                </View>
              ) : (
                <View className="py-6 items-center px-4 rounded-2xl bg-[#161224] border border-[#2B233D] w-full my-2">
                  <AppText variant="caption" className="text-xs text-zinc-400 text-center mb-3">
                    This playlist is currently empty. Add songs from Search to start building it!
                  </AppText>
                  <Pressable
                    onPress={() => router.push("/(tabs)/search")}
                    className="px-5 py-2 rounded-full bg-purple-600 active:bg-purple-700"
                  >
                    <AppText className="text-xs font-bold text-white">Search Music</AppText>
                  </Pressable>
                </View>
              )}
            </View>
          }
          renderItem={({ item, index }) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <Pressable
                onPress={() => handleSelectSong(item, index)}
                className={`flex-row items-center py-2.5 px-3 rounded-2xl mb-1.5 border active:scale-[0.99] ${
                  isCurrent
                    ? 'bg-[#221A35] border-purple-500/60 shadow-md shadow-purple-950/40'
                    : 'bg-[#161224]/80 border-[#2B233D]/60'
                }`}
              >
                {/* 6. Reordering Controls (Vertically centered) */}
                {isUserPlaylist && playlist.tracks.length > 1 ? (
                  <View className="flex-col items-center justify-center mr-2 w-4">
                    <Pressable
                      onPress={() => handleMoveTrack(index, "up")}
                      disabled={index === 0}
                      className="p-0.5 active:opacity-100"
                      style={{ opacity: index === 0 ? 0.2 : 0.7 }}
                      hitSlop={6}
                    >
                      <Icon name="chevron-up" size={14} color="#9CA3AF" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleMoveTrack(index, "down")}
                      disabled={index === playlist.tracks.length - 1}
                      className="p-0.5 active:opacity-100"
                      style={{ opacity: index === playlist.tracks.length - 1 ? 0.2 : 0.7 }}
                      hitSlop={6}
                    >
                      <Icon name="chevron-down" size={14} color="#9CA3AF" />
                    </Pressable>
                  </View>
                ) : (
                  <AppText
                    variant="caption"
                    className="w-5 text-xs text-zinc-400 font-bold text-center mr-2"
                  >
                    {index + 1}
                  </AppText>
                )}

                {/* 7. Artwork */}
                <View className="relative w-11 h-11 rounded-xl overflow-hidden mr-3 bg-zinc-800 shrink-0">
                  <ArtworkImage uri={item.artwork} iconSize={16} className="w-full h-full" />
                  {isCurrent && (
                    <View className="absolute inset-0 bg-black/60 items-center justify-center">
                      <Icon
                        name={isPlaying ? "pause" : "play"}
                        size={14}
                        color="#C084FC"
                      />
                    </View>
                  )}
                </View>

                {/* 8. Song Info (Flexible middle) */}
                <View className="flex-1 min-w-0 mr-3 justify-center">
                  <AppText
                    variant="songTitle"
                    className={`text-sm font-semibold mb-0.5 ${
                      isCurrent ? "text-purple-300 font-bold" : "text-white"
                    }`}
                    numberOfLines={1}
                  >
                    {cleanTitle(item.title)}
                  </AppText>
                  <AppText
                    variant="artist"
                    className="text-xs text-zinc-400 font-medium"
                    numberOfLines={1}
                  >
                    {cleanTitle(item.artist)}
                  </AppText>
                </View>

                {/* 9. Action Buttons */}
                <View className="flex-row items-center gap-x-2 shrink-0">
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedSongForAdd(item);
                      setShowAddOtherModal(true);
                    }}
                    className="w-7 h-7 rounded-full bg-white/5 active:bg-white/15 border border-white/10 items-center justify-center"
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${item.title} to playlist`}
                  >
                    <Icon name="plus" size={13} color="#D4D4D8" />
                  </Pressable>

                  {isUserPlaylist && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveTrack(item);
                      }}
                      className="w-7 h-7 rounded-full bg-red-900/20 active:bg-red-900/40 border border-red-500/30 items-center justify-center"
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.title} from playlist`}
                    >
                      <Icon name="trash" size={13} color="#F87171" />
                    </Pressable>
                  )}

                  {/* 10. Track Duration */}
                  {item.duration > 0 && (
                    <AppText variant="caption" className="text-[11px] text-zinc-400 font-medium ml-0.5">
                      {formatDuration(item.duration)}
                    </AppText>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Edit Playlist Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <Pressable
          onPress={() => setShowEditModal(false)}
          className="flex-1 bg-black/70 justify-center items-center px-6"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl p-6 border shadow-2xl"
            style={{
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
            }}
          >
            <AppText variant="songTitle" className="text-base font-bold mb-4">
              Edit Playlist Details
            </AppText>

            <AppText variant="caption" className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-1">
              Name
            </AppText>
            <View
              className="px-3.5 h-11 rounded-xl border mb-3 justify-center"
              style={{ backgroundColor: theme.background, borderColor: theme.border }}
            >
              <TextInput
                value={editName}
                onChangeText={setEditName}
                className="text-sm font-medium"
                style={{ color: theme.textPrimary }}
              />
            </View>

            <AppText variant="caption" className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-1">
              Description
            </AppText>
            <View
              className="px-3.5 py-2.5 h-20 rounded-xl border mb-4 justify-start"
              style={{ backgroundColor: theme.background, borderColor: theme.border }}
            >
              <TextInput
                value={editDesc}
                onChangeText={setEditDesc}
                className="text-sm font-medium"
                style={{ color: theme.textPrimary }}
                multiline
              />
            </View>

            <View className="flex-row items-center gap-x-3">
              <Pressable
                onPress={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-full border border-white/10 items-center"
              >
                <AppText className="text-xs font-bold text-zinc-300">Cancel</AppText>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                disabled={editing}
                className="flex-1 py-2.5 rounded-full bg-purple-600 items-center"
              >
                <AppText className="text-xs font-bold text-white">Save</AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={selectedSongForAdd}
        visible={showAddOtherModal}
        onClose={() => {
          setShowAddOtherModal(false);
          setSelectedSongForAdd(null);
        }}
      />
    </Screen>
  );
}
