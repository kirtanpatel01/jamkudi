import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  ViewStyle,
  StyleProp,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

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
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabHeight = SafeTabHeight();

  const paddingTop = unsafeTop ? 0 : insets.top;
  // If tabHeight > 0, bottom tab bar already handles bottom inset; otherwise use insets.bottom
  const paddingBottom = unsafeBottom ? 0 : tabHeight > 0 ? tabHeight + 68 : insets.bottom + 68;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }, style]}>
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
          style={[
            styles.flex,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
