import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/hooks/useTheme";
import { View, Pressable } from "@/tw";

export interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionText = "See all",
  onActionPress,
  style,
  className = "",
}) => {
  const theme = useTheme();

  return (
    <View className={`flex-row items-center justify-between mb-2 mt-4 ${className}`} style={style}>
      <AppText variant="sectionTitle">{title}</AppText>
      {onActionPress && (
        <Pressable
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={`${actionText} for ${title}`}
          hitSlop={8}
          className="active:opacity-70"
        >
          <AppText variant="caption" color={theme.primary}>
            {actionText}
          </AppText>
        </Pressable>
      )}
    </View>
  );
};
