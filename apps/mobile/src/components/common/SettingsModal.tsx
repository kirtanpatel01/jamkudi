import React, { useEffect, useState } from "react";
import { Modal, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { loadSettings, saveSettings } from "@/utils/storage";
import { View, Pressable } from "@/tw";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const theme = useTheme();
  const { showToast } = useToast();
  const { user, profile, signOut } = useAuth();
  const [audioQuality, setAudioQuality] = useState<"320kbps" | "160kbps">("320kbps");

  useEffect(() => {
    if (visible) {
      loadSettings().then((st) => setAudioQuality(st.audioQuality));
    }
  }, [visible]);

  const handleSelectQuality = (quality: "320kbps" | "160kbps") => {
    setAudioQuality(quality);
    saveSettings({ audioQuality: quality });
    showToast(`Audio quality set to ${quality === "320kbps" ? "320 kbps (HD)" : "160 kbps (Data Saver)"}`, "success");
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
    showToast("Signed out successfully", "info");
  };

  const handleEditProfile = () => {
    onClose();
    router.push('/(auth)/onboarding');
  };

  const hasDisplayName = Boolean(profile?.display_name?.trim());
  const hasUsername = Boolean(profile?.username?.trim());
  const hasGenres = (profile?.favorite_genres?.length || 0) > 0;
  const hasArtists = (profile?.favorite_artists?.length || 0) > 0;

  const totalPoints =
    (hasDisplayName ? 25 : 0) +
    (hasUsername ? 25 : 0) +
    (hasGenres ? 25 : 0) +
    (hasArtists ? 25 : 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        className="flex-1 px-6 pt-4 pb-6"
        style={{ backgroundColor: theme.background }}
      >
        {/* Grab Handle Bar */}
        <View className="w-12 h-1.5 rounded-full bg-white/20 self-center mb-4 mt-2" />

        {/* Header */}
        <View className="flex-row items-center justify-between mb-6 pb-4">
          <AppText variant="screenTitle" className="text-2xl font-black tracking-tight">
            Settings & Account
          </AppText>

          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="w-10 h-10 items-center justify-center rounded-full active:opacity-70 active:scale-[0.95]"
            style={{ backgroundColor: theme.surface }}
            accessibilityRole="button"
            accessibilityLabel="Close settings"
          >
            <Icon name="chevron-down" size={22} color={theme.textPrimary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* User Account Card */}
          {user && (
            <View
              className="mb-6 p-4.5 rounded-3xl flex-row items-center justify-between shadow-md"
              style={{ backgroundColor: theme.surface }}
            >
              <View className="flex-1 mr-3">
                <AppText variant="songTitle" color="textPrimary" className="text-base font-black mb-0.5">
                  {profile?.display_name || profile?.username || "Authenticated User"}
                </AppText>
                <AppText variant="caption" color="textSecondary" className="text-xs font-semibold">
                  {user.email}
                </AppText>
                {profile?.username && (
                  <View className="self-start px-2 py-0.5 rounded-md bg-purple-500/15 mt-1.5">
                    <AppText variant="caption" className="text-[11px] text-purple-300 font-extrabold">
                      @{profile.username}
                    </AppText>
                  </View>
                )}
              </View>

              <Pressable
                onPress={handleLogout}
                className="px-4 py-2 rounded-full bg-rose-500/10 active:bg-rose-500/25 active:scale-[0.95] shrink-0"
                accessibilityRole="button"
                accessibilityLabel="Log Out"
              >
                <AppText className="text-xs text-rose-400 font-bold">Log Out</AppText>
              </Pressable>
            </View>
          )}

          {/* Profile Completion Section */}
          {user && (
            <View
              className="mb-8 p-5 rounded-3xl shadow-lg relative overflow-hidden"
              style={{ backgroundColor: theme.isDark ? '#221A35' : theme.surfaceElevated }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <AppText variant="sectionTitle" className="text-base font-extrabold">
                  Profile Completion
                </AppText>
                <AppText variant="caption" className="text-sm font-black text-purple-400">
                  {totalPoints}%
                </AppText>
              </View>

              {/* Progress Bar */}
              <View className="w-full h-2.5 rounded-full overflow-hidden mb-4 bg-black/20">
                <View
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${totalPoints}%` }}
                />
              </View>

              <Pressable
                onPress={handleEditProfile}
                className="w-full py-3 rounded-full bg-purple-600/30 items-center active:bg-purple-600/50 active:scale-[0.985]"
              >
                <AppText className="text-xs font-black text-purple-200 uppercase tracking-wider">
                  {totalPoints === 100 ? "Edit Profile" : "Complete Profile"}
                </AppText>
              </Pressable>
            </View>
          )}

          {/* Streaming Quality Setting */}
          <View className="mb-8">
            <AppText variant="sectionTitle" className="text-base font-extrabold mb-1">
              Audio Streaming Quality
            </AppText>
            <AppText variant="caption" color="textSecondary" className="text-xs font-semibold mb-4">
              Higher quality uses more cellular data
            </AppText>

            <View className="gap-y-3">
              <Pressable
                onPress={() => handleSelectQuality("320kbps")}
                className="flex-row items-center justify-between p-4.5 rounded-2xl active:scale-[0.985] shadow-sm"
                style={
                  audioQuality === "320kbps"
                    ? { backgroundColor: theme.isDark ? '#261D3B' : theme.surfacePressed }
                    : { backgroundColor: theme.surface }
                }
              >
                <View className="flex-1 pr-3">
                  <AppText variant="songTitle" color={audioQuality === "320kbps" ? undefined : 'textPrimary'} className={`text-sm font-black mb-0.5 ${audioQuality === "320kbps" ? "text-purple-300" : ""}`}>
                    High Definition (320 kbps)
                  </AppText>
                  <AppText variant="caption" color="textSecondary" className="text-xs font-medium">
                    Best audio clarity & bass response
                  </AppText>
                </View>

                {audioQuality === "320kbps" && (
                  <View className="w-7 h-7 rounded-full bg-purple-600 items-center justify-center shadow-md">
                    <Icon name="check" size={14} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={() => handleSelectQuality("160kbps")}
                className="flex-row items-center justify-between p-4.5 rounded-2xl active:scale-[0.985] shadow-sm"
                style={
                  audioQuality === "160kbps"
                    ? { backgroundColor: theme.isDark ? '#261D3B' : theme.surfacePressed }
                    : { backgroundColor: theme.surface }
                }
              >
                <View className="flex-1 pr-3">
                  <AppText variant="songTitle" color={audioQuality === "160kbps" ? undefined : 'textPrimary'} className={`text-sm font-black mb-0.5 ${audioQuality === "160kbps" ? "text-purple-300" : ""}`}>
                    Data Saver (160 kbps)
                  </AppText>
                  <AppText variant="caption" color="textSecondary" className="text-xs font-medium">
                    Saves cellular data on mobile networks
                  </AppText>
                </View>

                {audioQuality === "160kbps" && (
                  <View className="w-7 h-7 rounded-full bg-purple-600 items-center justify-center shadow-md">
                    <Icon name="check" size={14} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* App Info Card */}
          <View
            className="mt-2 p-5 rounded-3xl items-center shadow-sm"
            style={{ backgroundColor: theme.surface }}
          >
            <AppText variant="songTitle" className="text-base font-black mb-1">
              Jamkudi Music Player
            </AppText>
            <AppText variant="caption" color="textSecondary" className="text-xs font-semibold">
              Version 1.0.0 • Powered by JioSaavn & Expo 57
            </AppText>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
