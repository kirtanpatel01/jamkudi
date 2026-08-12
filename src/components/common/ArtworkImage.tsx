import React, { useState } from "react";
import { ViewStyle, StyleProp, ImageStyle } from "react-native";
import { Icon, IconName } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";
import { View } from "@/tw";
import { Image } from "@/tw/image";

export interface ArtworkImageProps {
  uri?: string | null;
  size?: number;
  width?: number;
  height?: number;
  radius?: number;
  fallbackIcon?: IconName;
  accessibilityLabel?: string;
  style?: StyleProp<ImageStyle>;
  className?: string;
}

export const ArtworkImage: React.FC<ArtworkImageProps> = ({
  uri,
  size = 56,
  width,
  height,
  radius = BorderRadius.md,
  fallbackIcon = "music",
  accessibilityLabel = "Album Artwork",
  style,
  className = "",
}) => {
  const theme = useTheme();
  const [hasError, setHasError] = useState(false);

  const w = width ?? size;
  const h = height ?? size;
  const iconSize = Math.max(16, Math.floor(Math.min(w, h) * 0.45));

  if (!uri || hasError) {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="image"
        className={`items-center justify-center border-[0.5px] ${className}`}
        style={[
          {
            width: w,
            height: h,
            borderRadius: radius,
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
          },
          style as StyleProp<ViewStyle>,
        ]}
      >
        <Icon name={fallbackIcon} size={iconSize} color={theme.textMuted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      className={className}
      style={[
        {
          width: w,
          height: h,
          borderRadius: radius,
          backgroundColor: theme.surface,
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      onError={() => setHasError(true)}
    />
  );
};
