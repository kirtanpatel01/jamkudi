import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Icon, IconName } from "@/components/common/Icon";
import { AppButton } from "@/components/common/AppButton";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: IconName;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = "music",
  actionTitle,
  onActionPress,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWrapper, { backgroundColor: theme.surface }]}>
        <Icon name={icon} size={36} color={theme.primary} />
      </View>
      <AppText variant="sectionTitle" style={styles.title}>
        {title}
      </AppText>
      {message && (
        <AppText
          variant="body"
          color={theme.textSecondary}
          style={styles.message}
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
    width: 72,
    height: 72,
    borderRadius: 36,
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
    marginTop: Spacing.xs,
  },
});
