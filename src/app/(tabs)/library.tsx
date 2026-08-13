import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { JioSaavnSong, searchSongs } from "@/services/jiosaavn";
import { View, Pressable } from "@/tw";
import { Image } from "@/tw/image";

interface PlaylistCategory {
  id: string;
  title: string;
  subtitle: string;
  query: string;
  gradientBg: string;
  iconName: any;
}

const FEATURED_PLAYLISTS: PlaylistCategory[] = [
  {
    id: "liked",
    title: "Liked Songs",
    subtitle: "Auto-saved tracks",
    query: "Top Hits",
    gradientBg: "bg-purple-900/60",
    iconName: "heart-filled",
  },
  {
    id: "arijit_special",
    title: "Arijit Singh Special",
    subtitle: "Best of Arijit",
    query: "Arijit Singh",
    gradientBg: "bg-pink-900/60",
    iconName: "music",
  },
  {
    id: "lofi",
    title: "Chill & Lo-Fi Beats",
    subtitle: "Relax & Focus",
    query: "Lo-Fi Hindi",
    gradientBg: "bg-indigo-900/60",
    iconName: "library-filled",
  },
  {
    id: "party",
    title: "Party & Workout Beats",
    subtitle: "High Energy Punjabi",
    query: "Punjabi Party",
    gradientBg: "bg-amber-900/60",
    iconName: "devices",
  },
];

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { playQueue, currentTrack } = usePlayer();

  const handleOpenPlaylist = async (playlist: PlaylistCategory) => {
    const songs = await searchSongs(playlist.query, 0, 20);
    if (songs.length > 0) {
      await playQueue(songs, 0);
      router.push("/player");
    }
  };

  return (
    <Screen scrollable paddingHorizontal={16}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between mt-2 mb-6">
        <AppText variant="screenTitle" className="text-2xl font-bold">
          Your Library
        </AppText>

        <View className="flex-row items-center gap-x-2">
          <IconButton
            name="search"
            size={22}
            color={theme.textPrimary}
            onPress={() => router.push("/(tabs)/search")}
            accessibilityLabel="Search Library"
          />
        </View>
      </View>

      {/* Liked Songs Featured Banner */}
      <Pressable
        onPress={() => handleOpenPlaylist(FEATURED_PLAYLISTS[0])}
        className="w-full h-32 rounded-3xl p-5 mb-8 flex-row items-center justify-between overflow-hidden active:opacity-90 shadow-lg"
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
            Tap to stream your favorite tracks
          </AppText>
        </View>

        <View className="w-12 h-12 rounded-full items-center justify-center bg-white/10">
          <Icon name="play" size={26} color="#FFFFFF" />
        </View>
      </Pressable>

      {/* Playlists Section */}
      <View className="mb-8">
        <AppText variant="sectionTitle" className="text-lg font-bold mb-4">
          Curated Playlists 🎵
        </AppText>

        <View className="gap-y-3">
          {FEATURED_PLAYLISTS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleOpenPlaylist(item)}
              className="flex-row items-center p-3 rounded-2xl active:bg-white/5"
              style={{
                backgroundColor: theme.surfaceElevated,
                borderWidth: 0.5,
                borderColor: theme.border,
              }}
            >
              <View
                className={`w-14 h-14 rounded-xl items-center justify-center mr-4 ${item.gradientBg}`}
              >
                <Icon name={item.iconName} size={24} color="#FFFFFF" />
              </View>

              <View className="flex-1">
                <AppText variant="songTitle" className="text-base font-semibold mb-0.5">
                  {item.title}
                </AppText>
                <AppText
                  variant="caption"
                  className="text-xs text-zinc-400 font-medium"
                >
                  Playlist • {item.subtitle}
                </AppText>
              </View>

              <Icon name="skip-forward" size={20} color={theme.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
