import React, { useEffect, useState } from "react";
import { Modal, ScrollView, ActivityIndicator } from "react-native";
import { usePlayer } from "@/context/PlayerContext";
import { useTheme } from "@/hooks/useTheme";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { getLyrics } from "@/services/jiosaavn";
import { View, Pressable } from "@/tw";

interface LyricsModalProps {
  visible: boolean;
  onClose: () => void;
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

export const LyricsModal: React.FC<LyricsModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const { currentTrack } = usePlayer();

  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLyricsData = () => {
    if (!currentTrack?.id) return;
    setLoading(true);
    setLyrics(null);

    getLyrics(currentTrack.id).then((fetchedLyrics) => {
      setLyrics(fetchedLyrics);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (visible && currentTrack?.id) {
      fetchLyricsData();
    }
  }, [visible, currentTrack?.id]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        className="flex-1 px-6 pt-4 pb-6"
        style={{ backgroundColor: theme.background }}
      >
        {/* Grab Handle Bar */}
        <View className="w-12 h-1.5 rounded-full bg-white/20 self-center mb-4 mt-2" />

        {/* Header */}
        <View className="flex-row items-center justify-between mb-6 pb-4">
          <View className="flex-row items-center flex-1 mr-4">
            <View
              className="w-14 h-14 rounded-2xl overflow-hidden mr-3.5 shrink-0 shadow-md"
              style={{ backgroundColor: theme.surfacePressed }}
            >
              <ArtworkImage
                uri={currentTrack?.artwork}
                iconSize={22}
                className="w-full h-full"
              />
            </View>

            <View className="flex-1 min-w-0">
              <View className="self-start px-2.5 py-0.5 rounded-full bg-purple-500/15 mb-1">
                <AppText variant="caption" className="text-[10px] text-purple-300 font-extrabold tracking-wider uppercase">
                  LYRICS
                </AppText>
              </View>
              <AppText
                variant="songTitle"
                color="textPrimary"
                className="text-base font-extrabold mb-0.5"
                numberOfLines={1}
              >
                {cleanTitle(currentTrack?.title) || "Song Lyrics"}
              </AppText>
              <AppText
                variant="artist"
                color="textSecondary"
                className="text-xs font-semibold"
                numberOfLines={1}
              >
                {cleanTitle(currentTrack?.artist) || "Unknown Artist"}
              </AppText>
            </View>
          </View>

          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="w-10 h-10 items-center justify-center rounded-full active:opacity-70 active:scale-[0.95] shrink-0"
            style={{ backgroundColor: theme.surface }}
            accessibilityRole="button"
            accessibilityLabel="Close lyrics"
          >
            <Icon name="chevron-down" size={22} color={theme.textPrimary} />
          </Pressable>
        </View>

        {/* Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#C084FC" />
            <AppText variant="caption" color="textSecondary" className="mt-4 font-bold text-xs uppercase tracking-wider">
              Fetching Lyrics...
            </AppText>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-16 pt-2 items-center"
          >
            {lyrics ? (
              <AppText
                variant="body"
                color="textPrimary"
                className="text-lg leading-10 text-center font-bold tracking-tight"
              >
                {lyrics}
              </AppText>
            ) : (
              <View className="py-20 items-center">
                <View className="w-16 h-16 rounded-full bg-purple-500/10 items-center justify-center mb-4">
                  <Icon name="music" size={32} color={theme.primary} />
                </View>
                <AppText
                  variant="body"
                  color="textSecondary"
                  className="mt-2 text-center font-semibold px-4 mb-5 max-w-[280px]"
                >
                  Lyrics are currently unavailable for this track.
                </AppText>
                <Pressable
                  onPress={fetchLyricsData}
                  className="px-6 py-2.5 rounded-full bg-purple-600 active:bg-purple-700 active:scale-[0.95] shadow-md"
                >
                  <AppText className="text-xs font-black text-white uppercase tracking-wider">Retry</AppText>
                </Pressable>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};
