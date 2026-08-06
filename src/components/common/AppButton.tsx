import React from "react";
import {
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from "react-native";
import { AppText } from "@/components/common/AppText";
import { Icon, IconName } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

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
}) => {
  const theme = useTheme();

  const heightMap = { sm: 36, md: 44, lg: 52 };
  const height = heightMap[size];

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return theme.surface;
    switch (variant) {
      case "primary":
        return pressed ? theme.primaryPressed : theme.primary;
      case "secondary":
        return pressed ? theme.surfacePressed : theme.surface;
      case "outline":
      case "ghost":
        return pressed ? theme.surfacePressed : "transparent";
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.textMuted;
    switch (variant) {
      case "primary":
        return theme.onPrimary;
      case "secondary":
      case "outline":
      case "ghost":
        return theme.textPrimary;
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
      style={({ pressed }) => [
        styles.button,
        {
          height,
          backgroundColor: getBackgroundColor(pressed),
          borderColor: variant === "outline" ? theme.border : "transparent",
          borderWidth: variant === "outline" ? 1 : 0,
          borderRadius: BorderRadius.md,
          paddingHorizontal: size === "sm" ? Spacing.md : Spacing.lg,
          opacity: disabled ? 0.6 : 1,
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
              size={size === "sm" ? 16 : 20}
              color={iconColor}
              style={styles.leftIcon}
            />
          )}
          <AppText
            variant="button"
            style={{ color: iconColor }}
          >
            {title}
          </AppText>
          {rightIcon && (
            <Icon
              name={rightIcon}
              size={size === "sm" ? 16 : 20}
              color={iconColor}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    minHeight: 44, // 44pt touch target minimum
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
});
