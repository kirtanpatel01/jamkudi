import React, { useEffect } from "react";
import { ViewStyle, StyleProp } from "react-native";
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";
import { Animated } from "@/tw/animated";

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  radius = BorderRadius.sm,
  style,
  className = "",
}) => {
  const theme = useTheme();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.ease }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={`overflow-hidden ${className}`}
      style={[
        {
          width: width as number,
          height,
          borderRadius: radius,
          backgroundColor: theme.skeletonBase,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};
