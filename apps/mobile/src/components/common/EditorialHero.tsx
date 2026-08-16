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
      className={`w-full py-4 px-1 rounded-[32px] flex-row items-center justify-between active:opacity-95 ${className}`}
      style={style}
    >
      <View className="flex-row items-center flex-1 mr-4 min-w-0">
        {/* Floating borderless artwork */}
        <View className="w-24 h-24 rounded-2xl overflow-hidden mr-4 shrink-0 shadow-lg shadow-black/10">
          <ArtworkImage uri={artworkUri} width={96} height={96} iconSize={32} />
        </View>

        <View className="flex-1 min-w-0">
          {badge ? (
            <AppText
              variant="caption"
              color="textSecondary"
              className="text-[10px] font-bold uppercase tracking-widest mb-1"
            >
              {badge}
            </AppText>
          ) : null}

          <AppText
            variant="screenTitle"
            color="textPrimary"
            className="text-lg font-bold tracking-tight mb-1"
            numberOfLines={2}
          >
            {title}
          </AppText>

          {subtitle ? (
            <AppText
              variant="artist"
              color="textSecondary"
              className="text-xs font-medium"
              numberOfLines={1}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>

      {onPlayPress ? (
        <Pressable
          onPress={onPlayPress}
          className="w-12 h-12 rounded-full items-center justify-center bg-[#9B7CFF] shrink-0 active:scale-[0.95] shadow-md shadow-purple-950/20"
        >
          <Icon name={isPlaying ? "pause" : "play"} size={22} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </Pressable>
  );
};
