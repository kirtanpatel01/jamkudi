import React from "react";
import { ScrollView, StyleProp, ViewStyle } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { useTheme } from "@/hooks/useTheme";
import { View, Pressable } from "@/tw";

export interface ShelfItem {
  id: string;
  title: string;
  subtitle?: string;
  artworkUri?: string | null;
}

interface MusicShelfProps {
  title?: string;
  items: ShelfItem[];
  currentId?: string;
  isPlaying?: boolean;
  itemWidth?: number;
  onItemPress: (item: ShelfItem, index: number) => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const MusicShelf: React.FC<MusicShelfProps> = ({
  title,
  items,
  currentId,
  isPlaying = false,
  itemWidth = 140,
  onItemPress,
  style,
  className = "",
}) => {
  const theme = useTheme();

  if (!items || items.length === 0) return null;

  return (
    <View className={`mb-8 ${className}`} style={style}>
      {title ? (
        <AppText variant="sectionTitle" className="text-base font-bold mb-3.5 px-0.5">
          {title}
        </AppText>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16 }}
      >
        {items.map((item, index) => {
          const isCurrent = currentId === item.id;
          return (
            <Pressable
              key={`${item.id}-${index}`}
              onPress={() => onItemPress(item, index)}
              className="active:scale-[0.96]"
              style={{ width: itemWidth }}
            >
              {/* Borderless Artwork Tile */}
              <View
                className="rounded-2xl overflow-hidden mb-2 relative shadow-md shadow-black/10"
                style={{
                  width: itemWidth,
                  height: itemWidth,
                  backgroundColor: theme.surface,
                }}
              >
                <ArtworkImage uri={item.artworkUri} width={itemWidth} height={itemWidth} iconSize={36} />
                {isCurrent && (
                  <View className="absolute inset-0 bg-black/50 items-center justify-center">
                    <View className="w-10 h-10 rounded-full bg-[#9B7CFF] items-center justify-center">
                      <Icon name={isPlaying ? "pause" : "play"} size={20} color="#FFFFFF" />
                    </View>
                  </View>
                )}
              </View>

              <AppText
                variant="songTitle"
                color={isCurrent ? "primary" : "textPrimary"}
                className={`text-sm ${isCurrent ? "font-bold text-[#9B7CFF]" : "font-semibold"}`}
                numberOfLines={1}
              >
                {item.title}
              </AppText>

              {item.subtitle ? (
                <AppText
                  variant="artist"
                  color="textSecondary"
                  className="text-xs font-medium mt-0.5"
                  numberOfLines={1}
                >
                  {item.subtitle}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};
