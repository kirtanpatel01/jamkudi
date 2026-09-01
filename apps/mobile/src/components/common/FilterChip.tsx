import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";
import { Pressable } from "@/tw";

export interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active,
  onPress,
  accessibilityLabel,
  style,
  className = "",
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      accessibilityLabel={accessibilityLabel || `${label} filter`}
      className={`px-4 py-1.5 rounded-full min-h-[32px] items-center justify-center mr-2 ${className}`}
      style={({ pressed }) => [
        {
          backgroundColor: active
            ? theme.primary
            : pressed
            ? theme.surfacePressed
            : theme.surface,
          borderRadius: BorderRadius.full,
        },
        style,
      ]}
    >
      <AppText
        variant="caption"
        color={active ? "onPrimary" : "textSecondary"}
        className={`text-xs ${active ? "font-bold" : "font-medium"}`}
      >
        {label}
      </AppText>
    </Pressable>
  );
};
