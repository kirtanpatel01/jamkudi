import React from "react";
import { type ColorValue, type StyleProp, type TextStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export type IconName =
  | "bell"
  | "bell-filled"
  | "clock"
  | "settings"
  | "search"
  | "search-filled"
  | "home"
  | "home-filled"
  | "library"
  | "library-filled"
  | "play"
  | "pause"
  | "devices"
  | "heart"
  | "heart-filled"
  | "music";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  focused?: boolean;
  strokeWidth?: number;
  style?: StyleProp<TextStyle>;
}

type MatName = React.ComponentProps<typeof MaterialIcons>["name"];

const ICON_MAP: Record<IconName, { outline: MatName; filled: MatName }> = {
  bell: { outline: "notifications-none", filled: "notifications" },
  "bell-filled": { outline: "notifications", filled: "notifications" },
  clock: { outline: "history", filled: "history" },
  settings: { outline: "settings", filled: "settings" },
  search: { outline: "search", filled: "search" },
  "search-filled": { outline: "search", filled: "search" },
  home: { outline: "home", filled: "home" },
  "home-filled": { outline: "home", filled: "home" },
  library: { outline: "library-music", filled: "library-music" },
  "library-filled": { outline: "library-music", filled: "library-music" },
  play: { outline: "play-arrow", filled: "play-arrow" },
  pause: { outline: "pause", filled: "pause" },
  devices: { outline: "devices", filled: "devices" },
  heart: { outline: "favorite-border", filled: "favorite" },
  "heart-filled": { outline: "favorite", filled: "favorite" },
  music: { outline: "music-note", filled: "music-note" },
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = "#8B5CF6",
  focused = false,
  style,
}) => {
  const mapping = ICON_MAP[name] || {
    outline: "help-outline",
    filled: "help",
  };
  const iconName = focused ? mapping.filled : mapping.outline;

  return (
    <MaterialIcons
      name={iconName}
      size={size}
      color={color as string}
      style={style}
    />
  );
};
