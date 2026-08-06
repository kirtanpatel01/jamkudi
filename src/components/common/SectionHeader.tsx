import React from "react";
import { StyleSheet, View, Pressable, ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionText = "See all",
  onActionPress,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <AppText variant="sectionTitle">{title}</AppText>
      {onActionPress && (
        <Pressable
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={`${actionText} for ${title}`}
          hitSlop={8}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <AppText variant="caption" color={theme.primary}>
            {actionText}
          </AppText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
});
