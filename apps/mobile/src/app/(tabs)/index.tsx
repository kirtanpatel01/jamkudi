import React, { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { IconButton } from "@/components/common/IconButton";
import { SettingsModal } from "@/components/common/SettingsModal";
import { MusicShelf } from "@/components/common/MusicShelf";
import { ArtistPortrait } from "@/components/common/ArtistPortrait";
import { JamkudiMascot } from "@/components/common/JamkudiMascot";
import { SongRow } from "@/components/common/SongRow";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useDownloads } from "@/context/DownloadContext";
import { JioSaavnSong } from "@/services/jiosaavn";
import {
  generateHomeDiscoveryFeed,
  HomeDiscoveryResult,
} from "@/services/recommendationEngine";
import { View } from "@/tw";

function cleanTitle(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getGreeting(displayName?: string | null): string {
  const hour = new Date().getHours();
  let baseGreeting = "Good evening";
  if (hour < 12) baseGreeting = "Good morning";
  else if (hour < 18) baseGreeting = "Good afternoon";

  const cleanName = displayName?.trim();
  if (
    cleanName &&
    cleanName.toLowerCase() !== "null" &&
    cleanName.toLowerCase() !== "undefined"
  ) {
    return `${baseGreeting}, ${cleanName}`;
  }
  return baseGreeting;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { playQueue, currentTrack, isPlaying, recentlyPlayed } = usePlayer();
  const { user, profile } = useAuth();
  const { isSongDownloaded, downloadSongTrack, removeSongDownload } = useDownloads();

  const [feed, setFeed] = useState<HomeDiscoveryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const loadHomeFeed = useCallback(async () => {
    setLoading(true);
    try {
      const rawFavArtists: any[] = profile?.favorite_artists || [];
      const favArtistObjects = rawFavArtists.map((item) => ({
        name: typeof item === "string" ? item : item?.name || "",
        imageUrl: typeof item === "object" ? item?.imageUrl || "" : "",
      })).filter((a) => Boolean(a.name));

      const favGenres: string[] = profile?.favorite_genres || [];

      const result = await generateHomeDiscoveryFeed({
        history: recentlyPlayed || [],
        favoriteArtists: favArtistObjects,
        favoriteGenres: favGenres,
      });

      setFeed(result);
    } catch (err) {
      showToast("Failed to load discovery feed", "error");
    } finally {
      setLoading(false);
    }
  }, [profile, recentlyPlayed, showToast]);

  useEffect(() => {
    loadHomeFeed();
  }, [loadHomeFeed]);

  const handlePlaySong = (songs: JioSaavnSong[], startIndex: number) => {
    if (songs.length > 0) {
      playQueue(songs, startIndex, "home");
    }
  };

  return (
    <>
      <Screen scrollable>
        {/* Header */}
        <View className="flex-row items-center justify-between pt-2 pb-6 px-1">
          <View className="flex-row items-center flex-1 mr-3 min-w-0">
            <JamkudiMascot size={42} className="mr-3 shrink-0" />
            <View className="flex-1 min-w-0 justify-center">
              <AppText variant="caption" color="textSecondary" className="text-xs font-semibold">
                {getGreeting(profile?.display_name || user?.email)}
              </AppText>
              <AppText variant="screenTitle" className="text-xl font-black tracking-tight" numberOfLines={1}>
                Jamkudi Music
              </AppText>
            </View>
          </View>

          <IconButton
            name="settings"
            size={22}
            color={theme.textPrimary}
            onPress={() => setShowSettings(true)}
            accessibilityLabel="Open settings"
          />
        </View>

        {/* Loading Spinner */}
        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#C084FC" />
            <AppText variant="caption" color="textSecondary" className="mt-3 font-semibold text-xs">
              Loading music discovery...
            </AppText>
          </View>
        ) : feed ? (
          <View>
            {/* 1. FRESH DISCOVERY (Candidates from discovery layer, validated by MusicBrainz release dates) */}
            {feed.freshReleases.length > 0 && (
              <MusicShelf
                title="Fresh Discovery"
                items={feed.freshReleases.map((song) => ({
                  id: song.id,
                  title: cleanTitle(song.title),
                  subtitle: cleanTitle(song.artist),
                  artworkUri: song.artwork,
                }))}
                currentId={currentTrack?.id}
                isPlaying={isPlaying}
                itemWidth={96}
                onItemPress={(_, idx) => handlePlaySong(feed.freshReleases, idx)}
              />
            )}

            {/* 2. TRENDING HITS (Normalized & Deduplicated Popular Music) */}
            {feed.trendingHits.length > 0 && (
              <MusicShelf
                title="Trending Hits"
                items={feed.trendingHits.map((song) => ({
                  id: song.id,
                  title: cleanTitle(song.title),
                  subtitle: cleanTitle(song.artist),
                  artworkUri: song.artwork,
                }))}
                currentId={currentTrack?.id}
                isPlaying={isPlaying}
                itemWidth={96}
                onItemPress={(_, idx) => handlePlaySong(feed.trendingHits, idx)}
              />
            )}

            {/* 3. YOUR FAVORITE ARTISTS (Rendered ONLY if user has >= 3 genuine favorite artists) */}
            {feed.favoriteArtistsList.length >= 3 && (
              <View className="mb-8">
                <AppText variant="sectionTitle" className="text-base font-black mb-3.5 px-0.5">
                  Your Favorite Artists
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 18 }}
                >
                  {feed.favoriteArtistsList.map((artist, idx) => (
                    <ArtistPortrait
                      key={`favart-${artist.name}-${idx}`}
                      name={cleanTitle(artist.name)}
                      imageUrl={artist.imageUrl}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/search",
                          params: { q: artist.name },
                        })
                      }
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 4. DISCOVER MORE (Diverse Candidate Discovery Stream) */}
            {feed.discoverMore.length > 0 && (
              <View className="mb-8">
                <AppText variant="sectionTitle" className="text-base font-black mb-3 px-0.5">
                  Discover More
                </AppText>
                {feed.discoverMore.map((item, index) => (
                  <SongRow
                    key={`disc-${item.id}`}
                    songId={item.id}
                    title={cleanTitle(item.title)}
                    artist={cleanTitle(item.artist)}
                    artworkUri={item.artwork}
                    duration={formatDuration(item.duration)}
                    isPlaying={currentTrack?.id === item.id}
                    onPress={() => handlePlaySong(feed.discoverMore, index)}
                    onDownloadPress={() => {
                      if (isSongDownloaded(item.id)) {
                        removeSongDownload(item.id);
                      } else {
                        downloadSongTrack(item);
                      }
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        ) : null}
      </Screen>

      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
