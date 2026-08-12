import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Icon, IconName } from "@/components/common/Icon";
import { AppButton } from "@/components/common/AppButton";
import { useTheme } from "@/hooks/useTheme";
import { View } from "@/tw";

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: IconName;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = "music",
  actionTitle,
  onActionPress,
  style,
  className = "",
}) => {
  const theme = useTheme();

  return (
    <View className={`items-center justify-center p-8 my-6 ${className}`} style={style}>
      <View
        className="w-[72px] h-[72px] rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: theme.surface }}
      >
        <Icon name={icon} size={36} color={theme.primary} />
      </View>
      <AppText variant="sectionTitle" className="text-center mb-1">
        {title}
      </AppText>
      {message && (
        <AppText
          variant="body"
          color={theme.textSecondary}
          className="text-center mb-6"
        >
          {message}
        </AppText>
      )}
      {actionTitle && onActionPress && (
        <AppButton
          title={actionTitle}
          onPress={onActionPress}
          variant="primary"
          size="md"
          className="mt-1"
        />
      )}
    </View>
  );
};
