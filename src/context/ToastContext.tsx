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

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString();
      setToast({ id, message, type });

      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(2200),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToast((current) => (current?.id === id ? null : current));
      });
    },
    [fadeAnim]
  );

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "#059669"; // Emerald 600
      case "error":
        return "#DC2626"; // Red 600
      default:
        return "#4B5563"; // Zinc 600
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <Animated.View
          style={[
            styles.container,
            {
              top: Math.max(insets.top + 8, 16),
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <View
            className="flex-row items-center px-4 py-3 rounded-2xl shadow-xl border border-white/10"
            style={{ backgroundColor: getBgColor(toast.type) }}
          >
            <Icon
              name={
                toast.type === "success"
                  ? "heart-filled"
                  : toast.type === "error"
                  ? "bell"
                  : "music"
              }
              size={18}
              color="#FFFFFF"
            />
            <AppText variant="body" className="ml-2.5 text-xs font-bold text-white">
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
