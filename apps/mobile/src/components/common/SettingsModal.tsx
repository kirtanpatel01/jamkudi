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
        <View className="flex-row items-center justify-between mb-6 pb-4 border-b" style={{ borderBottomColor: theme.border }}>
          <AppText variant="screenTitle" className="text-xl font-extrabold tracking-tight">
            Settings & Account
          </AppText>

          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="w-10 h-10 items-center justify-center rounded-full border active:opacity-70"
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            <Icon name="chevron-down" size={24} color={theme.textPrimary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* User Account Card */}
          {user && (
            <View
              className="mb-6 p-4.5 rounded-2xl border flex-row items-center justify-between shadow-sm"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <View className="flex-1 mr-3">
                <AppText variant="songTitle" color="textPrimary" className="text-base font-bold mb-0.5">
                  {profile?.display_name || profile?.username || "Authenticated User"}
                </AppText>
                <AppText variant="caption" color="textSecondary" className="text-xs font-medium">
                  {user.email}
                </AppText>
                {profile?.username && (
                  <AppText variant="caption" className="text-[11px] text-purple-400 font-semibold mt-0.5">
                    @{profile.username}
                  </AppText>
                )}
              </View>

              <Pressable
                onPress={handleLogout}
                className="px-4 py-2 rounded-full bg-rose-500/10 active:bg-rose-500/20 border border-rose-500/30 active:scale-[0.96]"
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
              className="mb-8 p-5 rounded-3xl border shadow-md"
              style={{ backgroundColor: theme.isDark ? '#221A35' : theme.surfaceElevated, borderColor: '#A855F7' }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <AppText variant="sectionTitle" className="text-base font-bold">
                  Profile Completion
                </AppText>
                <AppText variant="caption" className="text-sm font-extrabold text-purple-400">
                  {totalPoints}%
                </AppText>
              </View>

              {/* Progress Bar */}
              <View className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ backgroundColor: theme.surfacePressed }}>
                <View
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${totalPoints}%` }}
                />
              </View>

              {/* Field Checklist */}
              <View className="gap-y-2 mb-4">
                <View className="flex-row items-center justify-between">
                  <AppText variant="caption" color="textPrimary" className="text-xs font-medium">
                    Display name
                  </AppText>
                  <AppText className={`text-xs font-bold ${hasDisplayName ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {hasDisplayName ? '✓' : '○'}
                  </AppText>
                </View>

                <View className="flex-row items-center justify-between">
                  <AppText variant="caption" color="textPrimary" className="text-xs font-medium">
                    Username
                  </AppText>
                  <AppText className={`text-xs font-bold ${hasUsername ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {hasUsername ? '✓' : '○'}
                  </AppText>
                </View>

                <View className="flex-row items-center justify-between">
                  <AppText variant="caption" color="textPrimary" className="text-xs font-medium">
                    Favorite genres
                  </AppText>
                  <AppText className={`text-xs font-bold ${hasGenres ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {hasGenres ? '✓' : '○'}
                  </AppText>
                </View>

                <View className="flex-row items-center justify-between">
                  <AppText variant="caption" color="textPrimary" className="text-xs font-medium">
                    Favorite artists
                  </AppText>
                  <AppText className={`text-xs font-bold ${hasArtists ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {hasArtists ? '✓' : '○'}
                  </AppText>
                </View>
              </View>

              <Pressable
                onPress={handleEditProfile}
                className="w-full py-2.5 rounded-full bg-purple-600/30 border border-purple-500/50 items-center active:bg-purple-600/50 active:scale-[0.98]"
              >
                <AppText className="text-xs font-bold text-purple-200">
                  {totalPoints === 100 ? "Edit Profile" : "Complete Profile"}
                </AppText>
              </Pressable>
            </View>
          )}

          {/* Streaming Quality Setting */}
          <View className="mb-8">
            <AppText variant="sectionTitle" className="text-base font-bold mb-1">
              Audio Streaming Quality
            </AppText>
            <AppText variant="caption" color="textSecondary" className="text-xs font-medium mb-4">
              Higher quality uses more cellular data
            </AppText>

            <View className="gap-y-3">
              <Pressable
                onPress={() => handleSelectQuality("320kbps")}
                className="flex-row items-center justify-between p-4 rounded-2xl border active:scale-[0.98]"
                style={
                  audioQuality === "320kbps"
                    ? { backgroundColor: theme.isDark ? '#221A35' : theme.surfacePressed, borderColor: 'rgba(168, 85, 247, 0.6)' }
                    : { backgroundColor: theme.surface, borderColor: theme.border }
                }
              >
                <View className="flex-1 pr-3">
                  <AppText variant="songTitle" color={audioQuality === "320kbps" ? undefined : 'textPrimary'} className={`text-sm font-bold mb-0.5 ${audioQuality === "320kbps" ? "text-purple-400" : ""}`}>
                    High Definition (320 kbps)
                  </AppText>
                  <AppText variant="caption" color="textSecondary" className="text-xs font-medium">
                    Best audio clarity & bass response
                  </AppText>
                </View>

                {audioQuality === "320kbps" && (
                  <View className="w-7 h-7 rounded-full bg-purple-600 items-center justify-center">
                    <Icon name="check" size={14} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={() => handleSelectQuality("160kbps")}
                className="flex-row items-center justify-between p-4 rounded-2xl border active:scale-[0.98]"
                style={
                  audioQuality === "160kbps"
                    ? { backgroundColor: theme.isDark ? '#221A35' : theme.surfacePressed, borderColor: 'rgba(168, 85, 247, 0.6)' }
                    : { backgroundColor: theme.surface, borderColor: theme.border }
                }
              >
                <View className="flex-1 pr-3">
                  <AppText variant="songTitle" color={audioQuality === "160kbps" ? undefined : 'textPrimary'} className={`text-sm font-bold mb-0.5 ${audioQuality === "160kbps" ? "text-purple-400" : ""}`}>
                    Data Saver (160 kbps)
                  </AppText>
                  <AppText variant="caption" color="textSecondary" className="text-xs font-medium">
                    Saves cellular data on mobile networks
                  </AppText>
                </View>

                {audioQuality === "160kbps" && (
                  <View className="w-7 h-7 rounded-full bg-purple-600 items-center justify-center">
                    <Icon name="check" size={14} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* App Info Card */}
          <View
            className="mt-2 p-5 rounded-2xl border items-center"
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            <AppText variant="songTitle" className="text-base font-bold mb-1">
              Jamkudi Music Player
            </AppText>
            <AppText variant="caption" color="textSecondary" className="text-xs font-medium">
              Version 1.0.0 • Powered by JioSaavn & Expo 57
            </AppText>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
