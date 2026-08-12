import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { AppButton } from "@/components/common/AppButton";
import { useTheme } from "@/hooks/useTheme";
import { View } from "@/tw";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "Unable to load data. Please check your connection and try again.",
  onRetry,
  style,
  className = "",
}) => {
  const theme = useTheme();

  return (
    <View className={`items-center justify-center p-8 my-6 ${className}`} style={style}>
      <View
        className="w-16 h-16 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: theme.surface }}
      >
        <Icon name="bell" size={32} color={theme.error} />
      </View>
      <AppText variant="sectionTitle" className="text-center mb-1">
        {title}
      </AppText>
      <AppText variant="body" color={theme.textSecondary} className="text-center mb-6">
        {message}
      </AppText>
      {onRetry && (
        <AppButton
          title="Try Again"
          onPress={onRetry}
          variant="outline"
          size="md"
          className="min-w-[120px]"
        />
      )}
    </View>
  );
};
