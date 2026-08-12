import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";
import { View, Pressable } from "@/tw";

export interface MediaCardProps {
  title: string;
  subtitle?: string;
  artworkUri?: string | null;
  badge?: string;
  onPress: () => void;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  title,
  subtitle,
  artworkUri,
  badge,
  onPress,
  width = 140,
  height = 140,
  style,
  className = "",
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ""}`}
      className={`mr-4 active:opacity-85 ${className}`}
      style={[{ width }, style]}
    >
      <View className="relative mb-1">
        <ArtworkImage
          uri={artworkUri}
          width={width}
          height={height}
          radius={BorderRadius.lg}
          accessibilityLabel={`${title} artwork`}
        />
        {badge && (
          <View
            className="absolute top-1 right-1 px-1 py-0.5 rounded"
            style={{ backgroundColor: theme.primary }}
          >
            <AppText variant="caption" color={theme.onPrimary} className="text-[10px] leading-[12px]">
              {badge}
            </AppText>
          </View>
        )}
      </View>
      <AppText variant="cardTitle" numberOfLines={1} className="mt-0.5">
        {title}
      </AppText>
      {subtitle && (
        <AppText variant="caption" color={theme.textSecondary} numberOfLines={1}>
          {subtitle}
        </AppText>
      )}
    </Pressable>
  );
};
