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
import { ArtistDetails } from "@/services/jiosaavn";
import { fetchArtistCatalog } from "@/services/catalogEngine";
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

export default function ArtistDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playQueue, currentTrack, isPlaying } = usePlayer();

  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);

    fetchArtistCatalog(id).then((data) => {
      if (isMounted) {
        setArtist(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handlePlayAll = async () => {
    if (artist && artist.tracks.length > 0) {
      await playQueue(artist.tracks, 0);
      showToast(`Playing ${cleanTitle(artist.name)}`, "success");
    }
  };

  const handleSelectSong = async (song: JioSaavnSong, index: number) => {
    if (artist) {
      await playQueue(artist.tracks, index);
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
          ARTIST PROFILE
        </AppText>

        <View className="w-10" />
      </View>

      {loading ? (
        <View className="py-24 items-center justify-center">
          <ActivityIndicator size="large" color="#A855F7" />
          <AppText variant="caption" color="textSecondary" className="mt-3 font-medium">
            Loading artist profile...
          </AppText>
        </View>
      ) : !artist ? (
        <View className="py-24 items-center">
          <AppText variant="body" color="textSecondary">
            Artist profile not found.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={artist.tracks}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-28"
          ListHeaderComponent={
            <View className="items-center mb-6">
              {/* Artist Avatar */}
              <View
                className="w-36 h-36 rounded-full overflow-hidden mb-4 border-4 border-purple-500/60 shadow-2xl shadow-purple-950/60"
                style={{ backgroundColor: theme.surface }}
              >
                <ArtworkImage
                  uri={artist.imageUrl}
                  iconSize={48}
                  className="w-full h-full"
                />
              </View>

              <AppText variant="screenTitle" className="text-2xl font-extrabold text-center mb-0.5 tracking-tight">
                {cleanTitle(artist.name)}
              </AppText>
              <AppText variant="caption" color="textSecondary" className="text-xs font-medium mb-4">
                Verified Artist • {artist.tracks.length} Top Tracks
              </AppText>

              {/* Action Bar */}
              <View className="flex-row items-center gap-x-3 mb-2">
                <Pressable
                  onPress={handlePlayAll}
                  className="flex-row items-center px-7 py-3 rounded-full bg-purple-600 active:bg-purple-700 shadow-lg shadow-purple-950/50 active:scale-[0.96]"
                >
                  <Icon name="play" size={18} color="#FFFFFF" />
                  <AppText className="ml-2 text-xs font-bold text-white uppercase tracking-wider">Play All</AppText>
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <Pressable
                onPress={() => handleSelectSong(item, index)}
                className="flex-row items-center p-3 rounded-2xl mb-2 border active:scale-[0.99]"
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

                <View
                  className="relative w-12 h-12 rounded-xl overflow-hidden mr-3 shrink-0"
                  style={{ backgroundColor: theme.surfacePressed }}
                >
                  <ArtworkImage uri={item.artwork} iconSize={18} className="w-full h-full" />
                  {isCurrent ? (
                    <View className="absolute inset-0 bg-black/60 items-center justify-center">
                      <Icon
                        name={isPlaying ? "pause" : "play"}
                        size={16}
                        color="#C084FC"
                      />
                    </View>
                  ) : null}
                </View>

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
                    {cleanTitle(item.album)}
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
