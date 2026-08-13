import React, { useState } from "react";
import { Modal } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { View, Pressable } from "@/tw";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const [audioQuality, setAudioQuality] = useState<"320kbps" | "160kbps">("320kbps");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        className="flex-1 px-6 pt-12 pb-6"
        style={{ backgroundColor: theme.background }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8 pb-4 border-b border-white/10">
          <AppText variant="screenTitle" className="text-xl font-bold">
            Settings & Preferences
          </AppText>

          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-white/10"
          >
            <Icon name="chevron-down" size={26} color={theme.textPrimary} />
          </Pressable>
        </View>

        {/* Streaming Quality Setting */}
        <View className="mb-8">
          <AppText variant="sectionTitle" className="text-base font-bold mb-1">
            Audio Streaming Quality
          </AppText>
          <AppText variant="caption" className="text-xs text-zinc-400 font-medium mb-4">
            Higher quality uses more cellular data
          </AppText>

          <View className="gap-y-3">
            <Pressable
              onPress={() => setAudioQuality("320kbps")}
              className={`flex-row items-center justify-between p-4 rounded-2xl border ${
                audioQuality === "320kbps"
                  ? "bg-purple-900/40 border-purple-500"
                  : "bg-white/5 border-white/10"
              } active:opacity-80`}
            >
              <View>
                <AppText variant="songTitle" className="text-sm font-bold mb-0.5">
                  High Definition (320 kbps)
                </AppText>
                <AppText variant="caption" className="text-xs text-zinc-400 font-medium">
                  Best audio clarity & bass response
                </AppText>
              </View>

              {audioQuality === "320kbps" && (
                <Icon name="heart-filled" size={20} color={theme.primary} />
              )}
            </Pressable>

            <Pressable
              onPress={() => setAudioQuality("160kbps")}
              className={`flex-row items-center justify-between p-4 rounded-2xl border ${
                audioQuality === "160kbps"
                  ? "bg-purple-900/40 border-purple-500"
                  : "bg-white/5 border-white/10"
              } active:opacity-80`}
            >
              <View>
                <AppText variant="songTitle" className="text-sm font-bold mb-0.5">
                  Data Saver (160 kbps)
                </AppText>
                <AppText variant="caption" className="text-xs text-zinc-400 font-medium">
                  Saves cellular data on mobile networks
                </AppText>
              </View>

              {audioQuality === "160kbps" && (
                <Icon name="heart-filled" size={20} color={theme.primary} />
              )}
            </Pressable>
          </View>
        </View>

        {/* App Info Card */}
        <View className="mt-auto p-5 rounded-2xl bg-white/5 border border-white/10 items-center">
          <AppText variant="songTitle" className="text-base font-bold mb-1">
            Jamkudi Music Player
          </AppText>
          <AppText variant="caption" className="text-xs text-zinc-400 font-medium">
            Version 1.0.0 • Powered by JioSaavn & Expo 57
          </AppText>
        </View>
      </View>
    </Modal>
  );
};
