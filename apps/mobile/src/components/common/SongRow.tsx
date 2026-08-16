import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { IconButton } from "@/components/common/IconButton";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { View, Pressable } from "@/tw";

import { DownloadButton } from "@/components/common/DownloadButton";

export interface SongRowProps {
  songId?: string;
  title: string;
  artist: string;
  artworkUri?: string | null;
  duration?: string;
  onPress: () => void;
  onOptionsPress?: () => void;
  onDownloadPress?: () => void;
  isDownloaded?: boolean;
  isPlaying?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const SongRow: React.FC<SongRowProps> = ({
  songId,
  title,
  artist,
  artworkUri,
  duration,
  onPress,
  onOptionsPress,
  onDownloadPress,
  isDownloaded = false,
  isPlaying = false,
  style,
  className = "",
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${title} by ${artist}`}
      className={`flex-row items-center py-2 px-1 my-0.5 rounded-2xl ${className}`}
      style={({ pressed }) => [
        {
          backgroundColor: isPlaying
            ? theme.isDark
              ? "rgba(155, 124, 255, 0.12)"
              : "rgba(155, 124, 255, 0.08)"
            : pressed
            ? theme.surfacePressed
            : "transparent",
        },
        style,
      ]}
    >
      <ArtworkImage
        uri={artworkUri}
        width={48}
        height={48}
        className="rounded-xl overflow-hidden shrink-0"
        accessibilityLabel={`${title} cover`}
      />
      <View className="flex-1 ml-3.5 justify-center min-w-0 mr-2">
        <AppText
          variant="songTitle"
          numberOfLines={1}
          color={isPlaying ? theme.primary : "textPrimary"}
          className={`text-sm ${isPlaying ? "font-bold" : "font-semibold"}`}
        >
          {title}
        </AppText>
        <AppText variant="artist" numberOfLines={1} color="textSecondary" className="text-xs mt-0.5">
          {artist}
        </AppText>
      </View>
      {duration && (
        <AppText variant="caption" color="textMuted" className="mr-2 text-xs">
          {duration}
        </AppText>
      )}
      {(onDownloadPress || songId) && (
        <DownloadButton
          songId={songId || title}
          onPress={onDownloadPress || (() => {})}
          size="sm"
        />
      )}
      {onOptionsPress && (
        <IconButton
          name="settings"
          size={18}
          color={theme.textMuted}
          onPress={onOptionsPress}
          accessibilityLabel={`Options for ${title}`}
        />
      )}
    </Pressable>
  );
};
