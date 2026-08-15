import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { View, ScrollView } from "@/tw";

function SafeTabHeight(): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useBottomTabBarHeight } = require("@react-navigation/bottom-tabs");
    return useBottomTabBarHeight();
  } catch {
    return 0;
  }
}

export interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  paddingHorizontal?: number;
  unsafeTop?: boolean;
  unsafeBottom?: boolean;
  hasMiniPlayer?: boolean;
  className?: string;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  header,
  footer,
  paddingHorizontal = Spacing.lg,
  unsafeTop = false,
  unsafeBottom = false,
  hasMiniPlayer = true,
  className = "",
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabHeight = SafeTabHeight();

  const playerOffset = hasMiniPlayer ? 68 : 0;
  const paddingTop = unsafeTop ? 0 : insets.top;
  const paddingBottom = unsafeBottom ? 0 : tabHeight > 0 ? tabHeight + playerOffset : insets.bottom + playerOffset;

  return (
    <View
      className={`flex-1 ${className}`}
      style={[{ backgroundColor: theme.background }, style]}
    >
      {header && <View style={{ paddingTop }}>{header}</View>}
      {scrollable ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            {
              paddingHorizontal,
              paddingTop: header ? Spacing.sm : paddingTop + Spacing.sm,
              paddingBottom,
            },
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          className="flex-1"
          style={[
            {
              paddingHorizontal,
              paddingTop: header ? Spacing.sm : paddingTop + Spacing.sm,
              paddingBottom: footer ? 0 : paddingBottom,
            },
            contentContainerStyle,
          ]}
        >
          {children}
        </View>
      )}
      {footer && <View style={{ paddingBottom: unsafeBottom ? 0 : paddingBottom }}>{footer}</View>}
    </View>
  );
};
