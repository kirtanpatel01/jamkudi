import React, { useState } from "react";
import { Modal, FlatList, Alert } from "react-native";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "@/hooks/useTheme";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { QueueItem } from "@/types/track";
import { View, Pressable } from "@/tw";

interface QueueModalProps {
  visible: boolean;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export const QueueModal: React.FC<QueueModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const { showToast } = useToast();
  const {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    removeFromQueue,
    moveInQueue,
    clearQueue,
    playFromQueue,
  } = usePlayer();

  const upcomingItems = currentIndex >= 0 ? queue.slice(currentIndex + 1) : [];

  const handleConfirmClear = () => {
    Alert.alert(
      "Clear Queue?",
      "This will remove all upcoming tracks. Your current song will keep playing.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearQueue();
            showToast("Queue cleared", "info");
          },
        },
      ]
    );
  };

  const handleMoveUp = (upcomingIndex: number) => {
    const actualIndex = currentIndex + 1 + upcomingIndex;
    if (actualIndex > currentIndex + 1) {
      moveInQueue(actualIndex, actualIndex - 1);
    }
  };

  const handleMoveDown = (upcomingIndex: number) => {
    const actualIndex = currentIndex + 1 + upcomingIndex;
    if (actualIndex < queue.length - 1) {
      moveInQueue(actualIndex, actualIndex + 1);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        className="flex-1 px-4 pt-12 pb-6"
        style={{ backgroundColor: theme.background }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-white/10">
          <View>
            <AppText variant="screenTitle" className="text-xl font-bold">
              Up Next Queue
            </AppText>
            <AppText variant="caption" className="text-xs text-zinc-400 font-medium mt-0.5">
              {upcomingItems.length > 0
                ? `${upcomingItems.length} ${upcomingItems.length === 1 ? "track" : "tracks"} up next`
                : "No tracks up next"}
            </AppText>
          </View>

          <View className="flex-row items-center gap-x-3">
            {upcomingItems.length > 0 && (
              <Pressable
                onPress={handleConfirmClear}
                className="px-3.5 py-1.5 rounded-full bg-rose-500/10 active:bg-rose-500/20 border border-rose-500/30"
              >
                <AppText className="text-xs text-rose-400 font-bold">Clear Queue</AppText>
              </Pressable>
            )}

            <Pressable
              onPress={onClose}
              hitSlop={12}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-white/10"
            >
              <Icon name="chevron-down" size={26} color={theme.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Section 1: NOW PLAYING */}
        {currentTrack && (
          <View className="mb-5 p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30">
            <AppText variant="caption" className="text-[10px] uppercase tracking-wider text-purple-400 font-bold mb-2">
              NOW PLAYING
            </AppText>

            <View className="flex-row items-center">
              <View className="relative w-12 h-12 rounded-lg overflow-hidden mr-3 bg-zinc-800">
                <ArtworkImage
                  uri={currentTrack.artwork}
                  iconSize={18}
                  className="w-full h-full"
                />
                <View className="absolute inset-0 bg-black/50 items-center justify-center">
                  <Icon
                    name={isPlaying ? "pause" : "play"}
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              <View className="flex-1 mr-2">
                <AppText variant="songTitle" className="text-sm font-bold text-purple-300" numberOfLines={1}>
                  {currentTrack.title}
                </AppText>
                <AppText variant="artist" className="text-xs text-zinc-400 font-medium" numberOfLines={1}>
                  {currentTrack.artist}
                </AppText>
              </View>

              {currentTrack.duration > 0 && (
                <AppText variant="caption" className="text-xs text-zinc-400 font-medium">
                  {formatDuration(currentTrack.duration)}
                </AppText>
              )}
            </View>
          </View>
        )}

        {/* Section 2: UP NEXT LIST */}
        <AppText variant="caption" className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-2 px-1">
          UP NEXT
        </AppText>

        <FlatList
          data={upcomingItems}
          keyExtractor={(item) => item.queueId}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-12"
          ListEmptyComponent={
            <View className="py-16 items-center justify-center px-4 rounded-2xl bg-white/5 border border-white/5 my-2">
              <Icon name="music" size={40} color={theme.textMuted} />
              <AppText variant="songTitle" className="text-sm font-bold text-center mt-3 mb-1">
                No tracks up next
              </AppText>
              <AppText variant="caption" className="text-xs text-zinc-400 font-medium text-center">
                Add songs from Search, Albums, Artists, or your Library.
              </AppText>
            </View>
          }
          renderItem={({ item, index }) => {
            const track = item.track;
            const isFirst = index === 0;
            const isLast = index === upcomingItems.length - 1;

            return (
              <View className="flex-row items-center mb-1.5">
                <Pressable
                  onPress={() => {
                    playFromQueue(item.queueId);
                  }}
                  className="flex-1 flex-row items-center py-2.5 px-3 rounded-xl active:bg-white/10 bg-white/5 border border-white/5"
                >
                  {/* Upcoming Rank Index */}
                  <AppText
                    variant="caption"
                    className="w-6 text-xs text-zinc-400 font-bold text-center mr-2"
                  >
                    {(index + 1).toString().padStart(2, "0")}
                  </AppText>

                  {/* Track Artwork */}
                  <View className="relative w-11 h-11 rounded-lg overflow-hidden mr-3 bg-zinc-800">
                    <ArtworkImage
                      uri={track.artwork}
                      iconSize={18}
                      className="w-full h-full"
                    />
                  </View>

                  {/* Info */}
                  <View className="flex-1 mr-2">
                    <AppText
                      variant="songTitle"
                      className="text-sm font-semibold mb-0.5 text-zinc-200"
                      numberOfLines={1}
                    >
                      {track.title}
                    </AppText>
                    <AppText
                      variant="artist"
                      className="text-xs text-zinc-400 font-medium"
                      numberOfLines={1}
                    >
                      {track.artist}
                    </AppText>
                  </View>

                  {/* Duration */}
                  {track.duration > 0 && (
                    <AppText
                      variant="caption"
                      className="text-xs text-zinc-400 font-medium mr-2"
                    >
                      {formatDuration(track.duration)}
                    </AppText>
                  )}
                </Pressable>

                {/* Move Controls */}
                <View className="flex-col gap-y-1 ml-1.5">
                  <Pressable
                    onPress={() => handleMoveUp(index)}
                    disabled={isFirst}
                    className={`p-1 rounded bg-white/5 active:bg-white/15 ${isFirst ? "opacity-30" : ""}`}
                    hitSlop={6}
                  >
                    <AppText className="text-[10px] text-zinc-300 font-bold text-center">▲</AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => handleMoveDown(index)}
                    disabled={isLast}
                    className={`p-1 rounded bg-white/5 active:bg-white/15 ${isLast ? "opacity-30" : ""}`}
                    hitSlop={6}
                  >
                    <AppText className="text-[10px] text-zinc-300 font-bold text-center">▼</AppText>
                  </Pressable>
                </View>

                {/* Remove Item Button */}
                <Pressable
                  onPress={() => {
                    removeFromQueue(item.queueId);
                    showToast("Removed from queue", "info");
                  }}
                  hitSlop={8}
                  className="p-2.5 rounded-lg active:bg-white/10 ml-1"
                >
                  <AppText className="text-xs text-zinc-500 font-bold">✕</AppText>
                </Pressable>
              </View>
            );
          }}
        />
      </View>
    </Modal>
  );
};
