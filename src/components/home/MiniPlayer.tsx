import React, { useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { AppText } from "@/components/common/AppText";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { IconButton } from "@/components/common/IconButton";
import { Icon } from "@/components/common/Icon";
import { CURRENTLY_PLAYING } from "@/data/mockMusic";
import { BorderRadius, Spacing } from "@/constants/theme";

function SafeTabHeight(): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useBottomTabBarHeight } = require("@react-navigation/bottom-tabs");
    return useBottomTabBarHeight();
  } catch {
    return 0;
  }
}

export interface MiniPlayerProps {
  bottomOffset?: number;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ bottomOffset }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabHeight = SafeTabHeight();

  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(true);

  // If bottomOffset is passed explicitly, use it; otherwise compute dynamically from tabHeight/insets
  const dynamicBottom =
    bottomOffset ?? (tabHeight > 0 ? tabHeight + Spacing.xs : insets.bottom + 60);

  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom: dynamicBottom,
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Progress line */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { backgroundColor: theme.primary, width: "42%" },
          ]}
        />
      </View>

      <View style={styles.container}>
        <ArtworkImage
          uri={CURRENTLY_PLAYING.imageUrl}
          size={42}
          radius={BorderRadius.xs}
          accessibilityLabel={`${CURRENTLY_PLAYING.title} cover`}
        />

        <View style={styles.textContainer}>
          <AppText variant="songTitle" numberOfLines={1}>
            {CURRENTLY_PLAYING.title}
          </AppText>
          <AppText variant="artist" color={theme.textSecondary} numberOfLines={1}>
            {CURRENTLY_PLAYING.artist}
          </AppText>
        </View>

        <View style={styles.actionsContainer}>
          <IconButton
            name={isLiked ? "heart-filled" : "heart"}
            size={22}
            color={isLiked ? theme.favorite : theme.textMuted}
            onPress={() => setIsLiked(!isLiked)}
            accessibilityLabel={isLiked ? "Unlike song" : "Like song"}
          />

          <IconButton
            name="devices"
            size={22}
            color={theme.textMuted}
            onPress={() => {}}
            accessibilityLabel="Playback Devices"
          />

          <Pressable
            onPress={() => setIsPlaying(!isPlaying)}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Pause music" : "Play music"}
            style={({ pressed }) => [
              styles.playBtn,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Icon
              name={isPlaying ? "pause" : "play"}
              size={18}
              color={theme.onPrimary}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: Spacing.sm,
    right: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  progressBarBg: {
    height: 2,
    width: "100%",
    backgroundColor: "rgba(150, 150, 150, 0.15)",
  },
  progressBarFill: {
    height: "100%",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.xs,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.xs,
  },
});
