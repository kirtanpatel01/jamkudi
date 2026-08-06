import React from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

export interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active,
  onPress,
  accessibilityLabel,
  style,
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      accessibilityLabel={accessibilityLabel || `${label} filter`}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active
            ? theme.primary
            : pressed
            ? theme.surfacePressed
            : theme.surface,
          borderColor: active ? theme.primary : theme.border,
        },
        style,
      ]}
    >
      <AppText
        variant="caption"
        color={active ? theme.onPrimary : theme.textPrimary}
        style={styles.label}
      >
        {label}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.xs,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
  },
});
