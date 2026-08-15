import React, { useState } from "react";
import { Modal, ScrollView, ActivityIndicator } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { CreatePlaylistModal } from "@/components/common/CreatePlaylistModal";
import { useTheme } from "@/hooks/useTheme";
import { usePlaylists } from "@/context/PlaylistContext";
import { useToast } from "@/context/ToastContext";
import { Track } from "@/types/track";
import { JioSaavnSong } from "@/services/jiosaavn";
import { View, Pressable } from "@/tw";

interface AddToPlaylistModalProps {
  track: Track | JioSaavnSong | null;
  visible: boolean;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  visible,
  onClose,
}) => {
  const theme = useTheme();
  const { showToast } = useToast();
  const { playlists, addTrackToPlaylist } = usePlaylists();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [addingPlaylistId, setAddingPlaylistId] = useState<string | null>(null);

  if (!track) return null;

  const handleSelectPlaylist = async (playlistId: string, playlistName: string) => {
    setAddingPlaylistId(playlistId);
    try {
      const { success, isDuplicate } = await addTrackToPlaylist(playlistId, track);
      if (isDuplicate) {
        showToast(`Already in "${playlistName}"`, "info");
      } else if (success) {
        showToast(`Added to "${playlistName}"`, "success");
        onClose();
      } else {
        showToast(`Couldn't add to "${playlistName}"`, "error");
      }
    } catch (err: any) {
      showToast(`Error: ${err.message || "Failed to add track"}`, "error");
    } finally {
      setAddingPlaylistId(null);
    }
  };

  const handlePlaylistCreated = async (newPlaylistId: string) => {
    // Automatically add track to the newly created playlist
    const newPlaylist = playlists.find((p) => p.id === newPlaylistId);
    const plName = newPlaylist?.name || "playlist";
    await handleSelectPlaylist(newPlaylistId, plName);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable
          onPress={onClose}
          className="flex-1 bg-black/75 justify-end"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl p-6 border-t shadow-2xl max-h-[80%]"
            style={{
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <AppText variant="songTitle" className="text-base font-bold">
                Add to Playlist
              </AppText>
              <Pressable
                onPress={onClose}
                className="p-1.5 rounded-full active:bg-white/10"
                hitSlop={8}
              >
                <AppText className="text-xs text-zinc-400 font-bold px-1">✕</AppText>
              </Pressable>
            </View>

            {/* Target Song Info Preview */}
            <View className="flex-row items-center p-3 rounded-2xl bg-white/5 border border-white/5 mb-5">
              <View className="w-12 h-12 rounded-lg overflow-hidden mr-3 bg-zinc-800 shrink-0">
                <ArtworkImage uri={track.artwork} iconSize={18} className="w-full h-full" />
              </View>
              <View className="flex-1 min-w-0">
                <AppText variant="songTitle" className="text-sm font-semibold mb-0.5" numberOfLines={1}>
                  {track.title}
                </AppText>
                <AppText variant="artist" className="text-xs text-zinc-400 font-medium" numberOfLines={1}>
                  {track.artist}
                </AppText>
              </View>
            </View>

            {/* Create New Playlist Button */}
            <Pressable
              onPress={() => setShowCreateModal(true)}
              className="flex-row items-center p-3.5 rounded-2xl bg-purple-600/20 border border-purple-500/30 mb-4 active:bg-purple-600/30"
            >
              <View className="w-10 h-10 rounded-xl bg-purple-600 items-center justify-center mr-3 shadow-sm">
                <Icon name="plus" size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <AppText className="text-sm font-bold text-purple-300">
                  Create New Playlist
                </AppText>
                <AppText className="text-[11px] text-purple-200/70 font-medium">
                  Create a new custom mix
                </AppText>
              </View>
            </Pressable>

            {/* Playlists List */}
            <AppText variant="caption" className="mb-2 uppercase tracking-wider text-[11px] text-zinc-400 font-bold">
              Your Playlists
            </AppText>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-72">
              {playlists.length > 0 ? (
                playlists.map((pl) => {
                  const isAdding = addingPlaylistId === pl.id;
                  const trackCount = pl.tracks ? pl.tracks.length : 0;
                  const isAlreadyAdded = pl.tracks?.some((t) => t.id === track.id);

                  return (
                    <Pressable
                      key={pl.id}
                      onPress={() => handleSelectPlaylist(pl.id, pl.name)}
                      disabled={isAdding}
                      className="flex-row items-center py-2.5 px-3 rounded-xl mb-1.5 active:bg-white/5 border border-transparent hover:border-white/5"
                    >
                      <View className="w-11 h-11 rounded-xl overflow-hidden mr-3 bg-zinc-800 border border-white/10 items-center justify-center shrink-0">
                        <ArtworkImage uri={pl.artwork} iconSize={18} className="w-full h-full" />
                      </View>

                      <View className="flex-1 min-w-0">
                        <AppText variant="songTitle" className="text-sm font-semibold mb-0.5" numberOfLines={1}>
                          {pl.name}
                        </AppText>
                        <AppText variant="artist" className="text-xs text-zinc-400 font-medium" numberOfLines={1}>
                          {trackCount} {trackCount === 1 ? "song" : "songs"}
                        </AppText>
                      </View>

                      {isAdding ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : isAlreadyAdded ? (
                        <View className="px-2 py-1 rounded-full bg-purple-900/40 border border-purple-500/30">
                          <AppText className="text-[10px] text-purple-300 font-bold">Added</AppText>
                        </View>
                      ) : (
                        <Icon name="plus" size={18} color={theme.textMuted} />
                      )}
                    </Pressable>
                  );
                })
              ) : (
                <View className="py-6 items-center">
                  <AppText variant="caption" className="text-xs text-zinc-400 font-medium">
                    No custom playlists yet. Tap "Create New Playlist" above!
                  </AppText>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Embedded Create Playlist Modal */}
      <CreatePlaylistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handlePlaylistCreated}
      />
    </>
  );
};
