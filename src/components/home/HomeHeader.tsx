import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Fonts } from "@/constants/theme";
import { Icon } from "@/components/common/Icon";

export const HomeHeader: React.FC = () => {
  const theme = useTheme();

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={styles.header}>
      <View>
        <View style={styles.brandRow}>
          <Text style={[styles.brandText, { color: theme.primary }]}>
            JAMKUDI
          </Text>
          <View style={[styles.brandDot, { backgroundColor: theme.favorite }]} />
        </View>
        <Text style={[styles.greetingText, { color: theme.text }]}>
          {getGreeting()}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: pressed
                ? theme.surface
                : "transparent",
            },
          ]}
          hitSlop={8}
        >
          <Icon name="bell" size={24} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Listening History"
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: pressed
                ? theme.surface
                : "transparent",
            },
          ]}
          hitSlop={8}
        >
          <Icon name="clock" size={24} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: pressed
                ? theme.surface
                : "transparent",
            },
          ]}
          hitSlop={8}
        >
          <Icon name="settings" size={24} color={theme.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    marginTop: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  brandText: {
    fontFamily: Fonts.fredoka.bold,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 4,
  },
  greetingText: {
    fontFamily: Fonts.fredoka.semiBold,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
