import React, { useState } from "react";
import { Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
import { QueueModal } from "@/components/common/QueueModal";
import { LyricsModal } from "@/components/common/LyricsModal";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { View, Pressable } from "@/tw";
import { Image } from "@/tw/image";

const { width } = Dimensions.get("window");
const ARTWORK_SIZE = Math.min(width - 64, 340);

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function PlayerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    seekTo,
    skipToNext,
    skipToPrevious,
  } = usePlayer();

  const [isSliding, setIsSliding] = useState(false);
  const [slidePosition, setSlidePosition] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const displayPosition = isSliding ? slidePosition : position;
  const maxDuration = duration > 0 ? duration : currentTrack?.duration || 1;

  return (
    <>
      <Screen className="justify-between pb-8 pt-2 px-6">
        {/* Top Header */}
        <View className="flex-row items-center justify-between mt-2 mb-4">
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
            name="heart"
            size={22}
            color={theme.textMuted}
            onPress={() => {}}
            accessibilityLabel="Add to Favorites"
          />
        </View>

        {/* Album Artwork */}
        <View className="items-center my-4">
          <View
            className="rounded-3xl overflow-hidden shadow-2xl bg-zinc-800"
            style={{ width: ARTWORK_SIZE, height: ARTWORK_SIZE }}
          >
            {currentTrack?.artwork ? (
              <Image
                source={{ uri: currentTrack.artwork }}
                className="w-full h-full"
              />
            ) : (
              <View className="w-full h-full items-center justify-center bg-purple-900/40">
                <Icon name="music" size={64} color={theme.primary} />
              </View>
            )}
          </View>
        </View>

        {/* Track Info */}
        <View className="mb-4">
          <AppText variant="songTitle" className="text-xl font-bold mb-1">
            {currentTrack?.title || "No Track Selected"}
          </AppText>
          <AppText variant="artist" className="text-sm text-zinc-400 font-medium">
            {currentTrack?.artist || "Unknown Artist"}
          </AppText>
        </View>

        {/* Progress Slider */}
        <View className="mb-4">
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
          <View className="flex-row justify-between px-1 mt-1">
            <AppText variant="caption" className="text-xs text-zinc-400 font-medium">
              {formatTime(displayPosition)}
            </AppText>
            <AppText variant="caption" className="text-xs text-zinc-400 font-medium">
              {formatTime(maxDuration)}
            </AppText>
          </View>
        </View>

        {/* Playback Controls */}
        <View className="flex-row items-center justify-around mb-4">
          <IconButton
            name="library"
            size={22}
            color={theme.textMuted}
            onPress={() => setShowQueue(true)}
            accessibilityLabel="Up Next Queue"
          />

          <IconButton
            name="skip-back"
            size={28}
            color={theme.textPrimary}
            onPress={skipToPrevious}
            accessibilityLabel="Previous Song"
          />

          <Pressable
            onPress={togglePlayPause}
            className="w-16 h-16 rounded-full items-center justify-center active:opacity-80 shadow-lg"
            style={{ backgroundColor: theme.primary }}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Pause" : "Play"}
          >
            <Icon
              name={isPlaying ? "pause" : "play"}
              size={30}
              color={theme.onPrimary}
            />
          </Pressable>

          <IconButton
            name="skip-forward"
            size={28}
            color={theme.textPrimary}
            onPress={skipToNext}
            accessibilityLabel="Next Song"
          />

          <IconButton
            name="music"
            size={22}
            color={theme.textMuted}
            onPress={() => setShowLyrics(true)}
            accessibilityLabel="View Song Lyrics"
          />
        </View>
      </Screen>

      <QueueModal visible={showQueue} onClose={() => setShowQueue(false)} />
      <LyricsModal visible={showLyrics} onClose={() => setShowLyrics(false)} />
    </>
  );
}
