import React, { useState } from "react";
import { Dimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { QueueModal } from "@/components/common/QueueModal";
import { LyricsModal } from "@/components/common/LyricsModal";
import { AddToPlaylistModal } from "@/components/common/AddToPlaylistModal";
import { useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import { View, Pressable } from "@/tw";

const { width } = Dimensions.get("window");
const ARTWORK_SIZE = Math.min(width - 64, 330);

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
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

export default function PlayerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const {
    currentTrack,
    playbackState,
    isPlaying,
    position,
    duration,
    shuffleEnabled,
    repeatMode,
    togglePlayPause,
    seekTo,
    skipToNext,
    skipToPrevious,
    toggleShuffle,
    toggleRepeat,
    toggleLikeTrack,
    isLiked,
  } = usePlayer();

  const [isSliding, setIsSliding] = useState(false);
  const [slidePosition, setSlidePosition] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  const isBuffering = playbackState === "buffering" || playbackState === "loading";
  const displayPosition = isSliding ? slidePosition : position;
  const maxDuration = duration > 0 ? duration : currentTrack?.duration || 1;
  const liked = currentTrack ? isLiked(currentTrack.id) : false;

  const handleToggleLike = () => {
    if (!currentTrack) return;
    const willBeLiked = !liked;
    toggleLikeTrack(currentTrack);
    showToast(
      willBeLiked ? "Added to Liked Songs" : "Removed from Liked Songs",
      willBeLiked ? "success" : "info"
    );
  };

  return (
    <>
      <Screen
        contentContainerStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 32,
        }}
      >
        {/* Top Header (Sufficient margin to avoid toast banner collision) */}
        <View className="flex-row items-center justify-between mt-4 mb-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/10 active:bg-white/15"
          >
            <Icon name="chevron-down" size={24} color="#FFFFFF" />
          </Pressable>

          <View className="items-center max-w-[200px]">
            <AppText
              variant="caption"
              className="uppercase tracking-widest text-[10px] font-extrabold text-zinc-400"
            >
              NOW PLAYING
            </AppText>
            <AppText
              variant="body"
              className="text-xs font-bold text-zinc-300"
              numberOfLines={1}
            >
              {cleanTitle(currentTrack?.album) || "JioSaavn"}
            </AppText>
          </View>

          <Pressable
            onPress={handleToggleLike}
            hitSlop={12}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/10 active:bg-white/15"
            accessibilityLabel={liked ? "Unlike Song" : "Like Song"}
          >
            <Icon
              name={liked ? "heart-filled" : "heart"}
              size={20}
              color={liked ? "#F43F5E" : "#9CA3AF"}
            />
          </Pressable>
        </View>

        {/* Album Artwork */}
        <View className="items-center my-3">
          <View
            className="rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/60 bg-[#161224] border border-[#2B233D]"
            style={{ width: ARTWORK_SIZE, height: ARTWORK_SIZE }}
          >
            <ArtworkImage
              uri={currentTrack?.artwork}
              iconSize={64}
              className="w-full h-full"
            />
          </View>
        </View>

        {/* Track Title & Artist */}
        <View className="mb-2">
          <AppText variant="songTitle" className="text-xl font-extrabold text-white mb-1 tracking-tight" numberOfLines={2}>
            {cleanTitle(currentTrack?.title) || "No Track Selected"}
          </AppText>
          <AppText variant="artist" className="text-sm font-semibold text-zinc-400" numberOfLines={1}>
            {cleanTitle(currentTrack?.artist) || "Unknown Artist"}
          </AppText>
        </View>

        {/* Progress Seeker Bar */}
        <View className="mb-3">
          <Slider
            style={{ width: "100%", height: 30 }}
            minimumValue={0}
            maximumValue={maxDuration}
            value={displayPosition}
            minimumTrackTintColor="#A855F7"
            maximumTrackTintColor="#2B233D"
            thumbTintColor="#C084FC"
            onValueChange={(val) => {
              setIsSliding(true);
              setSlidePosition(val);
            }}
            onSlidingComplete={(val) => {
              setIsSliding(false);
              seekTo(val);
            }}
          />
          <View className="flex-row justify-between px-1 mt-0.5">
            <AppText variant="caption" className="text-xs font-semibold text-zinc-400">
              {formatTime(displayPosition)}
            </AppText>
            <AppText variant="caption" className="text-xs font-semibold text-zinc-400">
              {formatTime(maxDuration)}
            </AppText>
          </View>
        </View>

        {/* Playback Controls Row */}
        <View className="flex-row items-center justify-around mb-4">
          {/* Shuffle Toggle */}
          <Pressable
            onPress={() => {
              toggleShuffle();
              showToast(
                !shuffleEnabled ? "Shuffle On" : "Shuffle Off",
                "info"
              );
            }}
            className="p-2.5 rounded-full active:scale-[0.90]"
            accessibilityLabel={`Shuffle ${shuffleEnabled ? "On" : "Off"}`}
          >
            <Icon
              name="shuffle"
              size={22}
              color={shuffleEnabled ? "#C084FC" : "#9CA3AF"}
            />
          </Pressable>

          {/* Skip Previous */}
          <Pressable
            onPress={skipToPrevious}
            className="p-2.5 rounded-full active:scale-[0.90]"
            accessibilityLabel="Previous Song"
          >
            <Icon name="skip-back" size={28} color="#FFFFFF" />
          </Pressable>

          {/* Main Play/Pause Button */}
          <Pressable
            onPress={togglePlayPause}
            className="w-16 h-16 rounded-full items-center justify-center bg-purple-600 active:bg-purple-700 active:scale-[0.94] shadow-xl shadow-purple-950/50"
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Pause" : "Play"}
          >
            {isBuffering ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon
                name={isPlaying ? "pause" : "play"}
                size={30}
                color="#FFFFFF"
              />
            )}
          </Pressable>

          {/* Skip Next */}
          <Pressable
            onPress={skipToNext}
            className="p-2.5 rounded-full active:scale-[0.90]"
            accessibilityLabel="Next Song"
          >
            <Icon name="skip-forward" size={28} color="#FFFFFF" />
          </Pressable>

          {/* Repeat Mode Toggle */}
          <Pressable
            onPress={() => {
              toggleRepeat();
              const nextMode =
                repeatMode === "OFF" ? "Repeat All" : repeatMode === "ALL" ? "Repeat One" : "Repeat Off";
              showToast(nextMode, "info");
            }}
            className="p-2.5 rounded-full items-center justify-center active:scale-[0.90] relative"
            accessibilityLabel={`Repeat mode ${repeatMode}`}
          >
            <Icon
              name={repeatMode === "ONE" ? "repeat-one" : "repeat"}
              size={22}
              color={repeatMode !== "OFF" ? "#C084FC" : "#9CA3AF"}
            />
          </Pressable>
        </View>

        {/* Secondary Labeled Controls Bar */}
        <View className="flex-row items-center justify-center gap-x-3 pt-1">
          <Pressable
            onPress={() => setShowQueue(true)}
            className="flex-row items-center px-4 py-2.5 rounded-full bg-[#161224] border border-[#2B233D] active:scale-[0.96] active:bg-[#201A30]"
          >
            <Icon name="library" size={15} color="#C084FC" />
            <AppText className="ml-2 text-xs font-bold text-zinc-200">
              Queue
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => setShowAddToPlaylist(true)}
            className="flex-row items-center px-4 py-2.5 rounded-full bg-[#161224] border border-[#2B233D] active:scale-[0.96] active:bg-[#201A30]"
          >
            <Icon name="plus" size={15} color="#C084FC" />
            <AppText className="ml-2 text-xs font-bold text-zinc-200">
              Playlist
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => setShowLyrics(true)}
            className="flex-row items-center px-4 py-2.5 rounded-full bg-[#161224] border border-[#2B233D] active:scale-[0.96] active:bg-[#201A30]"
          >
            <Icon name="music" size={15} color="#C084FC" />
            <AppText className="ml-2 text-xs font-bold text-zinc-200">
              Lyrics
            </AppText>
          </Pressable>
        </View>
      </Screen>

      <QueueModal visible={showQueue} onClose={() => setShowQueue(false)} />
      <LyricsModal visible={showLyrics} onClose={() => setShowLyrics(false)} />
      <AddToPlaylistModal
        track={currentTrack}
        visible={showAddToPlaylist}
        onClose={() => setShowAddToPlaylist(false)}
      />
    </>
  );
}
