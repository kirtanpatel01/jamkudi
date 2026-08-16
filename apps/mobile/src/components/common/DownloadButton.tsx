import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useDownloads } from '@/context/DownloadContext';
import { View, Pressable } from '@/tw';

export interface DownloadButtonProps {
  songId: string;
  songTitle?: string;
  songArtist?: string;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  songId,
  songTitle,
  songArtist,
  onPress,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const theme = useTheme();
  const { isSongDownloaded, getSongState, getSongProgress } = useDownloads();

  const isDownloaded = isSongDownloaded(songId, songTitle, songArtist);
  const songState = getSongState(songId, songTitle, songArtist);
  const isDownloading = songState === 'downloading';
  const progress = getSongProgress(songId);

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  const containerPadding = size === 'sm' ? 'p-1' : size === 'lg' ? 'p-2.5' : 'p-1.5';

  let accessLabel = 'Download song for offline listening';
  if (isDownloaded) {
    accessLabel = 'Song downloaded for offline listening. Tap to remove download.';
  } else if (isDownloading) {
    accessLabel = `Downloading song, ${progress}% completed`;
  } else if (songState === 'failed') {
    accessLabel = 'Download failed. Tap to retry.';
  }

  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation();
        onPress();
      }}
      className={`flex-row items-center justify-center rounded-full active:opacity-75 ${containerPadding} ${className}`}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessLabel}
    >
      {isDownloading ? (
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#9B7CFF" />
          {showLabel && (
            <AppText variant="caption" className="ml-2 text-xs font-bold text-[#9B7CFF]">
              {progress > 0 ? `${progress}%` : 'Saving...'}
            </AppText>
          )}
        </View>
      ) : isDownloaded ? (
        <View className="flex-row items-center">
          <Icon name="check-circle" size={iconSize} color="#9B7CFF" />
          {showLabel && (
            <AppText variant="caption" className="ml-2 text-xs font-bold text-[#9B7CFF]">
              Downloaded
            </AppText>
          )}
        </View>
      ) : songState === 'failed' ? (
        <View className="flex-row items-center">
          <Icon name="alert-circle" size={iconSize} color="#F87171" />
          {showLabel && (
            <AppText variant="caption" className="ml-2 text-xs font-bold text-red-400">
              Retry
            </AppText>
          )}
        </View>
      ) : (
        <View className="flex-row items-center">
          <Icon name="download" size={iconSize} color={theme.textMuted} />
          {showLabel && (
            <AppText variant="caption" color="textSecondary" className="ml-2 text-xs font-bold">
              Download
            </AppText>
          )}
        </View>
      )}
    </Pressable>
  );
};
