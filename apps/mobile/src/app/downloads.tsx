import React, { useState } from "react";
import { FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { SongRow } from "@/components/common/SongRow";
import { EmptyState } from "@/components/common/feedback/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { useDownloads } from "@/context/DownloadContext";
import { JioSaavnSong } from "@/services/jiosaavn";
import { View, Pressable, TextInput } from "@/tw";

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function DownloadsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { playQueue, currentTrack, isPlaying } = usePlayer();
  const {
    downloadedSongs,
    removeSongDownload,
    isOffline,
    formattedStorageSize,
  } = useDownloads();

  const [searchQuery, setSearchQuery] = useState("");

  const formattedSongs: (JioSaavnSong & { audioUrl?: string })[] = downloadedSongs.map((meta) => ({
    id: meta.songId,
    title: meta.title,
    artist: meta.artist,
    album: meta.album || "",
    artwork: meta.artwork || undefined,
    duration: meta.duration,
    downloadUrl: meta.downloadUrl,
    url: meta.localUri,
    audioUrl: meta.localUri,
  }));

  const filteredSongs = formattedSongs.filter((song) =>
    searchQuery.trim()
      ? song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const handlePlayAll = async () => {
    if (filteredSongs.length > 0) {
      await playQueue(filteredSongs, 0);
      showToast("Playing Offline Downloads", "info");
    }
  };

  const handleSelectSong = async (song: JioSaavnSong, index: number) => {
    await playQueue(filteredSongs, index);
  };

  const handleConfirmRemoveDownload = (songId: string, songTitle: string) => {
    Alert.alert(
      "Remove Download",
      `Are you sure you want to remove the offline audio file for "${songTitle}"? The song will remain in your library.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove Download",
          style: "destructive",
          onPress: async () => {
            await removeSongDownload(songId);
          },
        },
      ]
    );
  };

  return (
    <Screen scrollable={false} paddingHorizontal={16}>
      {/* Header */}
      <View className="flex-row items-center justify-between mt-2 mb-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center border active:scale-[0.95]"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="chevron-left" size={22} color={theme.textPrimary} />
        </Pressable>

        <View className="flex-1 items-center mx-2">
          <AppText variant="screenTitle" className="text-xl font-bold tracking-tight">
            Downloads
          </AppText>
          <AppText variant="caption" color="textSecondary" className="text-xs font-semibold">
            {isOffline ? "Offline Mode • " : ""}{downloadedSongs.length} songs · {formattedStorageSize}
          </AppText>
        </View>

        <View className="w-10 h-10" />
      </View>

      {/* Search Input */}
      {downloadedSongs.length > 0 && (
        <View
          className="px-3.5 h-11 rounded-2xl flex-row items-center mb-3.5 border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <Icon name="search" size={18} color={theme.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search offline songs..."
            placeholderTextColor={theme.textMuted}
            className="flex-1 ml-2 text-sm font-medium"
            style={{ color: theme.textPrimary }}
            accessibilityLabel="Search offline songs"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={6} accessibilityLabel="Clear search">
              <Icon name="x" size={16} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>
      )}

      {/* Play All Hero & Status Summary */}
      {filteredSongs.length > 0 && (
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable
            onPress={handlePlayAll}
            className="px-5 py-2.5 rounded-full bg-[#9B7CFF] flex-row items-center active:scale-[0.95] shadow-md shadow-purple-950/20"
            accessibilityRole="button"
            accessibilityLabel="Play all offline songs"
          >
            <Icon name="play" size={16} color="#FFFFFF" />
            <AppText className="ml-2 text-xs font-bold text-white uppercase tracking-wider">
              Play All Offline
            </AppText>
          </Pressable>

          <View className="flex-row items-center px-3 py-1.5 rounded-full bg-purple-950/40 border border-purple-500/30">
            <Icon name="check-circle" size={14} color="#9B7CFF" />
            <AppText className="ml-1.5 text-xs font-bold text-purple-300">
              Available Offline
            </AppText>
          </View>
        </View>
      )}

      {/* Songs List */}
      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="py-12">
            <EmptyState
              title={searchQuery ? "No matching downloads" : "No offline downloads yet"}
              message={
                searchQuery
                  ? "Try searching for a different song title or artist."
                  : "Download your favorite tracks to listen anywhere without internet connection."
              }
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <View className="flex-row items-center">
            <View className="flex-1">
              <SongRow
                songId={item.id}
                title={item.title}
                artist={item.artist}
                artworkUri={item.artwork}
                duration={item.duration > 0 ? formatDuration(item.duration) : undefined}
                isPlaying={currentTrack?.id === item.id && isPlaying}
                onPress={() => handleSelectSong(item, index)}
              />
            </View>

            <Pressable
              onPress={() => handleConfirmRemoveDownload(item.id, item.title)}
              className="p-2 rounded-full active:bg-white/10 ml-1"
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Remove download for ${item.title}`}
            >
              <Icon name="trash" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}
