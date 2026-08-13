import React, { useState } from "react";
import { Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
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

  const displayPosition = isSliding ? slidePosition : position;
  const maxDuration = duration > 0 ? duration : currentTrack?.duration || 1;

  return (
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
            Playing From Search
          </AppText>
          <AppText
            variant="songTitle"
            className="text-xs font-semibold"
            numberOfLines={1}
          >
            {currentTrack?.album || "JioSaavn Stream"}
          </AppText>
        </View>

        <IconButton
          name="settings"
          size={20}
          onPress={() => {}}
          accessibilityLabel="More Options"
          variant="subtle"
        />
      </View>

      {/* Album Artwork */}
      <View className="items-center justify-center my-4">
        <View
          className="rounded-2xl overflow-hidden shadow-2xl elevation-10 border border-white/10"
          style={{ width: ARTWORK_SIZE, height: ARTWORK_SIZE }}
        >
          {currentTrack?.artwork ? (
            <Image
              source={{ uri: currentTrack.artwork }}
              className="w-full h-full"
            />
          ) : (
            <View
              className="w-full h-full items-center justify-center"
              style={{ backgroundColor: theme.surfaceElevated }}
            >
              <Icon name="music" size={80} color={theme.primary} />
            </View>
          )}
        </View>
      </View>

      {/* Track Metadata */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-1 mr-4">
            <AppText
              variant="screenTitle"
              className="text-2xl font-bold tracking-tight mb-1"
              numberOfLines={1}
            >
              {currentTrack?.title || "No Track Selected"}
            </AppText>
            <AppText
              variant="body"
              className="text-base text-zinc-400 font-medium"
              numberOfLines={1}
            >
              {currentTrack?.artist || "Select a song to start playing"}
            </AppText>
          </View>

          <IconButton
            name="heart"
            size={24}
            color={theme.favorite}
            onPress={() => {}}
            accessibilityLabel="Favorite Track"
          />
        </View>
      </View>

      {/* Progress Slider */}
      <View className="mb-6">
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={0}
          maximumValue={maxDuration}
          value={displayPosition}
          minimumTrackTintColor={theme.primary}
          maximumTrackTintColor={theme.border}
          thumbTintColor={theme.primary}
          onValueChange={(val) => {
            setIsSliding(true);
            setSlidePosition(val);
          }}
          onSlidingComplete={async (val) => {
            await seekTo(val);
            setIsSliding(false);
          }}
        />

        <View className="flex-row justify-between px-1 -mt-1">
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
          name="devices"
          size={22}
          color={theme.textMuted}
          onPress={() => {}}
          accessibilityLabel="Devices"
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
          name="heart-filled"
          size={22}
          color={theme.textMuted}
          onPress={() => {}}
          accessibilityLabel="Repeat"
        />
      </View>
    </Screen>
  );
}
