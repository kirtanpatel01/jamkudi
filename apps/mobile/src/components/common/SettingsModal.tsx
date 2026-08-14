import React, { useEffect, useState } from "react";
import { Modal, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { AppText } from "@/components/common/AppText";
import { AppButton } from "@/components/common/AppButton";
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

  // Profile completion calculation
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
        className="flex-1 px-6 pt-12 pb-6"
        style={{ backgroundColor: theme.background }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6 pb-4 border-b border-white/10">
          <AppText variant="screenTitle" className="text-xl font-bold">
            Settings & Account
          </AppText>

          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-white/10"
          >
            <Icon name="chevron-down" size={26} color={theme.textPrimary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* User Account Card */}
          {user && (
            <View className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <AppText variant="songTitle" className="text-base font-bold mb-0.5">
                  {profile?.display_name || profile?.username || "Authenticated User"}
                </AppText>
                <AppText variant="caption" className="text-xs text-zinc-400 font-medium">
                  {user.email}
                </AppText>
                {profile?.username && (
                  <AppText variant="caption" className="text-[11px] text-purple-400 font-semibold mt-0.5">
                    @{profile.username}
                  </AppText>
                )}
              </View>

              <AppButton
                title="Log Out"
                onPress={handleLogout}
                variant="outline"
                size="sm"
                className="border-red-500/30"
              />
            </View>
          )}

          {/* Profile Completion Section */}
          {user && (
            <View className="mb-8 p-5 rounded-3xl bg-purple-950/30 border border-purple-500/25">
              <View className="flex-row items-center justify-between mb-2">
                <AppText variant="sectionTitle" className="text-base font-bold text-white">
                  Profile Completion
                </AppText>
                <AppText variant="caption" className="text-sm font-extrabold text-purple-400">
                  {totalPoints}%
                </AppText>
              </View>

              {/* Progress Bar */}
              <View className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-4">
                <View
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${totalPoints}%` }}
                />
              </View>

              {/* Field Checklist */}
              <View className="gap-y-2 mb-4">
                <View className="flex-row items-center justify-between">
                  <AppText variant="caption" className="text-xs font-medium text-zinc-300">
                    Display name
                  </AppText>
                  <AppText className={`text-xs font-bold ${hasDisplayName ? 'text-green-400' : 'text-zinc-500'}`}>
                    {hasDisplayName ? '✓' : '○'}
                  </AppText>
                </View>

                <View className="flex-row items-center justify-between">
                  <AppText variant="caption" className="text-xs font-medium text-zinc-300">
                    Username
                  </AppText>
                  <AppText className={`text-xs font-bold ${hasUsername ? 'text-green-400' : 'text-zinc-500'}`}>
                    {hasUsername ? '✓' : '○'}
                  </AppText>
                </View>

                <View className="flex-row items-center justify-between">
                  <AppText variant="caption" className="text-xs font-medium text-zinc-300">
                    Favorite genres
                  </AppText>
                  <AppText className={`text-xs font-bold ${hasGenres ? 'text-green-400' : 'text-zinc-500'}`}>
                    {hasGenres ? '✓' : '○'}
                  </AppText>
                </View>

                <View className="flex-row items-center justify-between">
                  <AppText variant="caption" className="text-xs font-medium text-zinc-300">
                    Favorite artists
                  </AppText>
                  <AppText className={`text-xs font-bold ${hasArtists ? 'text-green-400' : 'text-zinc-500'}`}>
                    {hasArtists ? '✓' : '○'}
                  </AppText>
                </View>
              </View>

              <AppButton
                title={totalPoints === 100 ? "Edit Profile" : "Complete Profile"}
                onPress={handleEditProfile}
                variant="outline"
                size="sm"
                className="border-purple-500/40"
              />
            </View>
          )}

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
                onPress={() => handleSelectQuality("320kbps")}
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
                onPress={() => handleSelectQuality("160kbps")}
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
          <View className="mt-4 p-5 rounded-2xl bg-white/5 border border-white/10 items-center">
            <AppText variant="songTitle" className="text-base font-bold mb-1">
              Jamkudi Music Player
            </AppText>
            <AppText variant="caption" className="text-xs text-zinc-400 font-medium">
              Version 1.0.0 • Powered by JioSaavn & Expo 57
            </AppText>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
