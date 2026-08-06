import React from "react";
import { StyleSheet, View, Pressable, ViewStyle, StyleProp } from "react-native";
import { AppText } from "@/components/common/AppText";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

export interface MediaCardProps {
  title: string;
  subtitle?: string;
  artworkUri?: string | null;
  badge?: string;
  onPress: () => void;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  title,
  subtitle,
  artworkUri,
  badge,
  onPress,
  width = 140,
  height = 140,
  style,
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ""}`}
      style={({ pressed }) => [
        styles.container,
        {
          width,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View style={styles.imageWrapper}>
        <ArtworkImage
          uri={artworkUri}
          width={width}
          height={height}
          radius={BorderRadius.lg}
          accessibilityLabel={`${title} artwork`}
        />
        {badge && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <AppText variant="caption" color={theme.onPrimary} style={styles.badgeText}>
              {badge}
            </AppText>
          </View>
        )}
      </View>
      <AppText variant="cardTitle" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
      {subtitle && (
        <AppText variant="caption" color={theme.textSecondary} numberOfLines={1}>
          {subtitle}
        </AppText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.md,
  },
  imageWrapper: {
    position: "relative",
    marginBottom: Spacing.xs,
  },
  badge: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
  title: {
    marginTop: 2,
  },
});
