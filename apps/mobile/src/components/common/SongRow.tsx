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
      className={`flex-row items-center p-2.5 my-1 rounded-2xl active:scale-[0.99] active:opacity-90 ${className}`}
      style={({ pressed }) => [
        {
          backgroundColor: isPlaying
            ? theme.isDark
              ? "rgba(155, 124, 255, 0.16)"
              : "rgba(155, 124, 255, 0.1)"
            : pressed
            ? theme.surfacePressed
            : "transparent",
        },
        style,
      ]}
    >
      {/* Artwork Container */}
      <View
        className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm"
        style={{ backgroundColor: theme.surfacePressed }}
      >
        <ArtworkImage
          uri={artworkUri}
          width={48}
          height={48}
          className="w-full h-full"
          accessibilityLabel={`${title} cover`}
        />
        {isPlaying && (
          <View className="absolute inset-0 bg-black/45 items-center justify-center">
            <Icon name="pause" size={18} color="#C084FC" />
          </View>
        )}
      </View>

      {/* Song Title & Artist */}
      <View className="flex-1 ml-3.5 justify-center min-w-0 mr-2">
        <AppText
          variant="songTitle"
          numberOfLines={1}
          color={isPlaying ? theme.primary : "textPrimary"}
          className={`text-sm ${isPlaying ? "font-black text-purple-300" : "font-bold"}`}
        >
          {title}
        </AppText>
        <AppText
          variant="artist"
          numberOfLines={1}
          color="textSecondary"
          className="text-xs font-medium mt-0.5"
        >
          {artist}
        </AppText>
      </View>

      {/* Duration Badge */}
      {duration && (
        <View className="px-2 py-0.5 rounded-md bg-white/5 mr-2 shrink-0">
          <AppText variant="caption" color="textMuted" className="text-[11px] font-semibold">
            {duration}
          </AppText>
        </View>
      )}

      {/* Download Action */}
      {(onDownloadPress || songId) && (
        <DownloadButton
          songId={songId || title}
          onPress={onDownloadPress || (() => {})}
          size="sm"
        />
      )}

      {/* Options Button */}
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
