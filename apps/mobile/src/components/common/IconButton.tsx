import React from "react";
import { ViewStyle, StyleProp, ColorValue } from "react-native";
import { Icon, IconName } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";
import { Pressable } from "@/tw";

export interface IconButtonProps {
  name: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  color?: ColorValue;
  variant?: "ghost" | "filled" | "subtle";
  disabled?: boolean;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  name,
  onPress,
  accessibilityLabel,
  size = 22,
  color,
  variant = "ghost",
  disabled = false,
  strokeWidth = 2,
  style,
  className = "",
}) => {
  const theme = useTheme();

  const iconColor = color || (variant === "filled" ? theme.onPrimary : theme.textPrimary);

  const getBackgroundColor = (pressed: boolean) => {
    switch (variant) {
      case "filled":
        return pressed ? theme.primaryPressed : theme.primary;
      case "subtle":
        return pressed ? theme.surfacePressed : theme.surface;
      case "ghost":
      default:
        return pressed ? theme.surfacePressed : "transparent";
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={8}
      className={`w-11 h-11 items-center justify-center rounded-full ${className}`}
      style={({ pressed }) => [
        {
          backgroundColor: getBackgroundColor(pressed),
          borderRadius: BorderRadius.full,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Icon name={name} size={size} color={iconColor} strokeWidth={strokeWidth} />
    </Pressable>
  );
};
