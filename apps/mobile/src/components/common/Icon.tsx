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
  | "music"
  | "chevron-down"
  | "chevron-left"
  | "skip-back"
  | "skip-forward"
  | "alert-circle"
  | "lock"
  | "eye"
  | "eye-off"
  | "user"
  | "mail"
  | "disc"
  | "check"
  | "x"
  | "shuffle"
  | "repeat"
  | "repeat-one"
  | "plus"
  | "trash"
  | "edit"
  | "chevron-up";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  focused?: boolean;
  strokeWidth?: number;
  style?: StyleProp<TextStyle>;
  className?: string;
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
  "chevron-down": { outline: "keyboard-arrow-down", filled: "keyboard-arrow-down" },
  "chevron-up": { outline: "keyboard-arrow-up", filled: "keyboard-arrow-up" },
  "chevron-left": { outline: "keyboard-arrow-left", filled: "keyboard-arrow-left" },
  "skip-back": { outline: "skip-previous", filled: "skip-previous" },
  "skip-forward": { outline: "skip-next", filled: "skip-next" },
  "alert-circle": { outline: "error-outline", filled: "error" },
  lock: { outline: "lock-outline", filled: "lock" },
  eye: { outline: "visibility", filled: "visibility" },
  "eye-off": { outline: "visibility-off", filled: "visibility-off" },
  user: { outline: "person-outline", filled: "person" },
  mail: { outline: "email", filled: "email" },
  disc: { outline: "album", filled: "album" },
  check: { outline: "check", filled: "check" },
  x: { outline: "close", filled: "close" },
  shuffle: { outline: "shuffle", filled: "shuffle" },
  repeat: { outline: "repeat", filled: "repeat" },
  "repeat-one": { outline: "repeat-one", filled: "repeat-one" },
  plus: { outline: "add", filled: "add" },
  trash: { outline: "delete-outline", filled: "delete" },
  edit: { outline: "edit", filled: "edit" },
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
