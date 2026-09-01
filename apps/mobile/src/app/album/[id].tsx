import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { SongRow } from "@/components/common/SongRow";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { AlbumDetails, JioSaavnSong } from "@/services/jiosaavn";
import { fetchAlbumCatalog } from "@/services/catalogEngine";
import { View, Pressable } from "@/tw";

function cleanTitle(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function AlbumDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playQueue, currentTrack, isPlaying } = usePlayer();

  const [album, setAlbum] = useState<AlbumDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);

    fetchAlbumCatalog(id).then((data) => {
      if (isMounted) {
        setAlbum(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handlePlayAll = async () => {
    if (album && album.tracks.length > 0) {
      await playQueue(album.tracks, 0);
      showToast(`Playing album: ${cleanTitle(album.title)}`, "success");
    }
  };

  const handleSelectSong = async (song: JioSaavnSong, index: number) => {
    if (album) {
      await playQueue(album.tracks, index);
      showToast(`Playing ${cleanTitle(song.title)}`, "info");
    }
  };

  return (
    <Screen paddingHorizontal={16}>
      {/* Header */}
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 items-center justify-center rounded-full active:opacity-80 active:scale-[0.94]"
          style={{ backgroundColor: theme.surface }}
        >
          <Icon name="skip-back" size={22} color={theme.textPrimary} />
        </Pressable>

        <AppText variant="caption" color="textSecondary" className="uppercase tracking-widest text-[11px] font-bold">
          ALBUM
        </AppText>

        <View className="w-10" />
      </View>

      {loading ? (
        <View className="py-24 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <AppText variant="caption" color="textSecondary" className="mt-3 font-medium">
            Loading album details...
          </AppText>
        </View>
      ) : !album ? (
        <View className="py-24 items-center">
          <AppText variant="body" color="textSecondary">
            Album details not found.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={album.tracks}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-28"
          ListHeaderComponent={
            <View className="items-center mb-6">
              {/* Album Artwork */}
              <View
                className="w-44 h-44 rounded-3xl overflow-hidden mb-4"
                style={{ backgroundColor: theme.surface }}
              >
                <ArtworkImage
                  uri={album.artwork}
                  iconSize={48}
                  className="w-full h-full"
                />
              </View>

              <AppText variant="screenTitle" className="text-xl font-bold text-center mb-0.5 tracking-tight px-4">
                {cleanTitle(album.title)}
              </AppText>
              <AppText variant="artist" color="textSecondary" className="text-sm font-medium text-center mb-4 px-4">
                {cleanTitle(album.artist)} • {album.tracks.length} Songs
              </AppText>

              {/* Action Bar */}
              <View className="flex-row items-center gap-x-3 mb-2">
                <Pressable
                  onPress={handlePlayAll}
                  className="flex-row items-center px-7 py-3 rounded-full bg-[#9B7CFF] active:bg-[#8062E8] active:scale-[0.96]"
                >
                  <Icon name="play" size={18} color="#FFFFFF" />
                  <AppText className="ml-2 text-xs font-bold text-white uppercase tracking-wider">Play Album</AppText>
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <SongRow
              title={cleanTitle(item.title)}
              artist={cleanTitle(item.artist)}
              artworkUri={item.artwork || album.artwork}
              duration={item.duration > 0 ? formatDuration(item.duration) : undefined}
              isPlaying={currentTrack?.id === item.id}
              onPress={() => handleSelectSong(item, index)}
            />
          )}
        />
      )}
    </Screen>
  );
}
