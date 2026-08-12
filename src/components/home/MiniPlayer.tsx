import React, { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { AppText } from "@/components/common/AppText";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { IconButton } from "@/components/common/IconButton";
import { Icon } from "@/components/common/Icon";
import { CURRENTLY_PLAYING } from "@/data/mockMusic";
import { BorderRadius, Spacing } from "@/constants/theme";
import { View, Pressable } from "@/tw";

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

  const dynamicBottom =
    bottomOffset ?? (tabHeight > 0 ? tabHeight + Spacing.xs : insets.bottom + 60);

  return (
    <View
      className="absolute left-3 right-3 rounded-xl border overflow-hidden shadow-lg"
      style={{
        bottom: dynamicBottom,
        backgroundColor: theme.surfaceElevated,
        borderColor: theme.border,
      }}
    >
      {/* Progress line */}
      <View className="h-0.5 w-full bg-zinc-400/15 dark:bg-zinc-600/15">
        <View
          className="h-full w-[42%]"
          style={{ backgroundColor: theme.primary }}
        />
      </View>

      <View className="flex-row items-center px-3 py-2.5">
        <ArtworkImage
          uri={CURRENTLY_PLAYING.imageUrl}
          size={42}
          radius={BorderRadius.xs}
          accessibilityLabel={`${CURRENTLY_PLAYING.title} cover`}
        />

        <View className="flex-1 ml-3 mr-2">
          <AppText variant="songTitle" numberOfLines={1}>
            {CURRENTLY_PLAYING.title}
          </AppText>
          <AppText variant="artist" color={theme.textSecondary} numberOfLines={1}>
            {CURRENTLY_PLAYING.artist}
          </AppText>
        </View>

        <View className="flex-row items-center gap-2">
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
            className="w-9 h-9 rounded-full items-center justify-center ml-2 active:opacity-85"
            style={{ backgroundColor: theme.primary }}
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
