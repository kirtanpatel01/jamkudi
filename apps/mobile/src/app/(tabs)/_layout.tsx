import React from "react";
import { Tabs } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { FontFamily } from "@/constants/theme";
import { Icon } from "@/components/common/Icon";
import { MiniPlayer } from "@/components/common/MiniPlayer";

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.tabActive,
          tabBarInactiveTintColor: theme.tabInactive,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
            elevation: 0,
          },
          tabBarLabelStyle: {
            fontFamily: FontFamily.nunito.bold,
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Icon name="home" size={26} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, focused }) => (
              <Icon name="search" size={26} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Your Library",
            tabBarIcon: ({ color, focused }) => (
              <Icon name="library" size={26} color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
  );
}
