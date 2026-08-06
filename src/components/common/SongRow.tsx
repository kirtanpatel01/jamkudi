import React from "react";
import { StyleSheet, View, Pressable, ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { IconButton } from "@/components/common/IconButton";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export interface SongRowProps {
  title: string;
  artist: string;
  artworkUri?: string | null;
  duration?: string;
  onPress: () => void;
  onOptionsPress?: () => void;
  isPlaying?: boolean;
  style?: StyleProp<ViewStyle>;
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
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${title} by ${artist}`}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? theme.surfacePressed : "transparent",
        },
        style,
      ]}
    >
      <ArtworkImage uri={artworkUri} size={48} accessibilityLabel={`${title} cover`} />
      <View style={styles.textContainer}>
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
        <AppText variant="caption" color={theme.textMuted} style={styles.duration}>
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

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: 8,
    minHeight: 56,
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "center",
  },
  duration: {
    marginRight: Spacing.xs,
  },
});
