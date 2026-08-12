import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/common/Icon";
import { AppText } from "@/components/common/AppText";
import { View, Pressable } from "@/tw";

export const HomeHeader: React.FC = () => {
  const theme = useTheme();

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning Ji ❤️";
    if (hours < 18) return "Good Afternoon Ji 😏";
    return "Good Evening Ji 😌";
  };

  return (
    <View className="flex-row justify-between items-end mb-5 mt-0">
      <View>
        <AppText
          variant="screenTitle"
          className="text-2xl tracking-tight"
          style={{ color: theme.text }}
        >
          {getGreeting()}
        </AppText>
      </View>

      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          className="w-9 h-9 rounded-full items-center justify-center active:bg-zinc-200 dark:active:bg-zinc-800"
          hitSlop={8}
        >
          <Icon name="bell" size={24} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Listening History"
          className="w-9 h-9 rounded-full items-center justify-center active:bg-zinc-200 dark:active:bg-zinc-800"
          hitSlop={8}
        >
          <Icon name="clock" size={24} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          className="w-9 h-9 rounded-full items-center justify-center active:bg-zinc-200 dark:active:bg-zinc-800"
          hitSlop={8}
        >
          <Icon name="settings" size={24} color={theme.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
};
