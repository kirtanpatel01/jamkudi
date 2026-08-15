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
      "Clear Queue",
      "This will remove all upcoming tracks from your queue. Your current song will keep playing.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Queue",
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
        className="flex-1 px-4 pt-12 pb-6 bg-[#0B0813]"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-[#2B233D]">
          <View>
            <AppText variant="screenTitle" className="text-xl font-extrabold text-white tracking-tight">
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
                className="px-3.5 py-1.5 rounded-full bg-rose-500/10 active:bg-rose-500/20 border border-rose-500/30 active:scale-[0.96]"
              >
                <AppText className="text-xs text-rose-400 font-bold">Clear Queue</AppText>
              </Pressable>
            )}

            <Pressable
              onPress={onClose}
              hitSlop={12}
              className="w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/10 active:bg-white/15"
            >
              <Icon name="chevron-down" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Section 1: NOW PLAYING */}
        {currentTrack && (
          <View className="mb-5 p-4 rounded-3xl bg-[#221A35] border border-purple-500/50 shadow-xl shadow-purple-950/40">
            <AppText variant="caption" className="text-[11px] uppercase tracking-wider text-purple-400 font-bold mb-2.5 ml-0.5">
              NOW PLAYING
            </AppText>

            <View className="flex-row items-center">
              <View className="relative w-12 h-12 rounded-xl overflow-hidden mr-3 bg-zinc-800 shrink-0">
                <ArtworkImage
                  uri={currentTrack.artwork}
                  iconSize={18}
                  className="w-full h-full"
                />
                <View className="absolute inset-0 bg-black/60 items-center justify-center">
                  <Icon
                    name={isPlaying ? "pause" : "play"}
                    size={16}
                    color="#C084FC"
                  />
                </View>
              </View>

              <View className="flex-1 mr-3 justify-center min-w-0">
                <AppText variant="songTitle" className="text-sm font-bold text-purple-300 mb-0.5" numberOfLines={1}>
                  {cleanTitle(currentTrack.title)}
                </AppText>
                <AppText variant="artist" className="text-xs text-zinc-400 font-medium" numberOfLines={1}>
                  {cleanTitle(currentTrack.artist)}
                </AppText>
              </View>

              {currentTrack.duration > 0 && (
                <AppText variant="caption" className="text-xs text-zinc-400 font-medium shrink-0">
                  {formatDuration(currentTrack.duration)}
                </AppText>
              )}
            </View>
          </View>
        )}

        {/* Section 2: UP NEXT LIST */}
        <AppText variant="caption" className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2.5 ml-1">
          UP NEXT
        </AppText>

        <FlatList
          data={upcomingItems}
          keyExtractor={(item) => item.queueId}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-12"
          ListEmptyComponent={
            <View className="py-16 items-center justify-center px-4 rounded-3xl bg-[#161224] border border-[#2B233D] my-2 shadow-lg shadow-purple-950/30">
              <Icon name="music" size={40} color="#9CA3AF" />
              <AppText variant="songTitle" className="text-sm font-bold text-center text-white mt-3 mb-1">
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
              <View className="flex-row items-center p-3 rounded-2xl mb-2 bg-[#161224] border border-[#2B233D] active:scale-[0.99] active:bg-[#201A30]">
                <Pressable
                  onPress={() => {
                    playFromQueue(item.queueId);
                  }}
                  className="flex-1 flex-row items-center min-w-0"
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${track.title} by ${track.artist}`}
                >
                  {/* Upcoming Rank Index */}
                  <AppText
                    variant="caption"
                    className="w-6 text-xs text-zinc-400 font-bold text-center mr-2 shrink-0"
                  >
                    {(index + 1).toString().padStart(2, "0")}
                  </AppText>

                  {/* Track Artwork */}
                  <View className="relative w-11 h-11 rounded-xl overflow-hidden mr-3 bg-zinc-800 shrink-0">
                    <ArtworkImage
                      uri={track.artwork}
                      iconSize={18}
                      className="w-full h-full"
                    />
                  </View>

                  {/* Info */}
                  <View className="flex-1 mr-2 justify-center min-w-0">
                    <AppText
                      variant="songTitle"
                      className="text-sm font-bold text-white mb-0.5"
                      numberOfLines={1}
                    >
                      {cleanTitle(track.title)}
                    </AppText>
                    <AppText
                      variant="artist"
                      className="text-xs text-zinc-400 font-medium"
                      numberOfLines={1}
                    >
                      {cleanTitle(track.artist)}
                    </AppText>
                  </View>

                  {/* Duration */}
                  {track.duration > 0 && (
                    <AppText
                      variant="caption"
                      className="text-xs text-zinc-400 font-medium mr-3 shrink-0"
                    >
                      {formatDuration(track.duration)}
                    </AppText>
                  )}
                </Pressable>

                {/* Integrated Move Controls */}
                <View className="flex-col gap-y-1 mr-2 shrink-0">
                  <Pressable
                    onPress={() => handleMoveUp(index)}
                    disabled={isFirst}
                    className={`w-6 h-5 rounded items-center justify-center bg-white/5 active:bg-white/15 ${isFirst ? "opacity-30" : ""}`}
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${track.title} up in queue`}
                  >
                    <Icon name="chevron-up" size={12} color="#D4D4D8" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleMoveDown(index)}
                    disabled={isLast}
                    className={`w-6 h-5 rounded items-center justify-center bg-white/5 active:bg-white/15 ${isLast ? "opacity-30" : ""}`}
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${track.title} down in queue`}
                  >
                    <Icon name="chevron-down" size={12} color="#D4D4D8" />
                  </Pressable>
                </View>

                {/* Remove Item Button */}
                <Pressable
                  onPress={() => {
                    removeFromQueue(item.queueId);
                    showToast("Removed from queue", "info");
                  }}
                  hitSlop={6}
                  className="w-7 h-7 rounded-full bg-white/5 active:bg-white/15 border border-white/10 items-center justify-center shrink-0"
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${track.title} from queue`}
                >
                  <Icon name="x" size={13} color="#9CA3AF" />
                </Pressable>
              </View>
            );
          }}
        />
      </View>
    </Modal>
  );
};
