import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { PlaylistDetails, JioSaavnSong } from "@/services/jiosaavn";
import { fetchPlaylistCatalog } from "@/services/catalogEngine";
import { View, Pressable } from "@/tw";

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function PlaylistDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playQueue, currentTrack, isPlaying } = usePlayer();

  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);

    fetchPlaylistCatalog(id).then((data) => {
      if (isMounted) {
        setPlaylist(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handlePlayAll = async () => {
    if (playlist && playlist.tracks.length > 0) {
      await playQueue(playlist.tracks, 0);
      showToast(`Playing playlist: ${playlist.title}`, "success");
    }
  };

  const handleSelectSong = async (song: JioSaavnSong, index: number) => {
    if (playlist) {
      await playQueue(playlist.tracks, index);
      showToast(`Playing ${song.title}`, "info");
    }
  };

  return (
    <Screen paddingHorizontal={16}>
      {/* Header */}
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-white/10"
        >
          <Icon name="skip-back" size={24} color={theme.textPrimary} />
        </Pressable>

        <AppText variant="caption" className="uppercase tracking-widest text-[10px] text-zinc-400 font-bold">
          PLAYLIST DISCOVERY
        </AppText>

        <View className="w-10" />
      </View>

      {loading ? (
        <View className="py-24 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <AppText variant="caption" className="mt-3 text-zinc-400 font-medium">
            Loading playlist details...
          </AppText>
        </View>
      ) : !playlist ? (
        <View className="py-24 items-center">
          <AppText variant="body" className="text-zinc-400">
            Playlist details not found.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={playlist.tracks}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-24"
          ListHeaderComponent={
            <View className="items-center mb-6">
              {/* Playlist Artwork */}
              <View className="w-44 h-44 rounded-3xl overflow-hidden mb-4 bg-zinc-800 border border-purple-500/20 shadow-2xl">
                <ArtworkImage
                  uri={playlist.artwork}
                  iconSize={48}
                  className="w-full h-full"
                />
              </View>

              <AppText variant="screenTitle" className="text-xl font-bold text-center mb-0.5">
                {playlist.title}
              </AppText>
              <AppText variant="artist" className="text-sm text-zinc-400 font-medium text-center mb-4">
                {playlist.subtitle || "JioSaavn Playlist"} • {playlist.tracks.length} Songs
              </AppText>

              {/* Action Bar */}
              <View className="flex-row items-center gap-x-3 mb-2">
                <Pressable
                  onPress={handlePlayAll}
                  className="flex-row items-center px-6 py-2.5 rounded-full bg-purple-600 active:bg-purple-700 shadow-md"
                >
                  <Icon name="play" size={18} color="#FFFFFF" />
                  <AppText className="ml-2 text-xs font-bold text-white">Play Playlist</AppText>
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <Pressable
                onPress={() => handleSelectSong(item, index)}
                className="flex-row items-center py-2.5 px-1 rounded-xl mb-1 active:bg-white/5"
              >
                <AppText
                  variant="caption"
                  className="w-6 text-xs text-zinc-400 font-bold text-center mr-2"
                >
                  {index + 1}
                </AppText>

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
                    {item.artist} • {item.album}
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
          }}
        />
      )}
    </Screen>
  );
}
