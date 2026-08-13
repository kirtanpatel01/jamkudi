import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const memoryStore = new Map<string, string>();

/**
 * Safe storage wrapper around AsyncStorage to prevent crash when AsyncStorage native module is null
 * (e.g., in Expo Go without linked native module or on web).
 */
export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};
