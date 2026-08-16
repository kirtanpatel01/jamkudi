export const Colors = {
  light: {
    background: "#FCFAF7",
    surface: "#F6F2ED",
    surfaceElevated: "#FFFFFF",
    surfacePressed: "#EEE9E3",

    primary: "#9B7CFF",
    primaryPressed: "#8062E8",
    primarySubtle: "rgba(155, 124, 255, 0.12)",
    onPrimary: "#FFFFFF",

    textPrimary: "#202033",
    textSecondary: "#5F5B69",
    textMuted: "#92909A",
    textInverse: "#FCFAF7",

    // Backwards-compatibility aliases
    text: "#202033",
    icon: "#5F5B69",

    border: "#EEE9E3",
    divider: "#F6F2ED",

    favorite: "#EFAFC6",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",

    tabActive: "#9B7CFF",
    tabInactive: "#92909A",
    tabIconSelected: "#9B7CFF",
    tabIconDefault: "#92909A",

    skeletonBase: "#EEE9E3",
    skeletonHighlight: "#F6F2ED",
  },

  dark: {
    background: "#111322",
    surface: "#171A2B",
    surfaceElevated: "#20243A",
    surfacePressed: "#2A304D",

    primary: "#9B7CFF",
    primaryPressed: "#8062E8",
    primarySubtle: "rgba(155, 124, 255, 0.18)",
    onPrimary: "#FFFFFF",

    textPrimary: "#F5F2EE",
    textSecondary: "#C8C5CD",
    textMuted: "#92909A",
    textInverse: "#111322",

    // Backwards-compatibility aliases
    text: "#F5F2EE",
    icon: "#C8C5CD",

    border: "#262B45",
    divider: "#1B1F34",

    favorite: "#EFAFC6",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",

    tabActive: "#B69AFF",
    tabInactive: "#92909A",
    tabIconSelected: "#B69AFF",
    tabIconDefault: "#92909A",

    skeletonBase: "#171A2B",
    skeletonHighlight: "#20243A",
  },
} as const;

export type ThemeColors = typeof Colors.light;

export const FontFamily = {
  fredoka: {
    regular: "Fredoka_400Regular",
    medium: "Fredoka_500Medium",
    semiBold: "Fredoka_600SemiBold",
    bold: "Fredoka_700Bold",
  },
  nunito: {
    regular: "Nunito_400Regular",
    medium: "Nunito_500Medium",
    semiBold: "Nunito_600SemiBold",
    bold: "Nunito_700Bold",
  },
} as const;

// Alias for backwards compatibility
export const Fonts = FontFamily;

export const Typography = {
  screenTitle: {
    fontFamily: FontFamily.fredoka.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  sectionTitle: {
    fontFamily: FontFamily.fredoka.semiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  cardTitle: {
    fontFamily: FontFamily.nunito.semiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  songTitle: {
    fontFamily: FontFamily.nunito.semiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  artist: {
    fontFamily: FontFamily.nunito.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  body: {
    fontFamily: FontFamily.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    fontFamily: FontFamily.nunito.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  caption: {
    fontFamily: FontFamily.nunito.medium,
    fontSize: 13,
    lineHeight: 18,
  },
} as const;

export type TypographyVariant = keyof typeof Typography;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BorderRadius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
