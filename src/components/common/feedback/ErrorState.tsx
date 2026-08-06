import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { AppButton } from "@/components/common/AppButton";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "Unable to load data. Please check your connection and try again.",
  onRetry,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWrapper, { backgroundColor: theme.surface }]}>
        <Icon name="bell" size={32} color={theme.error} />
      </View>
      <AppText variant="sectionTitle" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="body" color={theme.textSecondary} style={styles.message}>
        {message}
      </AppText>
      {onRetry && (
        <AppButton
          title="Try Again"
          onPress={onRetry}
          variant="outline"
          size="md"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
    marginVertical: Spacing.xl,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  message: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  button: {
    minWidth: 120,
  },
});
