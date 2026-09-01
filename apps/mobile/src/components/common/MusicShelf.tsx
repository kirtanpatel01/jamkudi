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
  itemWidth = 144,
  onItemPress,
  style,
  className = "",
}) => {
  const theme = useTheme();

  if (!items || items.length === 0) return null;

  return (
    <View className={`mb-8 ${className}`} style={style}>
      {title ? (
        <AppText variant="sectionTitle" className="text-base font-extrabold mb-3.5 px-0.5 tracking-tight">
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
              className="active:scale-[0.96] active:opacity-90"
              style={{ width: itemWidth }}
            >
              {/* Artwork Container */}
              <View
                className="rounded-2xl overflow-hidden mb-2 relative shadow-md"
                style={{
                  width: itemWidth,
                  height: itemWidth,
                  backgroundColor: theme.surface,
                }}
              >
                <ArtworkImage uri={item.artworkUri} width={itemWidth} height={itemWidth} iconSize={Math.max(24, Math.round(itemWidth * 0.28))} />
                {isCurrent && (
                  <View className="absolute inset-0 bg-black/50 items-center justify-center">
                    <View
                      style={{
                        width: Math.max(28, Math.round(itemWidth * 0.32)),
                        height: Math.max(28, Math.round(itemWidth * 0.32)),
                      }}
                      className="rounded-full bg-purple-600 items-center justify-center shadow-lg"
                    >
                      <Icon name={isPlaying ? "pause" : "play"} size={Math.max(14, Math.round(itemWidth * 0.16))} color="#FFFFFF" />
                    </View>
                  </View>
                )}
              </View>

              {/* Title & Subtitle */}
              <AppText
                variant="songTitle"
                color={isCurrent ? "primary" : "textPrimary"}
                className={`text-sm ${isCurrent ? "font-extrabold text-purple-400" : "font-bold"}`}
                numberOfLines={1}
              >
                {item.title}
              </AppText>

              {item.subtitle ? (
                <AppText
                  variant="artist"
                  color="textSecondary"
                  className="text-xs font-semibold mt-0.5"
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
