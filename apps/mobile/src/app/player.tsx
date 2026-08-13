import React, { useState } from "react";
import { Dimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { QueueModal } from "@/components/common/QueueModal";
import { LyricsModal } from "@/components/common/LyricsModal";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { View, Pressable } from "@/tw";

const { width } = Dimensions.get("window");
const ARTWORK_SIZE = Math.min(width - 64, 330);

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function PlayerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const {
    currentTrack,
    playbackState,
    isPlaying,
    position,
    duration,
    shuffleEnabled,
    repeatMode,
    togglePlayPause,
    seekTo,
    skipToNext,
    skipToPrevious,
    toggleShuffle,
    toggleRepeat,
    toggleLikeTrack,
    isLiked,
  } = usePlayer();

  const [isSliding, setIsSliding] = useState(false);
  const [slidePosition, setSlidePosition] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const isBuffering = playbackState === "buffering" || playbackState === "loading";
  const displayPosition = isSliding ? slidePosition : position;
  const maxDuration = duration > 0 ? duration : currentTrack?.duration || 1;
  const liked = currentTrack ? isLiked(currentTrack.id) : false;

  const handleToggleLike = () => {
    if (!currentTrack) return;
    const willBeLiked = !liked;
    toggleLikeTrack(currentTrack);
    showToast(
      willBeLiked ? "Added to Liked Songs" : "Removed from Liked Songs",
      willBeLiked ? "success" : "info"
    );
  };

  return (
    <>
      <Screen className="justify-between pb-8 pt-2 px-6">
        {/* Top Header */}
        <View className="flex-row items-center justify-between mt-2 mb-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-white/10"
          >
            <Icon name="chevron-down" size={26} color={theme.textPrimary} />
          </Pressable>

          <View className="items-center">
            <AppText
              variant="caption"
              className="uppercase tracking-widest text-[10px] text-zinc-400 font-bold"
            >
              NOW PLAYING
            </AppText>
            <AppText
              variant="body"
              className="text-xs font-semibold text-zinc-200"
              numberOfLines={1}
            >
              {currentTrack?.album || "JioSaavn"}
            </AppText>
          </View>

          <IconButton
            name={liked ? "heart-filled" : "heart"}
            size={24}
            color={liked ? "#EC4899" : theme.textMuted}
            onPress={handleToggleLike}
            accessibilityLabel={liked ? "Unlike Song" : "Like Song"}
          />
        </View>

        {/* Album Artwork */}
        <View className="items-center my-3">
          <View
            className="rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 shadow-md"
            style={{ width: ARTWORK_SIZE, height: ARTWORK_SIZE }}
          >
            <ArtworkImage
              uri={currentTrack?.artwork}
              iconSize={64}
              className="w-full h-full"
            />
          </View>
        </View>

        {/* Track Title & Artist */}
        <View className="mb-2">
          <AppText variant="songTitle" className="text-xl font-bold mb-1">
            {currentTrack?.title || "No Track Selected"}
          </AppText>
          <AppText variant="artist" className="text-sm text-zinc-400 font-medium">
            {currentTrack?.artist || "Unknown Artist"}
          </AppText>
        </View>

        {/* Progress Seeker Bar */}
        <View className="mb-3">
          <Slider
            style={{ width: "100%", height: 30 }}
            minimumValue={0}
            maximumValue={maxDuration}
            value={displayPosition}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.isDark ? "#374151" : "#E5E7EB"}
            thumbTintColor={theme.primary}
            onValueChange={(val) => {
              setIsSliding(true);
              setSlidePosition(val);
            }}
            onSlidingComplete={(val) => {
              setIsSliding(false);
              seekTo(val);
            }}
          />
          <View className="flex-row justify-between px-1 mt-0.5">
            <AppText variant="caption" className="text-xs text-zinc-400 font-medium">
              {formatTime(displayPosition)}
            </AppText>
            <AppText variant="caption" className="text-xs text-zinc-400 font-medium">
              {formatTime(maxDuration)}
            </AppText>
          </View>
        </View>

        {/* Playback Controls Row */}
        <View className="flex-row items-center justify-around mb-4">
          {/* Shuffle Toggle */}
          <Pressable
            onPress={() => {
              toggleShuffle();
              showToast(
                !shuffleEnabled ? "Shuffle On" : "Shuffle Off",
                "info"
              );
            }}
            className="p-2.5 rounded-full active:opacity-70"
            accessibilityLabel={`Shuffle ${shuffleEnabled ? "On" : "Off"}`}
          >
            <Icon
              name="library"
              size={22}
              color={shuffleEnabled ? theme.primary : theme.textMuted}
            />
          </Pressable>

          {/* Skip Previous */}
          <IconButton
            name="skip-back"
            size={28}
            color={theme.textPrimary}
            onPress={skipToPrevious}
            accessibilityLabel="Previous Song"
          />

          {/* Main Play/Pause Button */}
          <Pressable
            onPress={togglePlayPause}
            className="w-16 h-16 rounded-full items-center justify-center active:opacity-80 shadow-lg"
            style={{ backgroundColor: theme.primary }}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Pause" : "Play"}
          >
            {isBuffering ? (
              <ActivityIndicator size="small" color={theme.onPrimary} />
            ) : (
              <Icon
                name={isPlaying ? "pause" : "play"}
                size={30}
                color={theme.onPrimary}
              />
            )}
          </Pressable>

          {/* Skip Next */}
          <IconButton
            name="skip-forward"
            size={28}
            color={theme.textPrimary}
            onPress={skipToNext}
            accessibilityLabel="Next Song"
          />

          {/* Repeat Mode Toggle */}
          <Pressable
            onPress={() => {
              toggleRepeat();
              const nextMode =
                repeatMode === "OFF" ? "Repeat All" : repeatMode === "ALL" ? "Repeat One" : "Repeat Off";
              showToast(nextMode, "info");
            }}
            className="p-2.5 rounded-full items-center justify-center active:opacity-70 relative"
            accessibilityLabel={`Repeat mode ${repeatMode}`}
          >
            <Icon
              name="clock"
              size={22}
              color={repeatMode !== "OFF" ? theme.primary : theme.textMuted}
            />
            {repeatMode === "ONE" && (
              <AppText className="absolute top-1 right-1 text-[9px] font-bold text-purple-400">
                1
              </AppText>
            )}
          </Pressable>
        </View>

        {/* Secondary Labeled Controls Bar */}
        <View className="flex-row items-center justify-center gap-x-6 pt-1">
          <Pressable
            onPress={() => setShowQueue(true)}
            className="flex-row items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 active:bg-white/10"
          >
            <Icon name="library" size={16} color={theme.textPrimary} />
            <AppText className="ml-2 text-xs font-semibold text-zinc-200">
              Queue
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => setShowLyrics(true)}
            className="flex-row items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 active:bg-white/10"
          >
            <Icon name="music" size={16} color={theme.textPrimary} />
            <AppText className="ml-2 text-xs font-semibold text-zinc-200">
              Lyrics
            </AppText>
          </Pressable>
        </View>
      </Screen>

      <QueueModal visible={showQueue} onClose={() => setShowQueue(false)} />
      <LyricsModal visible={showLyrics} onClose={() => setShowLyrics(false)} />
    </>
  );
}
