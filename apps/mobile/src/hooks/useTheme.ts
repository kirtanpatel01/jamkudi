import { useColorScheme } from "react-native";
import { Colors } from "@/constants/theme";

export function useTheme() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === "dark" ? "dark" : "light"];

  return {
    ...theme,
    colorScheme: colorScheme === "dark" ? "dark" : "light",
    isDark: colorScheme === "dark",
  };
}
