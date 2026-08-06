import React, { useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { IconButton } from "@/components/common/IconButton";
import { FilterChip } from "@/components/common/FilterChip";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { RECENTLY_PLAYED_DATA } from "@/data/mockMusic";
import { BorderRadius, Spacing } from "@/constants/theme";

export default function LibraryScreen() {
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState("Playlists");

  const filters = ["Playlists", "Artists", "Albums"];

  return (
    <Screen scrollable>
      <View style={styles.header}>
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
      <View style={styles.chipRow}>
        {filters.map((filter) => (
          <FilterChip
            key={filter}
            label={filter}
            active={activeFilter === filter}
            onPress={() => setActiveFilter(filter)}
          />
        ))}
      </View>

      <View style={styles.list}>
        {/* Liked songs row */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Liked Songs playlist with 142 songs"
          style={({ pressed }) => [
            styles.itemRow,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <View
            style={[
              styles.likedArt,
              { backgroundColor: theme.favorite },
            ]}
          >
            <Icon name="heart-filled" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.itemTextContainer}>
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
            style={({ pressed }) => [
              styles.itemRow,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ArtworkImage
              uri={item.imageUrl}
              size={56}
              radius={item.type === "artist" ? BorderRadius.full : BorderRadius.md}
              accessibilityLabel={`${item.title} cover`}
            />
            <View style={styles.itemTextContainer}>
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

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
  },
  list: {
    gap: Spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  likedArt: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  itemTextContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
});
