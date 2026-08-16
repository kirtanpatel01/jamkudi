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
      if (variant === "primary") return "bg-purple-500/40 opacity-60";
      return "bg-neutral-800/40 opacity-60";
    }

    switch (variant) {
      case "primary":
        return "bg-[#9B7CFF] active:bg-[#8062E8] active:scale-[0.98]";
      case "secondary":
        return theme.isDark
          ? "bg-[#171A2B] active:bg-[#20243A] active:scale-[0.98] border border-[#262B45]"
          : "bg-[#F6F2ED] active:bg-[#EEE9E3] active:scale-[0.98] border border-[#EEE9E3]";
      case "outline":
        return theme.isDark
          ? "bg-transparent border border-[#262B45] active:bg-[#171A2B] active:scale-[0.98]"
          : "bg-transparent border border-[#EEE9E3] active:bg-[#F6F2ED] active:scale-[0.98]";
      case "ghost":
        return "bg-transparent active:bg-purple-500/10 active:scale-[0.98]";
      default:
        return "bg-[#9B7CFF] active:bg-[#8062E8] active:scale-[0.98]";
    }
  };

  const getTextColorClass = () => {
    if (variant === "primary") return "text-white font-bold";
    if (disabled) return "text-neutral-500";

    switch (variant) {
      case "secondary":
      case "outline":
      case "ghost":
        return theme.isDark ? "text-[#F5F2EE]" : "text-[#202033]";
      default:
        return "text-white";
    }
  };

  const textColorClass = getTextColorClass();
  const iconColor =
    variant === "primary"
      ? "#FFFFFF"
      : theme.isDark
      ? "#F5F2EE"
      : "#202033";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading }}
      className={`flex-row items-center justify-center min-w-[80px] ${heightClass} ${radiusClass} ${getVariantClasses()} ${className}`}
      style={[style]}
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
