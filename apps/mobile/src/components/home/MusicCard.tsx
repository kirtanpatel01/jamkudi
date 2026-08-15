import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { MediaItem } from "@/data/mockMusic";
import { AppText } from "@/components/common/AppText";
import { FontFamily } from "@/constants/theme";
import { View, Pressable } from "@/tw";
import { Image } from "@/tw/image";

interface MusicCardProps {
  item: MediaItem;
}

export const MusicCard: React.FC<MusicCardProps> = ({ item }) => {
  const theme = useTheme();
  const isArtist = item.type === "artist";

  return (
    <Pressable className="w-[140px] mr-[14px] active:opacity-85">
      <View className="mb-2 relative">
        <Image
          source={{ uri: item.imageUrl }}
          className={`w-[140px] h-[140px] ${isArtist ? "rounded-full" : "rounded-lg"}`}
        />
        {item.tag ? (
          <View
            className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded"
            style={{ backgroundColor: theme.primary }}
          >
            <AppText
              className="text-white text-[9px] tracking-wider"
              style={{ fontFamily: FontFamily.nunito.bold }}
            >
              {item.tag}
            </AppText>
          </View>
        ) : null}
      </View>

      <AppText
        numberOfLines={1}
        className={`text-[13px] mb-[3px] ${isArtist ? "text-center" : ""}`}
        style={{
          fontFamily: FontFamily.nunito.bold,
          color: theme.textPrimary,
        }}
      >
        {item.title}
      </AppText>

      {item.description ? (
        <AppText
          numberOfLines={2}
          className="text-[11px] leading-[15px]"
          style={{
            fontFamily: FontFamily.nunito.regular,
            color: theme.textSecondary,
          }}
        >
          {item.description}
        </AppText>
      ) : null}
    </Pressable>
  );
};
