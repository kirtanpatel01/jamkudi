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
        className="flex-1 px-6 pt-12 pb-6"
        style={{ backgroundColor: theme.background }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6 pb-4 border-b border-white/10">
          <View className="flex-row items-center flex-1 mr-4">
            <View className="w-12 h-12 rounded-xl overflow-hidden mr-3 bg-zinc-800">
              <ArtworkImage
                uri={currentTrack?.artwork}
                iconSize={20}
                className="w-full h-full"
              />
            </View>

            <View className="flex-1">
              <AppText
                variant="songTitle"
                className="text-base font-bold mb-0.5"
                numberOfLines={1}
              >
                {currentTrack?.title || "Song Lyrics"}
              </AppText>
              <AppText
                variant="artist"
                className="text-xs text-zinc-400 font-medium"
                numberOfLines={1}
              >
                {currentTrack?.artist || "Unknown Artist"}
              </AppText>
            </View>
          </View>

          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-white/10"
          >
            <Icon name="chevron-down" size={26} color={theme.textPrimary} />
          </Pressable>
        </View>

        {/* Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.primary} />
            <AppText variant="caption" className="mt-3 text-zinc-400 font-medium">
              Loading Lyrics...
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
                className="text-lg leading-9 text-center font-semibold text-zinc-200"
              >
                {lyrics}
              </AppText>
            ) : (
              <View className="py-20 items-center">
                <Icon name="music" size={48} color={theme.textMuted} />
                <AppText
                  variant="body"
                  className="mt-4 text-center text-zinc-400 font-medium px-4 mb-4"
                >
                  Lyrics are unavailable for this song.
                </AppText>
                <Pressable
                  onPress={fetchLyricsData}
                  className="px-5 py-2 rounded-full bg-purple-600 active:bg-purple-700 border border-purple-500"
                >
                  <AppText className="text-xs font-bold text-white">Retry</AppText>
                </Pressable>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};
