import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { IconButton } from "@/components/common/IconButton";
import { useTheme } from "@/hooks/useTheme";
import { View, Pressable } from "@/tw";

export interface SongRowProps {
  title: string;
  artist: string;
  artworkUri?: string | null;
  duration?: string;
  onPress: () => void;
  onOptionsPress?: () => void;
  isPlaying?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const SongRow: React.FC<SongRowProps> = ({
  title,
  artist,
  artworkUri,
  duration,
  onPress,
  onOptionsPress,
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
      className={`flex-row items-center py-2 px-1 rounded-lg min-h-[56px] ${className}`}
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? theme.surfacePressed : "transparent",
        },
        style,
      ]}
    >
      <ArtworkImage uri={artworkUri} size={48} accessibilityLabel={`${title} cover`} />
      <View className="flex-1 ml-4 justify-center">
        <AppText
          variant="songTitle"
          numberOfLines={1}
          color={isPlaying ? theme.primary : theme.textPrimary}
        >
          {title}
        </AppText>
        <AppText variant="artist" numberOfLines={1} color={theme.textSecondary}>
          {artist}
        </AppText>
      </View>
      {duration && (
        <AppText variant="caption" color={theme.textMuted} className="mr-1">
          {duration}
        </AppText>
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
