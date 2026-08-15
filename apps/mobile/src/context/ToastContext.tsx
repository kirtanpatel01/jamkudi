import React, { createContext, useContext, useState, useCallback } from "react";
import { Animated, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/common/Icon";
import { AppText } from "@/components/common/AppText";
import { View } from "@/tw";

export type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function decodeText(str: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-20));

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString();
      setToast({ id, message: decodeText(message), type });

      fadeAnim.setValue(0);
      translateY.setValue(-20);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            friction: 7,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2400),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -15,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setToast((current) => (current?.id === id ? null : current));
      });
    },
    [fadeAnim, translateY]
  );

  const getIconDetails = (type: ToastType) => {
    switch (type) {
      case "success":
        return { name: "check" as const, color: "#34D399" }; // Emerald 400
      case "error":
        return { name: "alert-circle" as const, color: "#F87171" }; // Red 400
      default:
        return { name: "music" as const, color: "#C084FC" }; // Purple 400
    }
  };

  const iconDetails = toast ? getIconDetails(toast.type) : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && iconDetails && (
        <Animated.View
          style={[
            styles.container,
            {
              top: Math.max(insets.top + 8, 16),
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
          pointerEvents="none"
        >
          <View
            className="flex-row items-center px-5 py-3 rounded-full border border-purple-500/30 shadow-2xl bg-[#231D33]"
            style={{
              shadowColor: "#A855F7",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Icon
              name={iconDetails.name}
              size={18}
              color={iconDetails.color}
            />
            <AppText variant="body" className="ml-2.5 text-xs font-bold text-white tracking-wide">
              {toast.message}
            </AppText>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: "center",
  },
});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
