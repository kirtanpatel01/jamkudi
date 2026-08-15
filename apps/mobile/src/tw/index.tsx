import {
  useCssElement,
  useNativeVariable as useFunctionalVariable,
} from "react-native-css";

import { Link as RouterLink } from "expo-router";
import Animated from "react-native-reanimated";
import React from "react";
import {
  View as RNView,
  Text as RNText,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  TouchableHighlight as RNTouchableHighlight,
  TextInput as RNTextInput,
  StyleSheet,
} from "react-native";

// CSS-enabled Link
export const Link = (
  props: React.ComponentProps<typeof RouterLink> & { className?: string }
) => {
  return useCssElement(RouterLink as any, props, { className: "style" });
};

Link.Trigger = RouterLink.Trigger;
Link.Menu = RouterLink.Menu;
Link.MenuAction = RouterLink.MenuAction;
Link.Preview = RouterLink.Preview;

// CSS Variable hook
export const useCSSVariable =
  process.env.EXPO_OS !== "web"
    ? useFunctionalVariable
    : (variable: string) => `var(${variable})`;

// View
export type ViewProps = React.ComponentProps<typeof RNView> & {
  className?: string;
};

export const View = (props: ViewProps) => {
  return useCssElement(RNView as any, props, { className: "style" });
};
View.displayName = "CSS(View)";

// Text
export const Text = (
  props: React.ComponentProps<typeof RNText> & { className?: string }
) => {
  const { className = "", style, ...rest } = props;

  let fontFamily = "Nunito_400Regular";
  const isFredoka = className.includes("font-fredoka");

  if (isFredoka) {
    if (className.includes("font-bold") || className.includes("font-extrabold") || className.includes("font-black")) {
      fontFamily = "Fredoka_700Bold";
    } else if (className.includes("font-semibold")) {
      fontFamily = "Fredoka_600SemiBold";
    } else if (className.includes("font-medium")) {
      fontFamily = "Fredoka_500Medium";
    } else {
      fontFamily = "Fredoka_400Regular";
    }
  } else {
    if (className.includes("font-bold") || className.includes("font-extrabold") || className.includes("font-black")) {
      fontFamily = "Nunito_700Bold";
    } else if (className.includes("font-semibold")) {
      fontFamily = "Nunito_600SemiBold";
    } else if (className.includes("font-medium")) {
      fontFamily = "Nunito_500Medium";
    } else {
      fontFamily = "Nunito_400Regular";
    }
  }

  return useCssElement(
    RNText as any,
    {
      ...rest,
      className,
      style: [{ fontFamily }, style, { fontWeight: "normal" }],
    },
    { className: "style" }
  );
};
Text.displayName = "CSS(Text)";

// ScrollView
export const ScrollView = (
  props: React.ComponentProps<typeof RNScrollView> & {
    className?: string;
    contentContainerClassName?: string;
  }
) => {
  return useCssElement(RNScrollView as any, props, {
    className: "style",
    contentContainerClassName: "contentContainerStyle",
  });
};
ScrollView.displayName = "CSS(ScrollView)";

// Pressable
export const Pressable = (
  props: React.ComponentProps<typeof RNPressable> & { className?: string }
) => {
  return useCssElement(RNPressable as any, props, { className: "style" });
};
Pressable.displayName = "CSS(Pressable)";

// TextInput
export const TextInput = (
  props: React.ComponentProps<typeof RNTextInput> & { className?: string }
) => {
  const { className = "", style, ...rest } = props;

  let fontFamily = "Nunito_400Regular";
  if (className.includes("font-bold") || className.includes("font-extrabold") || className.includes("font-black")) {
    fontFamily = "Nunito_700Bold";
  } else if (className.includes("font-semibold")) {
    fontFamily = "Nunito_600SemiBold";
  } else if (className.includes("font-medium")) {
    fontFamily = "Nunito_500Medium";
  }

  return useCssElement(
    RNTextInput as any,
    {
      ...rest,
      className,
      style: [{ fontFamily }, style, { fontWeight: "normal" }],
    },
    { className: "style" }
  );
};
TextInput.displayName = "CSS(TextInput)";

// AnimatedScrollView
export const AnimatedScrollView = (
  props: React.ComponentProps<typeof Animated.ScrollView> & {
    className?: string;
    contentClassName?: string;
    contentContainerClassName?: string;
  }
) => {
  return useCssElement(Animated.ScrollView as any, props, {
    className: "style",
    contentClassName: "contentContainerStyle",
    contentContainerClassName: "contentContainerStyle",
  });
};

// TouchableHighlight with underlayColor extraction
function XXTouchableHighlight(
  props: React.ComponentProps<typeof RNTouchableHighlight>
) {
  const { underlayColor, ...style } =
    (StyleSheet.flatten(props.style) as any) || {};
  return (
    <RNTouchableHighlight
      underlayColor={underlayColor}
      {...props}
      style={style}
    />
  );
}

export const TouchableHighlight = (
  props: React.ComponentProps<typeof RNTouchableHighlight>
) => {
  return useCssElement(XXTouchableHighlight as any, props, { className: "style" });
};
TouchableHighlight.displayName = "CSS(TouchableHighlight)";
