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
  title = "Something went a little wrong",
  message = "Unable to load music. Let's try again in a moment.",
  onRetry,
  style,
  className = "",
}) => {
  const theme = useTheme();

  return (
    <View className={`items-center justify-center p-6 my-4 ${className}`} style={style}>
      <View
        className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
        style={{ backgroundColor: theme.surface }}
      >
        <Icon name="alert-circle" size={26} color="#EFAFC6" />
      </View>
      <AppText variant="sectionTitle" className="text-center text-base font-bold mb-1">
        {title}
      </AppText>
      <AppText variant="body" color="textSecondary" className="text-center text-xs max-w-[260px] mb-5 leading-5">
        {message}
      </AppText>
      {onRetry ? (
        <AppButton
          title="Try Again"
          onPress={onRetry}
          variant="secondary"
          size="md"
          className="min-w-[130px]"
        />
      ) : null}
    </View>
  );
};
