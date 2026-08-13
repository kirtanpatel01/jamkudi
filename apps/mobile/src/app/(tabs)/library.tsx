import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
import { SettingsModal } from "@/components/common/SettingsModal";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { View, Pressable } from "@/tw";

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { profile } = useAuth();
  const { playQueue, likedTracks, recentlyPlayed, currentTrack, isPlaying } = usePlayer();
  const [showSettings, setShowSettings] = useState(false);

  const handlePlayLiked = async () => {
    if (likedTracks.length > 0) {
      await playQueue(likedTracks, 0);
      showToast("Playing Liked Songs", "success");
    }
  };

  const handlePlayRecent = async (index: number) => {
    if (recentlyPlayed.length > 0) {
      const selected = recentlyPlayed[index];
      await playQueue(recentlyPlayed, index);
      showToast(`Playing ${selected?.title || "track"}`, "info");
    }
  };

  return (
    <Screen scrollable paddingHorizontal={16}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between mt-2 mb-6">
        <View>
          <AppText variant="screenTitle" className="text-2xl font-bold">
            Your Library
          </AppText>
          {profile?.display_name && (
            <AppText variant="caption" className="text-xs text-purple-400 font-semibold mt-0.5">
              Welcome, {profile.display_name}
            </AppText>
          )}
        </View>

        <View className="flex-row items-center gap-x-2">
          <IconButton
            name="search"
            size={22}
            color={theme.textPrimary}
            onPress={() => router.push("/(tabs)/search")}
            accessibilityLabel="Search Library"
          />
          <IconButton
            name="heart"
            size={22}
            color={theme.textPrimary}
            onPress={() => setShowSettings(true)}
            accessibilityLabel="Account Settings"
          />
        </View>
      </View>

      {/* Liked Songs Featured Banner */}
      <Pressable
        onPress={handlePlayLiked}
        className="w-full rounded-3xl p-5 mb-8 flex-row items-center justify-between overflow-hidden active:opacity-90 shadow-lg"
        style={{
          backgroundColor: "#4C1D95",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.15)",
        }}
      >
        <View className="flex-1 pr-4">
          <View className="w-10 h-10 rounded-full items-center justify-center bg-white/20 mb-3">
            <Icon name="heart-filled" size={20} color="#FFFFFF" />
          </View>

          <AppText variant="songTitle" className="text-xl font-bold text-white mb-0.5">
            Liked Songs
          </AppText>
          <AppText variant="caption" className="text-xs text-purple-200 font-medium">
            {likedTracks.length > 0
              ? `${likedTracks.length} saved ${likedTracks.length === 1 ? "track" : "tracks"}`
              : "No liked songs yet • Save songs you love and they'll appear here."}
          </AppText>
        </View>

        {likedTracks.length > 0 && (
          <View className="w-12 h-12 rounded-full items-center justify-center bg-white/10">
            <Icon name="play" size={26} color="#FFFFFF" />
          </View>
        )}
      </Pressable>

      {/* Recently Played Section (Max 10) */}
      <View className="mb-8">
        <AppText variant="sectionTitle" className="text-lg font-bold mb-3.5">
          Recently Played 🕒
        </AppText>

        {recentlyPlayed.length > 0 ? (
          recentlyPlayed.slice(0, 10).map((item, idx) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <Pressable
                key={`${item.id}-${idx}`}
                onPress={() => handlePlayRecent(idx)}
                className="flex-row items-center py-2 px-1 rounded-xl mb-1 active:bg-white/5"
              >
                <View className="relative w-12 h-12 rounded-lg overflow-hidden mr-3 bg-zinc-800">
                  <ArtworkImage uri={item.artwork} iconSize={18} className="w-full h-full" />
                  {isCurrent && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <Icon
                        name={isPlaying ? "pause" : "play"}
                        size={16}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </View>

                <View className="flex-1 mr-2">
                  <AppText
                    variant="songTitle"
                    className={`text-sm font-semibold mb-0.5 ${
                      isCurrent ? "text-purple-400 font-bold" : ""
                    }`}
                    numberOfLines={1}
                  >
                    {item.title}
                  </AppText>
                  <AppText
                    variant="artist"
                    className="text-xs text-zinc-400 font-medium"
                    numberOfLines={1}
                  >
                    {item.artist}
                  </AppText>
                </View>

                {item.duration > 0 && (
                  <AppText
                    variant="caption"
                    className="text-xs text-zinc-400 font-medium"
                  >
                    {formatDuration(item.duration)}
                  </AppText>
                )}
              </Pressable>
            );
          })
        ) : (
          <View className="py-10 items-center px-4 rounded-2xl bg-white/5 border border-white/5">
            <Icon name="clock" size={32} color={theme.textMuted} />
            <AppText variant="songTitle" className="text-sm font-bold text-center mt-2.5 mb-0.5">
              Nothing played yet
            </AppText>
            <AppText variant="caption" className="text-xs text-zinc-400 font-medium text-center">
              Start listening and your history will appear here.
            </AppText>
          </View>
        )}
      </View>

      {/* Settings Modal */}
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
    </Screen>
  );
}
