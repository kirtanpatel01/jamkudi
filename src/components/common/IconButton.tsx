import React from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, ColorValue } from "react-native";
import { Icon, IconName } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";

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
      style={({ pressed }) => [
        styles.button,
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

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44, // 44x44 minimum touch target
    alignItems: "center",
    justifyContent: "center",
  },
});
