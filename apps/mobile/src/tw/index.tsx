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
type LinkProps = React.ComponentPropsWithRef<typeof RouterLink> & { className?: string };
export const Link = React.forwardRef<any, LinkProps>((props, ref) => {
  return useCssElement(RouterLink as any, { ...props, ref }, { className: "style" });
}) as React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<any>> & {
  Trigger: typeof RouterLink.Trigger;
  Menu: typeof RouterLink.Menu;
  MenuAction: typeof RouterLink.MenuAction;
  Preview: typeof RouterLink.Preview;
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
export type ViewProps = React.ComponentPropsWithRef<typeof RNView> & {
  className?: string;
};

export const View = React.forwardRef<RNView, ViewProps>((props, ref) => {
  return useCssElement(RNView as any, { ...props, ref }, { className: "style" });
});
View.displayName = "CSS(View)";

// Text
export const Text = React.forwardRef<
  RNText,
  React.ComponentPropsWithRef<typeof RNText> & { className?: string }
>((props, ref) => {
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
      ref,
      className,
      style: [{ fontFamily }, style, { fontWeight: "normal" }],
    },
    { className: "style" }
  );
});
Text.displayName = "CSS(Text)";

// ScrollView
export const ScrollView = React.forwardRef<
  RNScrollView,
  React.ComponentPropsWithRef<typeof RNScrollView> & {
    className?: string;
    contentContainerClassName?: string;
  }
>((props, ref) => {
  return useCssElement(RNScrollView as any, { ...props, ref }, {
    className: "style",
    contentContainerClassName: "contentContainerStyle",
  });
});
ScrollView.displayName = "CSS(ScrollView)";

// Pressable
export const Pressable = React.forwardRef<
  React.ElementRef<typeof RNPressable>,
  React.ComponentPropsWithRef<typeof RNPressable> & { className?: string }
>((props, ref) => {
  return useCssElement(RNPressable as any, { ...props, ref }, { className: "style" });
});
Pressable.displayName = "CSS(Pressable)";

// TextInput
export const TextInput = React.forwardRef<
  RNTextInput,
  React.ComponentPropsWithRef<typeof RNTextInput> & { className?: string }
>((props, ref) => {
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
      ref,
      className,
      style: [{ fontFamily }, style, { fontWeight: "normal" }],
    },
    { className: "style" }
  );
});
TextInput.displayName = "CSS(TextInput)";

// AnimatedScrollView
export const AnimatedScrollView = React.forwardRef<
  any,
  React.ComponentPropsWithRef<typeof Animated.ScrollView> & {
    className?: string;
    contentClassName?: string;
    contentContainerClassName?: string;
  }
>((props, ref) => {
  return useCssElement(Animated.ScrollView as any, { ...props, ref }, {
    className: "style",
    contentClassName: "contentContainerStyle",
    contentContainerClassName: "contentContainerStyle",
  });
});
AnimatedScrollView.displayName = "CSS(AnimatedScrollView)";

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

export const TouchableHighlight = React.forwardRef<
  React.ElementRef<typeof RNTouchableHighlight>,
  React.ComponentPropsWithRef<typeof RNTouchableHighlight> & { className?: string }
>((props, ref) => {
  return useCssElement(XXTouchableHighlight as any, { ...props, ref }, { className: "style" });
});
TouchableHighlight.displayName = "CSS(TouchableHighlight)";
