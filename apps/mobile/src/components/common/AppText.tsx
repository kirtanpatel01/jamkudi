import React from "react";
import { TextProps, TextStyle } from "react-native";
import { Typography, TypographyVariant, ThemeColors, FontFamily } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Text } from "@/tw";

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: keyof ThemeColors | string;
  style?: TextStyle | TextStyle[];
  className?: string;
  children?: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = "body",
  color,
  style,
  className = "",
  children,
  ...rest
}) => {
  const theme = useTheme();

  let textColor: string = theme.textPrimary;
  if (color) {
    textColor = (color in theme ? theme[color as keyof ThemeColors] : color) as string;
  }

  const typographyStyle = Typography[variant];

  // Determine if Fredoka or Nunito
  const isFredoka =
    variant === "screenTitle" ||
    variant === "sectionTitle" ||
    className.includes("font-fredoka");

  let resolvedFontFamily: string = typographyStyle.fontFamily;

  if (isFredoka) {
    if (className.includes("font-bold") || className.includes("font-extrabold") || className.includes("font-black")) {
      resolvedFontFamily = FontFamily.fredoka.bold;
    } else if (className.includes("font-semibold")) {
      resolvedFontFamily = FontFamily.fredoka.semiBold;
    } else if (className.includes("font-medium")) {
      resolvedFontFamily = FontFamily.fredoka.medium;
    } else if (className.includes("font-normal") || className.includes("font-regular")) {
      resolvedFontFamily = FontFamily.fredoka.regular;
    }
  } else {
    if (className.includes("font-bold") || className.includes("font-extrabold") || className.includes("font-black")) {
      resolvedFontFamily = FontFamily.nunito.bold;
    } else if (className.includes("font-semibold")) {
      resolvedFontFamily = FontFamily.nunito.semiBold;
    } else if (className.includes("font-medium")) {
      resolvedFontFamily = FontFamily.nunito.medium;
    } else if (className.includes("font-normal") || className.includes("font-regular")) {
      resolvedFontFamily = FontFamily.nunito.regular;
    }
  }

  return (
    <Text
      className={className}
      style={[
        {
          fontSize: typographyStyle.fontSize,
          lineHeight: typographyStyle.lineHeight,
          color: textColor,
        },
        style,
        {
          fontFamily: resolvedFontFamily,
          fontWeight: "normal",
        },
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};
