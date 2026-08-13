import React from "react";
import { ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { usePlayer } from "@/context/PlayerContext";
import { useTheme } from "@/hooks/useTheme";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { View, Pressable } from "@/tw";

export const MiniPlayer: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const {
    currentTrack,
    playbackState,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    skipToNext,
  } = usePlayer();

  if (!currentTrack) {
    return null;
  }

  const isBuffering = playbackState === "buffering" || playbackState === "loading";
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

  return (
    <Pressable
      onPress={() => router.push("/player")}
      className="absolute bottom-16 left-3 right-3 h-16 rounded-2xl flex-row items-center px-3 shadow-2xl overflow-hidden active:opacity-95"
      style={{
        backgroundColor: theme.isDark ? "#1E1B2E" : "#FFFFFF",
        borderWidth: 1,
        borderColor: theme.isDark ? "#2E2A45" : "#E5E7EB",
        elevation: 10,
        zIndex: 50,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Now playing ${currentTrack.title}. Tap to expand.`}
    >
      {/* Top Mini Progress Bar */}
      <View className="absolute top-0 left-0 right-0 h-[2.5px] bg-white/10">
        <View
          className="h-full rounded-r"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: theme.primary,
          }}
        />
      </View>

      {/* Album Artwork */}
      <View className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 mr-3 items-center justify-center">
        <ArtworkImage
          uri={currentTrack.artwork}
          iconSize={20}
          className="w-full h-full"
        />
      </View>

      {/* Title & Artist Info */}
      <View className="flex-1 mr-2">
        <AppText
          variant="songTitle"
          className="text-sm font-semibold mb-0.5"
          numberOfLines={1}
        >
          {currentTrack.title}
        </AppText>
        <AppText
          variant="artist"
          className="text-xs text-zinc-400 font-medium"
          numberOfLines={1}
        >
          {currentTrack.artist}
        </AppText>
      </View>

      {/* Quick Play/Pause & Next Controls */}
      <View className="flex-row items-center gap-x-1">
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          className="w-10 h-10 items-center justify-center rounded-full active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
        >
          {isBuffering ? (
            <ActivityIndicator size="small" color={theme.textPrimary} />
          ) : (
            <Icon
              name={isPlaying ? "pause" : "play"}
              size={24}
              color={theme.textPrimary}
            />
          )}
        </Pressable>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            skipToNext();
          }}
          className="w-10 h-10 items-center justify-center rounded-full active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="Next song"
        >
          <Icon name="skip-forward" size={22} color={theme.textMuted} />
        </Pressable>
      </View>
    </Pressable>
  );
};
