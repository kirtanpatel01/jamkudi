import React, { useState } from "react";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { IconButton } from "@/components/common/IconButton";
import { FilterChip } from "@/components/common/FilterChip";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { RECENTLY_PLAYED_DATA } from "@/data/mockMusic";
import { BorderRadius } from "@/constants/theme";
import { View, Pressable } from "@/tw";

export default function LibraryScreen() {
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState("Playlists");

  const filters = ["Playlists", "Artists", "Albums"];

  return (
    <Screen scrollable>
      <View className="flex-row justify-between items-center mb-4">
        <AppText variant="screenTitle">Your Library</AppText>
        <IconButton
          name="settings"
          size={20}
          onPress={() => {}}
          accessibilityLabel="Add to Library"
          variant="subtle"
        />
      </View>

      {/* Filter chips */}
      <View className="flex-row mb-6">
        {filters.map((filter) => (
          <FilterChip
            key={filter}
            label={filter}
            active={activeFilter === filter}
            onPress={() => setActiveFilter(filter)}
          />
        ))}
      </View>

      <View className="gap-4">
        {/* Liked songs row */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Liked Songs playlist with 142 songs"
          className="flex-row items-center active:opacity-80"
        >
          <View
            className="w-[56px] h-[56px] rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: theme.favorite }}
          >
            <Icon name="heart-filled" size={24} color="#FFFFFF" />
          </View>
          <View className="flex-1 ml-2">
            <AppText variant="songTitle">Liked Songs</AppText>
            <AppText variant="caption" color={theme.textSecondary}>
              Playlist • 142 songs
            </AppText>
          </View>
        </Pressable>

        {/* Library items */}
        {RECENTLY_PLAYED_DATA.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.description}`}
            className="flex-row items-center active:opacity-80"
          >
            <ArtworkImage
              uri={item.imageUrl}
              size={56}
              radius={item.type === "artist" ? BorderRadius.full : BorderRadius.md}
              accessibilityLabel={`${item.title} cover`}
            />
            <View className="flex-1 ml-3">
              <AppText variant="songTitle">{item.title}</AppText>
              <AppText variant="caption" color={theme.textSecondary}>
                {item.description}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
