import React, { useState } from "react";
import { Modal, ActivityIndicator, TextInput } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { usePlaylists } from "@/context/PlaylistContext";
import { useToast } from "@/context/ToastContext";
import { View, Pressable } from "@/tw";

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
          className="w-full max-w-sm rounded-3xl p-6 border border-[#2B233D] bg-[#161224] shadow-2xl shadow-purple-950/80"
        >
          {/* Title Header */}
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center gap-x-2">
              <View className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 items-center justify-center">
                <Icon name="music" size={16} color="#C084FC" />
              </View>
              <AppText variant="songTitle" className="text-base font-extrabold text-white">
                Create Playlist
              </AppText>
            </View>

            <Pressable
              onPress={handleClose}
              disabled={submitting}
              className="w-8 h-8 rounded-full items-center justify-center bg-white/5 border border-white/10 active:bg-white/15"
              hitSlop={8}
            >
              <Icon name="x" size={16} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Name Input */}
          <AppText variant="caption" className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-1.5 ml-1">
            Playlist Name *
          </AppText>
          <View
            className={`flex-row items-center px-4 h-12 rounded-2xl border mb-4 bg-[#0B0813] ${
              errorMsg ? "border-red-500" : "border-[#2B233D] focus:border-purple-500"
            }`}
          >
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Give your playlist a name"
              placeholderTextColor="#52525B"
              className="flex-1 text-sm font-semibold text-white h-full py-0"
              autoFocus
              maxLength={60}
            />
          </View>

          {/* Description Input */}
          <AppText variant="caption" className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-1.5 ml-1">
            Description (Optional)
          </AppText>
          <View
            className="flex-row items-start px-4 py-3 h-22 rounded-2xl border border-[#2B233D] bg-[#0B0813] mb-4"
          >
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add an optional description"
              placeholderTextColor="#52525B"
              className="flex-1 text-sm font-semibold text-white"
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
              className="flex-1 py-3 rounded-full border border-white/10 bg-white/5 active:bg-white/10 active:scale-[0.98] items-center"
            >
              <AppText className="text-xs font-bold text-zinc-300">Cancel</AppText>
            </Pressable>

            <Pressable
              onPress={handleCreate}
              disabled={submitting}
              className="flex-1 py-3 rounded-full bg-purple-600 active:bg-purple-700 shadow-md shadow-purple-950/40 active:scale-[0.98] items-center flex-row justify-center gap-x-1.5"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <AppText className="text-xs font-bold text-white uppercase tracking-wider">Create</AppText>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
