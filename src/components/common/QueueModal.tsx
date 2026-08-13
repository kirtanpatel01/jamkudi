import React from "react";
import { Modal, FlatList } from "react-native";
import { usePlayer } from "@/context/PlayerContext";
import { useTheme } from "@/hooks/useTheme";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
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
  const {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    playQueue,
    removeFromQueue,
    clearQueue,
  } = usePlayer();

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
        <View className="flex-row items-center justify-between mb-6 pb-4 border-b border-white/10">
          <View>
            <AppText variant="screenTitle" className="text-xl font-bold">
              Up Next Queue
            </AppText>
            <AppText variant="caption" className="text-xs text-zinc-400 font-medium mt-0.5">
              {queue.length > 0
                ? `Playing track ${currentIndex + 1} of ${queue.length}`
                : "Queue is empty"}
            </AppText>
          </View>

          <View className="flex-row items-center gap-x-3">
            {queue.length > 0 && (
              <Pressable
                onPress={clearQueue}
                className="px-3 py-1.5 rounded-full bg-white/5 active:bg-white/10 border border-white/10"
              >
                <AppText className="text-xs text-rose-400 font-bold">Clear</AppText>
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

        {/* Queue List */}
        <FlatList
          data={queue}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-12"
          ListEmptyComponent={
            <View className="py-20 items-center justify-center">
              <Icon name="music" size={48} color={theme.textMuted} />
              <AppText variant="body" className="mt-4 text-zinc-400 font-medium">
                No songs in the queue yet.
              </AppText>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCurrent = currentTrack?.id === item.id && index === currentIndex;
            return (
              <View className="flex-row items-center mb-1.5">
                <Pressable
                  onPress={() => {
                    playQueue(queue, index);
                    onClose();
                  }}
                  className={`flex-1 flex-row items-center py-2.5 px-3 rounded-xl active:bg-white/10 ${
                    isCurrent ? "bg-purple-900/30 border border-purple-500/30" : ""
                  }`}
                >
                  {/* Index / Playing Indicator */}
                  <View className="w-7 items-center justify-center mr-2">
                    {isCurrent ? (
                      <Icon
                        name={isPlaying ? "pause" : "play"}
                        size={18}
                        color={theme.primary}
                      />
                    ) : (
                      <AppText
                        variant="caption"
                        className="text-xs text-zinc-400 font-bold"
                      >
                        {index + 1}
                      </AppText>
                    )}
                  </View>

                  {/* Track Artwork */}
                  <View className="relative w-11 h-11 rounded-lg overflow-hidden mr-3 bg-zinc-800">
                    <ArtworkImage
                      uri={item.artwork}
                      iconSize={18}
                      className="w-full h-full"
                    />
                  </View>

                  {/* Info */}
                  <View className="flex-1 mr-2">
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

                  {/* Duration */}
                  {item.duration > 0 && (
                    <AppText
                      variant="caption"
                      className="text-xs text-zinc-400 font-medium mr-2"
                    >
                      {formatDuration(item.duration)}
                    </AppText>
                  )}
                </Pressable>

                {/* Remove Item Button */}
                {!isCurrent && (
                  <Pressable
                    onPress={() => removeFromQueue(index)}
                    hitSlop={8}
                    className="p-2.5 rounded-lg active:bg-white/10 ml-1"
                  >
                    <AppText className="text-xs text-zinc-500 font-bold">✕</AppText>
                  </Pressable>
                )}
              </View>
            );
          }}
        />
      </View>
    </Modal>
  );
};
