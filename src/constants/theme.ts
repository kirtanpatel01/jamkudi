export const Colors = {
  light: {
    background: "#FAF9FC",
    surface: "#F3F0F8",
    surfaceElevated: "#FFFFFF",
    surfacePressed: "#E9E4F2",

    primary: "#8B5CF6",
    primaryPressed: "#7C3AED",
    primarySubtle: "#EDE9FE",
    onPrimary: "#FFFFFF",

    textPrimary: "#18151D",
    textSecondary: "#77717F",
    textMuted: "#A19AA8",
    textInverse: "#FFFFFF",

    // Backwards-compatibility aliases
    text: "#18151D",
    icon: "#77717F",

    border: "#E9E5ED",
    divider: "#F0ECEF",

    favorite: "#F43F5E",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",

    tabActive: "#8B5CF6",
    tabInactive: "#A19AA8",
    tabIconSelected: "#8B5CF6",
    tabIconDefault: "#A19AA8",

    skeletonBase: "#E5E1EC",
    skeletonHighlight: "#F5F3F9",
  },

  dark: {
    background: "#0F0D15",
    surface: "#1A1723",
    surfaceElevated: "#242030",
    surfacePressed: "#2F2B3E",

    primary: "#A78BFA",
    primaryPressed: "#8B5CF6",
    primarySubtle: "#2E2648",
    onPrimary: "#0F0D15",

    textPrimary: "#F3F0F8",
    textSecondary: "#A19AA8",
    textMuted: "#77717F",
    textInverse: "#18151D",

    // Backwards-compatibility aliases
    text: "#F3F0F8",
    icon: "#A19AA8",

    border: "#2E2A3A",
    divider: "#262232",

    favorite: "#F43F5E",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",

    tabActive: "#A78BFA",
    tabInactive: "#77717F",
    tabIconSelected: "#A78BFA",
    tabIconDefault: "#77717F",

    skeletonBase: "#242030",
    skeletonHighlight: "#322D42",
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
    fontSize: 14,
    lineHeight: 18,
  },
  caption: {
    fontFamily: FontFamily.nunito.medium,
    fontSize: 12,
    lineHeight: 16,
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
