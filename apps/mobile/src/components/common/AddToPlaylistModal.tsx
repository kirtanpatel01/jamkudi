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

function cleanTitle(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
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
        showToast(`Already in "${cleanTitle(playlistName)}"`, "info");
      } else if (success) {
        showToast(`Added to "${cleanTitle(playlistName)}"`, "success");
        onClose();
      } else {
        showToast(`Couldn't add to "${cleanTitle(playlistName)}"`, "error");
      }
    } catch (err: any) {
      showToast(`Error: ${err.message || "Failed to add track"}`, "error");
    } finally {
      setAddingPlaylistId(null);
    }
  };

  const handlePlaylistCreated = async (newPlaylistId: string) => {
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
          className="flex-1 bg-black/80 justify-end"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full rounded-t-[32px] p-6 max-h-[80%] shadow-2xl"
            style={{ backgroundColor: theme.surfaceElevated }}
          >
            {/* Grab Handle Bar */}
            <View className="w-12 h-1.5 rounded-full bg-white/20 self-center mb-4 -mt-1" />

            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <AppText variant="songTitle" color="textPrimary" className="text-lg font-black">
                Add to Playlist
              </AppText>
              <Pressable
                onPress={onClose}
                className="w-9 h-9 rounded-full items-center justify-center active:opacity-75 active:scale-[0.95]"
                style={{ backgroundColor: theme.surfacePressed }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Icon name="x" size={16} color={theme.textPrimary} />
              </Pressable>
            </View>

            {/* Target Song Info Preview */}
            <View
              className="flex-row items-center p-3.5 rounded-2xl mb-4 shadow-sm"
              style={{ backgroundColor: theme.isDark ? '#221A35' : theme.surface }}
            >
              <View className="w-12 h-12 rounded-xl overflow-hidden mr-3.5 shrink-0" style={{ backgroundColor: theme.surfacePressed }}>
                <ArtworkImage uri={track.artwork} iconSize={18} className="w-full h-full" />
              </View>
              <View className="flex-1 min-w-0 justify-center">
                <AppText variant="songTitle" color={theme.isDark ? undefined : 'textPrimary'} className={`text-sm font-black mb-0.5 ${theme.isDark ? "text-purple-300" : ""}`} numberOfLines={1}>
                  {cleanTitle(track.title)}
                </AppText>
                <AppText variant="artist" color="textSecondary" className="text-xs font-semibold" numberOfLines={1}>
                  {cleanTitle(track.artist)}
                </AppText>
              </View>
            </View>

            {/* Create New Playlist Button */}
            <Pressable
              onPress={() => setShowCreateModal(true)}
              className="flex-row items-center p-3.5 rounded-2xl bg-purple-600/20 mb-5 active:scale-[0.985] active:bg-purple-600/30 shadow-sm"
            >
              <View className="w-10 h-10 rounded-xl bg-purple-600 items-center justify-center mr-3 shrink-0 shadow-md">
                <Icon name="plus" size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <AppText className="text-sm font-black text-purple-300">
                  Create New Playlist
                </AppText>
                <AppText variant="caption" color="textSecondary" className="text-[11px] font-semibold">
                  Create a new custom mix
                </AppText>
              </View>
            </Pressable>

            {/* Playlists List */}
            <AppText variant="caption" color="textSecondary" className="mb-2.5 uppercase tracking-widest text-xs font-black ml-1 text-purple-300/80">
              YOUR PLAYLISTS
            </AppText>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} className="max-h-72">
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
                      className="flex-row items-center p-3 rounded-2xl mb-2.5 active:scale-[0.985]"
                      style={{ backgroundColor: theme.surface }}
                    >
                      <View className="w-11 h-11 rounded-xl overflow-hidden mr-3 items-center justify-center shrink-0" style={{ backgroundColor: theme.surfacePressed }}>
                        <ArtworkImage uri={pl.artwork} iconSize={18} className="w-full h-full" />
                      </View>

                      <View className="flex-1 min-w-0 justify-center">
                        <AppText variant="songTitle" color="textPrimary" className="text-sm font-bold mb-0.5" numberOfLines={1}>
                          {cleanTitle(pl.name)}
                        </AppText>
                        <AppText variant="artist" color="textSecondary" className="text-xs font-semibold" numberOfLines={1}>
                          {trackCount} {trackCount === 1 ? "song" : "songs"}
                        </AppText>
                      </View>

                      {isAdding ? (
                        <ActivityIndicator size="small" color="#C084FC" />
                      ) : isAlreadyAdded ? (
                        <View className="px-3 py-1 rounded-full bg-purple-600/30">
                          <AppText className="text-[11px] text-purple-300 font-extrabold">Added</AppText>
                        </View>
                      ) : (
                        <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: theme.surfacePressed }}>
                          <Icon name="plus" size={14} color={theme.textPrimary} />
                        </View>
                      )}
                    </Pressable>
                  );
                })
              ) : (
                <View className="py-6 items-center">
                  <AppText variant="caption" color="textSecondary" className="text-xs font-semibold">
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
