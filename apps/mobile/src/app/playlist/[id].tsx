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
      showToast(`Playing playlist: ${playlist.title}`, "success");
    }
  };

  const handleShufflePlay = async () => {
    if (playlist && playlist.tracks.length > 0) {
      const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
      await playQueue(shuffled, 0, "playlist");
      showToast(`Shuffling playlist: ${playlist.title}`, "info");
    }
  };

  const handleSelectSong = async (song: JioSaavnSong, index: number) => {
    if (playlist) {
      await playQueue(playlist.tracks, index, "playlist");
      showToast(`Playing ${song.title}`, "info");
    }
  };

  const handleRemoveTrack = async (song: JioSaavnSong) => {
    if (!playlist || !isUserPlaylist) return;
    try {
      await removeTrackFromPlaylist(playlist.id, song.id);
      showToast(`Removed "${song.title}" from playlist`, "info");
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
      showToast("Couldn't update playlist", "error");
    } finally {
      setEditing(false);
    }
  };

  const handleDeletePlaylist = () => {
    if (!playlist || !isUserPlaylist) return;

    Alert.alert(
      "Delete Playlist?",
      `Are you sure you want to delete "${playlist.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePlaylist(playlist.id);
              showToast(`Deleted playlist "${playlist.title}"`, "info");
              router.back();
            } catch {
              showToast("Couldn't delete playlist", "error");
            }
          },
        },
      ]
    );
  };

  return (
    <Screen paddingHorizontal={16}>
      {/* 1. Header Bar (Safe-Area aligned) */}
      <View className="flex-row items-center justify-between mt-1 mb-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-9 h-9 items-center justify-center rounded-full active:bg-white/10"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="skip-back" size={22} color={theme.textPrimary} />
        </Pressable>

        <AppText variant="caption" className="uppercase tracking-widest text-[10px] text-zinc-400 font-bold">
          {isUserPlaylist ? "YOUR PLAYLIST" : "PLAYLIST DISCOVERY"}
        </AppText>

        {isUserPlaylist && playlist ? (
          <Pressable
            onPress={handleDeletePlaylist}
            hitSlop={12}
            className="w-9 h-9 items-center justify-center rounded-full active:bg-red-500/20"
            accessibilityRole="button"
            accessibilityLabel="Delete playlist"
          >
            <Icon name="trash" size={18} color="#EF4444" />
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>

      {loading ? (
        <View className="py-24 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <AppText variant="caption" className="mt-3 text-zinc-400 font-medium">
            Loading playlist details...
          </AppText>
        </View>
      ) : !playlist ? (
        <View className="py-24 items-center px-6">
          <Icon name="alert-circle" size={36} color={theme.textMuted} />
          <AppText variant="songTitle" className="text-base font-bold text-center mt-3 mb-1">
            Playlist not found
          </AppText>
          <AppText variant="caption" className="text-xs text-zinc-400 text-center mb-4">
            This playlist may have been deleted or is unavailable.
          </AppText>
          <Pressable
            onPress={() => router.back()}
            className="px-5 py-2 rounded-full bg-purple-600 active:bg-purple-700"
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
              <View className="w-32 h-32 rounded-2xl overflow-hidden mb-3 bg-zinc-800 border border-purple-500/20 shadow-xl items-center justify-center">
                <ArtworkImage
                  uri={playlist.artwork}
                  iconSize={40}
                  className="w-full h-full"
                />
              </View>

              {/* 3. Playlist Title & Inline Edit Icon */}
              <View className="flex-row items-center justify-center gap-x-1.5 px-4 mb-0.5">
                <AppText variant="screenTitle" className="text-lg font-bold text-center" numberOfLines={1}>
                  {playlist.title}
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
                    <Icon name="edit" size={15} color={theme.textMuted} />
                  </Pressable>
                )}
              </View>

              {/* 4. Description & Song Count */}
              <AppText variant="artist" className="text-xs text-zinc-400 font-medium text-center mb-4 px-6" numberOfLines={1}>
                {playlist.subtitle || "Custom User Playlist"} • {playlist.tracks.length} {playlist.tracks.length === 1 ? "song" : "songs"}
              </AppText>

              {/* 5. Play & Shuffle Controls */}
              {playlist.tracks.length > 0 ? (
                <View className="flex-row items-center justify-center gap-x-3 mb-4">
                  <Pressable
                    onPress={handlePlayAll}
                    className="flex-row items-center px-6 py-2.5 rounded-full bg-purple-600 active:bg-purple-700 shadow-md"
                  >
                    <Icon name="play" size={16} color="#FFFFFF" />
                    <AppText className="ml-2 text-xs font-bold text-white">Play</AppText>
                  </Pressable>

                  <Pressable
                    onPress={handleShufflePlay}
                    className="flex-row items-center px-5 py-2.5 rounded-full bg-white/10 border border-white/15 active:bg-white/20"
                  >
                    <Icon name="shuffle" size={16} color="#FFFFFF" />
                    <AppText className="ml-2 text-xs font-bold text-white">Shuffle</AppText>
                  </Pressable>
                </View>
              ) : (
                <View className="py-6 items-center px-4 rounded-2xl bg-white/5 border border-white/5 w-full my-2">
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
                className="flex-row items-center py-2 px-1 rounded-xl mb-1 active:bg-white/5"
              >
                {/* 6. Reordering Controls (Vertically centered) */}
                {isUserPlaylist && playlist.tracks.length > 1 ? (
                  <View className="flex-col items-center justify-center mr-1.5 w-4">
                    <Pressable
                      onPress={() => handleMoveTrack(index, "up")}
                      disabled={index === 0}
                      className="p-0.5 active:opacity-100"
                      style={{ opacity: index === 0 ? 0.2 : 0.7 }}
                      hitSlop={6}
                    >
                      <Icon name="chevron-up" size={14} color={theme.textMuted} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleMoveTrack(index, "down")}
                      disabled={index === playlist.tracks.length - 1}
                      className="p-0.5 active:opacity-100"
                      style={{ opacity: index === playlist.tracks.length - 1 ? 0.2 : 0.7 }}
                      hitSlop={6}
                    >
                      <Icon name="chevron-down" size={14} color={theme.textMuted} />
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
                <View className="relative w-10 h-10 rounded-lg overflow-hidden mr-2.5 bg-zinc-800 shrink-0">
                  <ArtworkImage uri={item.artwork} iconSize={16} className="w-full h-full" />
                  {isCurrent && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <Icon
                        name={isPlaying ? "pause" : "play"}
                        size={14}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </View>

                {/* 8. Song Info (Flexible middle) */}
                <View className="flex-1 min-w-0 mr-2 justify-center">
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
                </View>

                {/* 9. Circular Action Buttons */}
                <View className="flex-row items-center gap-x-1.5 mr-1.5 shrink-0">
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      playNext(item, "playlist");
                      showToast(`Added to Up Next: ${item.title}`, "success");
                    }}
                    className="w-7 h-7 rounded-full bg-purple-600/30 active:bg-purple-600/50 border border-purple-500/40 items-center justify-center"
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel={`Play next ${item.title}`}
                  >
                    <Icon name="play" size={12} color="#C084FC" />
                  </Pressable>

                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedSongForAdd(item);
                      setShowAddOtherModal(true);
                    }}
                    className="w-7 h-7 rounded-full bg-white/5 active:bg-white/15 border border-white/10 items-center justify-center"
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${item.title} to playlist`}
                  >
                    <Icon name="plus" size={12} color="#D4D4D8" />
                  </Pressable>

                  {isUserPlaylist && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveTrack(item);
                      }}
                      className="w-7 h-7 rounded-full bg-red-900/20 active:bg-red-900/40 border border-red-500/20 items-center justify-center"
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.title} from playlist`}
                    >
                      <Icon name="trash" size={12} color="#F87171" />
                    </Pressable>
                  )}
                </View>

                {/* 10. Fixed-width Duration Column */}
                {item.duration > 0 && (
                  <View className="w-8 items-end shrink-0">
                    <AppText variant="caption" className="text-[11px] text-zinc-400 font-medium">
                      {formatDuration(item.duration)}
                    </AppText>
                  </View>
                )}
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
