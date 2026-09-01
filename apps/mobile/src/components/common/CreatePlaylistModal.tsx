import React, { useState } from "react";
import { Modal, ActivityIndicator } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { usePlaylists } from "@/context/PlaylistContext";
import { useToast } from "@/context/ToastContext";
import { View, Pressable, TextInput } from "@/tw";

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (playlistId: string) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const { showToast } = useToast();
  const { createPlaylist } = usePlaylists();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg("Playlist name is required");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const created = await createPlaylist(trimmed, description.trim() || undefined);
      showToast(`Created playlist "${created.name}"`, "success");
      setName("");
      setDescription("");
      onClose();
      if (onSuccess) onSuccess(created.id);
    } catch (err: any) {
      setErrorMsg(err.message || "Couldn't create playlist. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setName("");
    setDescription("");
    setErrorMsg("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        onPress={handleClose}
        className="flex-1 bg-black/80 justify-center items-center px-6"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
          style={{ backgroundColor: theme.surfaceElevated }}
        >
          {/* Title Header */}
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center gap-x-2.5">
              <View className="w-10 h-10 rounded-2xl bg-purple-500/15 items-center justify-center">
                <Icon name="music" size={18} color="#C084FC" />
              </View>
              <AppText variant="songTitle" color="textPrimary" className="text-lg font-black">
                Create Playlist
              </AppText>
            </View>

            <Pressable
              onPress={handleClose}
              disabled={submitting}
              className="w-9 h-9 rounded-full items-center justify-center active:opacity-75 active:scale-[0.95]"
              style={{ backgroundColor: theme.surfacePressed }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <Icon name="x" size={16} color={theme.textPrimary} />
            </Pressable>
          </View>

          {/* Name Input */}
          <AppText variant="caption" color="textSecondary" className="text-xs uppercase tracking-wider font-extrabold mb-1.5 ml-1">
            Playlist Name *
          </AppText>
          <View
            className="flex-row items-center px-4 h-12 rounded-2xl mb-4 shadow-inner"
            style={{ backgroundColor: theme.background }}
          >
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Give your playlist a name"
              placeholderTextColor={theme.isDark ? '#52525B' : '#9CA3AF'}
              className="flex-1 text-sm font-bold h-full py-0"
              style={{ color: theme.textPrimary }}
              autoFocus
              maxLength={60}
            />
          </View>

          {/* Description Input */}
          <AppText variant="caption" color="textSecondary" className="text-xs uppercase tracking-wider font-extrabold mb-1.5 ml-1">
            Description (Optional)
          </AppText>
          <View
            className="flex-row items-start px-4 py-3 h-22 rounded-2xl mb-4 shadow-inner"
            style={{ backgroundColor: theme.background }}
          >
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add an optional description"
              placeholderTextColor={theme.isDark ? '#52525B' : '#9CA3AF'}
              className="flex-1 text-sm font-semibold"
              style={{ color: theme.textPrimary }}
              multiline
              maxLength={200}
            />
          </View>

          {errorMsg ? (
            <AppText className="text-xs text-red-400 font-semibold mb-4 text-center">
              {errorMsg}
            </AppText>
          ) : null}

          {/* Action Buttons */}
          <View className="flex-row items-center gap-x-3 mt-1">
            <Pressable
              onPress={handleClose}
              disabled={submitting}
              className="flex-1 py-3 rounded-full active:opacity-75 active:scale-[0.95] items-center"
              style={{ backgroundColor: theme.surfacePressed }}
            >
              <AppText variant="caption" color="textSecondary" className="text-xs font-bold uppercase tracking-wider">Cancel</AppText>
            </Pressable>

            <Pressable
              onPress={handleCreate}
              disabled={submitting}
              className="flex-1 py-3 rounded-full bg-purple-600 active:bg-purple-700 active:scale-[0.95] items-center flex-row justify-center gap-x-1.5 shadow-md"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <AppText className="text-xs font-black text-white uppercase tracking-wider">Create</AppText>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
