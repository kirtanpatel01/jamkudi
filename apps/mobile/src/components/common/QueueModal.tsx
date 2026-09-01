import React, { useMemo, useCallback } from "react";
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

function calculateTotalDuration(items: QueueItem[]): string {
  const totalSecs = items.reduce((acc, item) => acc + (item.track?.duration || 0), 0);
  if (totalSecs <= 0) return "";
  const mins = Math.floor(totalSecs / 60);
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours > 0) {
    return `${hours}h ${remainingMins}m`;
  }
  return `${mins} min${mins === 1 ? "" : "s"}`;
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

interface QueueItemRowProps {
  item: QueueItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  theme: ReturnType<typeof useTheme>;
  onPlay: (queueId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (queueId: string, title: string) => void;
}

const QueueItemRow = React.memo<QueueItemRowProps>(({
  item,
  index,
  isFirst,
  isLast,
  theme,
  onPlay,
  onMoveUp,
  onMoveDown,
  onRemove,
}) => {
  const track = item.track;
  const formattedIndex = (index + 1).toString().padStart(2, "0");

  return (
    <View
      className="flex-row items-center p-3 rounded-2xl mb-2.5 active:scale-[0.995]"
      style={{ backgroundColor: theme.surface }}
    >
      <Pressable
        onPress={() => onPlay(item.queueId)}
        className="flex-1 flex-row items-center min-w-0"
        accessibilityRole="button"
        accessibilityLabel={`Play ${track.title} by ${track.artist}`}
      >
        {/* Track Rank Badge */}
        <View className="w-7 h-7 rounded-lg items-center justify-center bg-purple-500/10 mr-2.5 shrink-0">
          <AppText
            variant="caption"
            className="text-[11px] font-bold text-purple-400 text-center"
          >
            {formattedIndex}
          </AppText>
        </View>

        {/* Track Artwork */}
        <View
          className="relative w-12 h-12 rounded-xl overflow-hidden mr-3 shrink-0"
          style={{ backgroundColor: theme.surfacePressed }}
        >
          <ArtworkImage
            uri={track.artwork}
            iconSize={20}
            className="w-full h-full"
          />
        </View>

        {/* Track Info */}
        <View className="flex-1 mr-2 justify-center min-w-0">
          <AppText
            variant="songTitle"
            color="textPrimary"
            className="text-sm font-bold mb-0.5"
            numberOfLines={1}
          >
            {cleanTitle(track.title)}
          </AppText>
          <AppText
            variant="artist"
            color="textSecondary"
            className="text-xs font-medium"
            numberOfLines={1}
          >
            {cleanTitle(track.artist)}
          </AppText>
        </View>

        {/* Track Duration */}
        {track.duration > 0 && (
          <View className="px-2 py-1 rounded-md bg-white/5 mr-2 shrink-0">
            <AppText
              variant="caption"
              color="textMuted"
              className="text-[11px] font-semibold"
            >
              {formatDuration(track.duration)}
            </AppText>
          </View>
        )}
      </Pressable>

      {/* Integrated Move Controls */}
      <View className="flex-col gap-y-1 mr-2 shrink-0">
        <Pressable
          onPress={() => onMoveUp(index)}
          disabled={isFirst}
          className={`w-7 h-5 rounded-lg items-center justify-center ${
            isFirst ? "opacity-25" : "active:bg-purple-500/20 active:scale-[0.95]"
          }`}
          style={{ backgroundColor: theme.surfacePressed }}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`Move ${track.title} up in queue`}
        >
          <Icon name="chevron-up" size={13} color={isFirst ? theme.textMuted : theme.primary} />
        </Pressable>
        <Pressable
          onPress={() => onMoveDown(index)}
          disabled={isLast}
          className={`w-7 h-5 rounded-lg items-center justify-center ${
            isLast ? "opacity-25" : "active:bg-purple-500/20 active:scale-[0.95]"
          }`}
          style={{ backgroundColor: theme.surfacePressed }}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`Move ${track.title} down in queue`}
        >
          <Icon name="chevron-down" size={13} color={isLast ? theme.textMuted : theme.primary} />
        </Pressable>
      </View>

      {/* Remove Item Button */}
      <Pressable
        onPress={() => onRemove(item.queueId, cleanTitle(track.title))}
        hitSlop={6}
        className="w-8 h-8 rounded-xl items-center justify-center shrink-0 bg-rose-500/10 active:bg-rose-500/25 active:scale-[0.95]"
        accessibilityRole="button"
        accessibilityLabel={`Remove ${track.title} from queue`}
      >
        <Icon name="x" size={14} color="#F87171" />
      </Pressable>
    </View>
  );
});

