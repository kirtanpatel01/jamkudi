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
import { ArtistDetails, JioSaavnSong } from "@/services/jiosaavn";
import { fetchArtistCatalog } from "@/services/catalogEngine";
import { View, Pressable } from "@/tw";

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

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
          className="w-10 h-10 items-center justify-center rounded-full active:opacity-80 active:scale-[0.94]"
          style={{ backgroundColor: theme.surface }}
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
                className="w-36 h-36 rounded-full overflow-hidden mb-4"
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
                  className="flex-row items-center px-7 py-3 rounded-full bg-purple-600 active:bg-purple-700 active:scale-[0.96]"
                >
                  <Icon name="play" size={18} color="#FFFFFF" />
                  <AppText className="ml-2 text-xs font-bold text-white uppercase tracking-wider">Play All</AppText>
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <SongRow
              title={cleanTitle(item.title)}
              artist={cleanTitle(item.album || artist.name)}
              artworkUri={item.artwork || artist.imageUrl}
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
