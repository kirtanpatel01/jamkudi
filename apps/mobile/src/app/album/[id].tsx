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
import { AlbumDetails } from "@/services/jiosaavn";
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
          className="w-10 h-10 items-center justify-center rounded-full border active:opacity-80 active:scale-[0.94]"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <Icon name="skip-back" size={22} color={theme.textPrimary} />
        </Pressable>

        <AppText variant="caption" className="uppercase tracking-widest text-xs text-purple-400 font-extrabold">
          ALBUM DISCOVERY
        </AppText>

        <View className="w-10" />
      </View>

      {loading ? (
        <View className="py-24 items-center justify-center">
          <ActivityIndicator size="large" color="#A855F7" />
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
                className="w-44 h-44 rounded-3xl overflow-hidden mb-4 border shadow-2xl shadow-purple-950/60"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
              >
                <ArtworkImage
                  uri={album.artwork}
                  iconSize={48}
                  className="w-full h-full"
                />
              </View>

              <AppText variant="screenTitle" className="text-xl font-extrabold text-center mb-0.5 tracking-tight px-4">
                {cleanTitle(album.title)}
              </AppText>
              <AppText variant="artist" color="textSecondary" className="text-sm font-medium text-center mb-4 px-4">
                {cleanTitle(album.artist)} • {album.tracks.length} Songs
              </AppText>

              {/* Action Bar */}
              <View className="flex-row items-center gap-x-3 mb-2">
                <Pressable
                  onPress={handlePlayAll}
                  className="flex-row items-center px-7 py-3 rounded-full bg-purple-600 active:bg-purple-700 shadow-lg shadow-purple-950/50 active:scale-[0.96]"
                >
                  <Icon name="play" size={18} color="#FFFFFF" />
                  <AppText className="ml-2 text-xs font-bold text-white uppercase tracking-wider">Play Album</AppText>
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <Pressable
                onPress={() => handleSelectSong(item, index)}
                className="flex-row items-center p-3.5 rounded-2xl mb-2 border active:scale-[0.99]"
                style={
                  isCurrent
                    ? { backgroundColor: theme.isDark ? '#221A35' : theme.surfacePressed, borderColor: 'rgba(168, 85, 247, 0.6)' }
                    : { backgroundColor: theme.surface, borderColor: theme.border }
                }
              >
                <AppText
                  variant="caption"
                  color="textMuted"
                  className="w-6 text-xs font-bold text-center mr-2 shrink-0"
                >
                  {index + 1}
                </AppText>

                <View className="flex-1 mr-2 min-w-0">
                  <AppText
                    variant="songTitle"
                    color={isCurrent ? undefined : 'textPrimary'}
                    className={`text-sm font-bold mb-0.5 ${
                      isCurrent ? "text-purple-300 font-bold" : ""
                    }`}
                    numberOfLines={1}
                  >
                    {cleanTitle(item.title)}
                  </AppText>
                  <AppText
                    variant="artist"
                    color="textSecondary"
                    className="text-xs font-medium"
                    numberOfLines={1}
                  >
                    {cleanTitle(item.artist)}
                  </AppText>
                </View>

                {item.duration > 0 ? (
                  <AppText
                    variant="caption"
                    color="textMuted"
                    className="text-xs font-medium shrink-0"
                  >
                    {formatDuration(item.duration)}
                  </AppText>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
