import React from "react";
import { ActivityIndicator, ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Icon, IconName } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { Pressable } from "@/tw";

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  style,
  className = "",
}) => {
  const theme = useTheme();

  const heightMap = { sm: 40, md: 48, lg: 56 };
  const height = heightMap[size];

  const getBackgroundColor = (pressed: boolean) => {
    if (variant === "primary") {
      if (disabled) return "#6D28D9";
      return pressed ? "#7C3AED" : "#8B5CF6";
    }
    if (disabled) return theme.surface;

    switch (variant) {
      case "secondary":
        return pressed ? theme.surfacePressed : theme.surface;
      case "outline":
      case "ghost":
        return pressed ? theme.surfacePressed : "transparent";
    }
  };

  const getTextColor = () => {
    if (variant === "primary") return "#FFFFFF";
    if (disabled) return theme.textMuted;

    switch (variant) {
      case "secondary":
      case "outline":
      case "ghost":
        return theme.textPrimary;
      default:
        return "#FFFFFF";
    }
  };

  const iconColor = getTextColor();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading }}
      className={`flex-row items-center justify-center min-w-[80px] ${className}`}
      style={({ pressed }) => [
        {
          height,
          backgroundColor: getBackgroundColor(pressed),
          borderColor: variant === "outline" ? theme.border : "transparent",
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderRadius: BorderRadius.lg,
          paddingHorizontal: size === "sm" ? Spacing.md : Spacing.xl,
          opacity: disabled ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <>
          {leftIcon && (
            <Icon
              name={leftIcon}
              size={size === "sm" ? 18 : 22}
              color={iconColor}
              className="mr-2"
            />
          )}
          <AppText
            variant="button"
            className="text-base font-bold text-center"
            style={{ color: iconColor }}
          >
            {title}
          </AppText>
          {rightIcon && (
            <Icon
              name={rightIcon}
              size={size === "sm" ? 18 : 22}
              color={iconColor}
              className="ml-2"
            />
          )}
        </>
      )}
    </Pressable>
  );
};
