import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { MediaItem } from "@/data/mockMusic";
import { MusicCard } from "./MusicCard";
import { AppText } from "@/components/common/AppText";
import { FontFamily } from "@/constants/theme";
import { View, ScrollView, Pressable } from "@/tw";

interface MusicSectionProps {
  title: string;
  data: MediaItem[];
  showAll?: boolean;
}

export const MusicSection: React.FC<MusicSectionProps> = ({
  title,
  data,
  showAll = true,
}) => {
  const theme = useTheme();

  return (
    <View className="mb-7">
      <View className="flex-row justify-between items-center mb-3.5">
        <AppText
          variant="sectionTitle"
          className="text-xl tracking-tight"
          style={{
            fontFamily: FontFamily.fredoka.semiBold,
            color: theme.text,
          }}
        >
          {title}
        </AppText>
        {showAll && (
          <Pressable hitSlop={8}>
            <AppText
              className="text-xs"
              style={{
                fontFamily: FontFamily.nunito.semiBold,
                color: theme.textSecondary,
              }}
            >
              Show all
            </AppText>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5"
        contentContainerClassName="px-5"
      >
        {data.map((item) => (
          <MusicCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
};
