import React from "react";
import { ActivityIndicator, ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Icon, IconName } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { View, Pressable } from "@/tw";

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

  const heightClass = size === "sm" ? "h-10 px-4" : size === "lg" ? "h-14 px-6" : "h-12 px-5";
  const radiusClass = "rounded-2xl";

  const getVariantClasses = () => {
    if (disabled || loading) {
      if (variant === "primary") return "bg-purple-800/60 opacity-60";
      return "bg-zinc-800/60 opacity-60";
    }

    switch (variant) {
      case "primary":
        return "bg-purple-600 active:bg-purple-700 active:scale-[0.98]";
      case "secondary":
        return theme.isDark
          ? "bg-[#241E34] active:bg-[#312946] active:scale-[0.98]"
          : "bg-purple-100 active:bg-purple-200 active:scale-[0.98]";
      case "outline":
        return theme.isDark
          ? "bg-transparent border border-purple-500/40 active:bg-purple-950/30 active:scale-[0.98]"
          : "bg-transparent border border-purple-300 active:bg-purple-50 active:scale-[0.98]";
      case "ghost":
        return "bg-transparent active:bg-white/10 active:scale-[0.98]";
      default:
        return "bg-purple-600 active:bg-purple-700 active:scale-[0.98]";
    }
  };

  const getTextColorClass = () => {
    if (variant === "primary") return disabled ? "text-purple-300" : "text-white";
    if (disabled) return "text-zinc-500";

    switch (variant) {
      case "secondary":
      case "outline":
      case "ghost":
        return theme.isDark ? "text-white" : "text-zinc-900";
      default:
        return "text-white";
    }
  };

  const textColorClass = getTextColorClass();
  const iconColor =
    variant === "primary"
      ? disabled
        ? "#C084FC"
        : "#FFFFFF"
      : theme.isDark
      ? "#FFFFFF"
      : "#18151D";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading }}
      className={`flex-row items-center justify-center min-w-[80px] ${heightClass} ${radiusClass} ${getVariantClasses()} ${className}`}
      style={[
        variant === "primary" && !disabled && !loading
          ? {
              shadowColor: "#A855F7",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }
          : undefined,
        style,
      ]}
    >
      {loading ? (
        <View className="flex-row items-center justify-center">
          <ActivityIndicator size="small" color={iconColor} className="mr-2" />
          <AppText className={`text-base font-bold text-center ${textColorClass}`}>
            {title}
          </AppText>
        </View>
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon ? (
            <Icon
              name={leftIcon}
              size={size === "sm" ? 18 : 22}
              color={iconColor}
              className="mr-2"
            />
          ) : null}
          <AppText className={`text-base font-bold text-center ${textColorClass}`}>
            {title}
          </AppText>
          {rightIcon ? (
            <Icon
              name={rightIcon}
              size={size === "sm" ? 18 : 22}
              color={iconColor}
              className="ml-2"
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
};
