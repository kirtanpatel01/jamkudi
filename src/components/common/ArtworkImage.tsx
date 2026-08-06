import React, { useState } from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { Image, ImageStyle } from "expo-image";
import { Icon, IconName } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";

export interface ArtworkImageProps {
  uri?: string | null;
  size?: number;
  width?: number;
  height?: number;
  radius?: number;
  fallbackIcon?: IconName;
  accessibilityLabel?: string;
  style?: StyleProp<ImageStyle>;
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
        style={[
          styles.fallbackContainer,
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
      contentFit="cover"
      transition={200}
      onError={() => setHasError(true)}
    />
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
  },
});
