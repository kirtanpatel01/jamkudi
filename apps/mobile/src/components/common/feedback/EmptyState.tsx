import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Icon, IconName } from "@/components/common/Icon";
import { AppButton } from "@/components/common/AppButton";
import { JamkudiMascot } from "@/components/common/JamkudiMascot";
import { useTheme } from "@/hooks/useTheme";
import { View } from "@/tw";

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: IconName;
  showMascot?: boolean;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = "music",
  showMascot = true,
  actionTitle,
  onActionPress,
  style,
  className = "",
}) => {
  const theme = useTheme();

  return (
    <View className={`items-center justify-center p-6 my-4 ${className}`} style={style}>
      {showMascot ? (
        <JamkudiMascot size={72} moodBadge="cozy space" className="mb-4" />
      ) : (
        <View
          className="w-16 h-16 rounded-2xl items-center justify-center mb-4 border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <Icon name={icon} size={28} color={theme.primary} />
        </View>
      )}

      <AppText variant="sectionTitle" className="text-center text-lg font-bold mb-1">
        {title}
      </AppText>

      {message ? (
        <AppText
          variant="body"
          color="textSecondary"
          className="text-center text-xs max-w-[260px] mb-5 leading-5"
        >
          {message}
        </AppText>
      ) : null}

      {actionTitle && onActionPress ? (
        <AppButton
          title={actionTitle}
          onPress={onActionPress}
          variant="primary"
          size="md"
          className="min-w-[140px]"
        />
      ) : null}
    </View>
  );
};
