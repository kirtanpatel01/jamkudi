import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { useTheme } from "@/hooks/useTheme";
import { View, Pressable } from "@/tw";

interface EditorialHeroProps {
  title: string;
  subtitle?: string;
  artworkUri?: string | null;
  badge?: string;
  isPlaying?: boolean;
  onPlayPress?: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  title,
  subtitle,
  artworkUri,
  badge = "Sanctuary Focus",
  isPlaying = false,
  onPlayPress,
  onPress,
  style,
  className = "",
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress || onPlayPress}
      className={`w-full p-4 rounded-3xl flex-row items-center justify-between shadow-lg relative overflow-hidden active:scale-[0.985] ${className}`}
      style={[
        { backgroundColor: theme.isDark ? "#1E1832" : theme.surfaceElevated },
        style,
      ]}
    >
      {/* Ambient Radial Accent Glow */}
      <View className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-purple-500/15 pointer-events-none" />

      <View className="flex-row items-center flex-1 mr-3 min-w-0">
        {/* Artwork */}
        <View
          className="w-24 h-24 rounded-2xl overflow-hidden mr-4 shrink-0 shadow-md"
          style={{ backgroundColor: theme.surfacePressed }}
        >
          <ArtworkImage uri={artworkUri} width={96} height={96} iconSize={32} />
        </View>

        {/* Content Header */}
        <View className="flex-1 min-w-0 justify-center">
          {badge ? (
            <View className="self-start px-2.5 py-0.5 rounded-full bg-purple-500/15 mb-2">
              <AppText
                variant="caption"
                className="text-[10px] font-black uppercase tracking-widest text-purple-300"
              >
                {badge}
              </AppText>
            </View>
          ) : null}

          <AppText
            variant="screenTitle"
            className="text-lg font-black tracking-tight mb-1 text-purple-200"
            numberOfLines={2}
          >
            {title}
          </AppText>

          {subtitle ? (
            <AppText
              variant="artist"
              color="textSecondary"
              className="text-xs font-semibold"
              numberOfLines={1}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>

      {/* Play Action Button */}
      {onPlayPress ? (
        <Pressable
          onPress={onPlayPress}
          className="w-13 h-13 rounded-full items-center justify-center bg-purple-600 shrink-0 shadow-md active:scale-[0.90] active:bg-purple-700"
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
        >
          <Icon name={isPlaying ? "pause" : "play"} size={22} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </Pressable>
  );
};
