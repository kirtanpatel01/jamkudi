import React from "react";
import { Text, TextProps, TextStyle } from "react-native";
import { Typography, TypographyVariant, ThemeColors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: keyof ThemeColors | string;
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = "body",
  color,
  style,
  children,
  ...rest
}) => {
  const theme = useTheme();

  let textColor: string = theme.textPrimary;
  if (color) {
    textColor = (color in theme ? theme[color as keyof ThemeColors] : color) as string;
  }

  const typographyStyle = Typography[variant];

  return (
    <Text
      style={[
        {
          fontFamily: typographyStyle.fontFamily,
          fontSize: typographyStyle.fontSize,
          lineHeight: typographyStyle.lineHeight,
          color: textColor,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};