QueueItemRow.displayName = "QueueItemRow";

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

  const upcomingItems = useMemo(
    () => (currentIndex >= 0 ? queue.slice(currentIndex + 1) : []),
    [queue, currentIndex]
  );

  const totalQueueCount = upcomingItems.length;

  const totalDurationText = useMemo(
    () => calculateTotalDuration(upcomingItems),
    [upcomingItems]
  );

  const handleConfirmClear = useCallback(() => {
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
  }, [clearQueue, showToast]);

  const handleMoveUp = useCallback(
    (upcomingIndex: number) => {
      const actualIndex = currentIndex + 1 + upcomingIndex;
      if (actualIndex > currentIndex + 1) {
        moveInQueue(actualIndex, actualIndex - 1);
      }
    },
    [currentIndex, moveInQueue]
  );

  const handleMoveDown = useCallback(
    (upcomingIndex: number) => {
      const actualIndex = currentIndex + 1 + upcomingIndex;
      if (actualIndex < queue.length - 1) {
        moveInQueue(actualIndex, actualIndex + 1);
      }
    },
    [currentIndex, queue.length, moveInQueue]
  );

  const handleRemove = useCallback(
    (queueId: string, title: string) => {
      removeFromQueue(queueId);
      showToast(`Removed "${title}" from queue`, "info");
    },
    [removeFromQueue, showToast]
  );

  const handlePlayFromQueue = useCallback(
    (queueId: string) => {
      playFromQueue(queueId);
    },
    [playFromQueue]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: QueueItem; index: number }) => (
      <QueueItemRow
        item={item}
        index={index}
        isFirst={index === 0}
        isLast={index === upcomingItems.length - 1}
        theme={theme}
        onPlay={handlePlayFromQueue}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onRemove={handleRemove}
      />
    ),
    [upcomingItems.length, theme, handlePlayFromQueue, handleMoveUp, handleMoveDown, handleRemove]
  );

  const keyExtractor = useCallback((item: QueueItem) => item.queueId, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        className="flex-1 px-4 pt-4 pb-6"
        style={{ backgroundColor: theme.background }}
      >
        {/* Sheet Grab Handle Bar */}
        <View className="w-12 h-1.5 rounded-full bg-white/20 self-center mb-4 mt-2" />

        {/* Header */}
        <View className="flex-row items-center justify-between mb-5 pb-3">
          <View className="flex-row items-center gap-x-2.5">
            <AppText variant="screenTitle" className="text-2xl font-black tracking-tight">
              Play Queue
            </AppText>
            <View className="px-3 py-1 rounded-full bg-purple-500/15">
              <AppText variant="caption" className="text-xs text-purple-300 font-bold">
                {totalQueueCount} {totalQueueCount === 1 ? "song" : "songs"}
              </AppText>
            </View>
          </View>

          <View className="flex-row items-center gap-x-2">
            {totalQueueCount > 0 && (
              <Pressable
                onPress={handleConfirmClear}
                className="flex-row items-center gap-x-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/10 active:bg-rose-500/20 active:scale-[0.95]"
                accessibilityRole="button"
                accessibilityLabel="Clear Queue"
              >
                <Icon name="trash" size={13} color="#F87171" />
                <AppText className="text-xs text-rose-400 font-bold">Clear</AppText>
              </Pressable>
            )}

            <Pressable
              onPress={onClose}
              hitSlop={8}
              className="w-10 h-10 items-center justify-center rounded-full active:opacity-70 active:scale-[0.95]"
              style={{ backgroundColor: theme.surface }}
              accessibilityRole="button"
              accessibilityLabel="Close queue"
            >
              <Icon name="chevron-down" size={22} color={theme.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Section 1: NOW PLAYING */}
        {currentTrack && (
          <View
            className="mb-6 p-4 rounded-3xl shadow-lg relative overflow-hidden"
            style={{ backgroundColor: theme.isDark ? "#1D1830" : theme.surfaceElevated }}
          >
            {/* Ambient Accent Glow */}
            <View className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-purple-500/10 pointer-events-none" />

            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                <AppText
                  variant="caption"
                  className="text-[11px] uppercase tracking-widest text-purple-400 font-black"
                >
                  NOW PLAYING
                </AppText>
              </View>
              {currentTrack.duration > 0 && (
                <View className="px-2.5 py-0.5 rounded-md bg-white/5">
                  <AppText variant="caption" color="textMuted" className="text-[11px] font-semibold">
                    {formatDuration(currentTrack.duration)}
                  </AppText>
                </View>
              )}
            </View>

            <View className="flex-row items-center">
              <View
                className="relative w-14 h-14 rounded-2xl overflow-hidden mr-3.5 shrink-0"
                style={{ backgroundColor: theme.surfacePressed }}
              >
                <ArtworkImage
                  uri={currentTrack.artwork}
                  iconSize={22}
                  className="w-full h-full"
                />
                <View className="absolute inset-0 bg-black/40 items-center justify-center">
                  <Icon
                    name={isPlaying ? "pause" : "play"}
                    size={18}
                    color="#C084FC"
                  />
                </View>
              </View>

              <View className="flex-1 mr-2 justify-center min-w-0">
                <AppText
                  variant="songTitle"
                  className="text-base font-extrabold text-purple-300 mb-0.5"
                  numberOfLines={1}
                >
                  {cleanTitle(currentTrack.title)}
                </AppText>
                <AppText
                  variant="artist"
                  color="textSecondary"
                  className="text-xs font-semibold"
                  numberOfLines={1}
                >
                  {cleanTitle(currentTrack.artist)}
                </AppText>
              </View>
            </View>
          </View>
        )}

        {/* Section 2: UP NEXT LIST HEADER */}
        <View className="flex-row items-center justify-between mb-3 px-1">
          <AppText
            variant="caption"
            color="textSecondary"
            className="text-xs uppercase tracking-widest font-extrabold text-purple-300/90"
          >
            UP NEXT
          </AppText>

          {totalDurationText ? (
            <View className="flex-row items-center gap-x-1">
              <Icon name="clock" size={12} color={theme.textMuted} />
              <AppText variant="caption" color="textMuted" className="text-xs font-medium">
                {totalDurationText} total
              </AppText>
            </View>
          ) : null}
        </View>

        {/* FlatList */}
        <FlatList
          data={upcomingItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-12"
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            <View
              className="py-14 items-center justify-center px-6 rounded-3xl my-2"
              style={{ backgroundColor: theme.surface }}
            >
              <View className="w-16 h-16 rounded-full bg-purple-500/10 items-center justify-center mb-3">
                <Icon name="music" size={32} color={theme.primary} />
              </View>
              <AppText variant="songTitle" className="text-base font-bold text-center mb-1">
                No tracks up next
              </AppText>
              <AppText
                variant="caption"
                color="textSecondary"
                className="text-xs font-medium text-center leading-5 max-w-[260px]"
              >
                Explore Search, Albums, Artists, or your Library to add songs to your queue.
              </AppText>
            </View>
          }
        />
      </View>
    </Modal>
  );
};
