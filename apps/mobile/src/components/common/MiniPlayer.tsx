import React from "react";
import { ActivityIndicator } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { usePlayer } from "@/context/PlayerContext";
import { useTheme } from "@/hooks/useTheme";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { View, Pressable } from "@/tw";

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

export const MiniPlayer: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
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

  // Hide MiniPlayer on full-screen player modal, auth/onboarding screens, or when no track is selected
  const isAuthScreen = pathname.includes("(auth)") || pathname.includes("login") || pathname.includes("signup") || pathname.includes("onboarding");
  if (!currentTrack || pathname === "/player" || isAuthScreen) {
    return null;
  }

  // Adjust bottom offset depending on whether bottom tab bar is visible
  const isTabScreen =
    pathname === "/" ||
    pathname === "/search" ||
    pathname === "/library" ||
    pathname.startsWith("/(tabs)");

  const bottomOffset = isTabScreen ? 68 : 16;
  const isBuffering = playbackState === "buffering" || playbackState === "loading";
  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

  return (
    <Pressable
      onPress={() => router.push("/player")}
      className="absolute left-3 right-3 h-16 rounded-2xl flex-row items-center px-3.5 overflow-hidden active:scale-[0.98]"
      style={{
        backgroundColor: theme.surface,
        bottom: bottomOffset,
        zIndex: 99,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Now playing ${currentTrack.title}. Tap to expand.`}
    >
      {/* Top Mini Progress Bar */}
      <View
        className="absolute top-0 left-0 right-0 h-[2.5px]"
        style={{ backgroundColor: theme.divider }}
      >
        <View
          className="h-full rounded-r bg-[#9B7CFF]"
          style={{
            width: `${progressPercent}%`,
          }}
        />
      </View>

      {/* Album Artwork */}
      <View
        className="w-11 h-11 rounded-2xl overflow-hidden mr-3 items-center justify-center shrink-0"
        style={{ backgroundColor: theme.surfacePressed }}
      >
        <ArtworkImage
          uri={currentTrack.artwork}
          iconSize={20}
          className="w-full h-full"
        />
      </View>

      {/* Song Info */}
      <View className="flex-1 min-w-0 mr-3 justify-center">
        <AppText
          variant="songTitle"
          color="textPrimary"
          className="text-xs font-extrabold mb-0.5"
          numberOfLines={1}
        >
          {cleanTitle(currentTrack.title)}
        </AppText>
        <AppText
          variant="artist"
          color="textSecondary"
          className="text-[11px] font-medium"
          numberOfLines={1}
        >
          {cleanTitle(currentTrack.artist)}
        </AppText>
      </View>

      {/* Quick Play/Pause & Next Controls */}
      <View className="flex-row items-center gap-x-1.5 shrink-0">
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          className="w-10 h-10 items-center justify-center rounded-full bg-purple-600/30 active:bg-purple-600 active:scale-[0.92]"
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
        >
          {isBuffering ? (
            <ActivityIndicator size="small" color="#C084FC" />
          ) : (
            <Icon
              name={isPlaying ? "pause" : "play"}
              size={20}
              color="#C084FC"
            />
          )}
        </Pressable>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            skipToNext();
          }}
          className="w-9 h-9 items-center justify-center rounded-full active:opacity-70 active:scale-[0.92]"
          accessibilityRole="button"
          accessibilityLabel="Next song"
        >
          <Icon name="skip-forward" size={20} color={theme.textPrimary} />
        </Pressable>
      </View>
    </Pressable>
  );
};
