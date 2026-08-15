import React, { useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Image, ImageProps } from "expo-image";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";

interface ArtworkImageProps extends Omit<ImageProps, "source"> {
  uri?: string | null;
  size?: number;
  width?: number;
  height?: number;
  iconSize?: number;
  radius?: number;
  className?: string;
  style?: any;
}

const absoluteFill = StyleSheet.absoluteFill || {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

export const ArtworkImage: React.FC<ArtworkImageProps> = ({
  uri,
  size,
  width,
  height,
  iconSize = 24,
  radius,
  style,
  className = "",
  ...props
}) => {
  const theme = useTheme();
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sanitizedUri =
    typeof uri === "string" && uri.trim().length > 0
      ? uri.trim().replace(/^http:\/\//i, "https://")
      : "";

  if (!sanitizedUri || hasError) {
    return (
      <View
        className={`items-center justify-center bg-purple-950/60 ${className}`}
        style={[{ width: width || "100%", height: height || "100%" }, style]}
      >
        <Icon name="music" size={iconSize} color={theme.primary} />
      </View>
    );
  }

  return (
    <View
      className={`relative overflow-hidden ${className}`}
      style={[{ width: width || "100%", height: height || "100%" }, style]}
    >
      {isLoading && (
        <View
          style={absoluteFill as any}
          className="items-center justify-center bg-purple-950/40 z-10"
        >
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      )}

      <Image
        source={{ uri: sanitizedUri }}
        style={absoluteFill as any}
        contentFit="cover"
        transition={150}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        {...props}
      />
    </View>
  );
};
