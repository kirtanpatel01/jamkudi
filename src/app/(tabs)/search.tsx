import React from "react";
import { StyleSheet, View, TextInput } from "react-native";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

const GENRES = [
  { id: "g1", title: "Bollywood", color: "#8B5CF6" },
  { id: "g2", title: "Punjabi", color: "#7C3AED" },
  { id: "g3", title: "Gujarati", color: "#F43F5E" },
  { id: "g4", title: "Pop Hits", color: "#6D28D9" },
  { id: "g5", title: "Hip-Hop", color: "#4C1D95" },
  { id: "g6", title: "Lo-Fi Beats", color: "#8B5CF6" },
];

export default function SearchScreen() {
  const theme = useTheme();

  return (
    <Screen scrollable>
      <AppText variant="screenTitle" style={styles.title}>
        Search
      </AppText>

      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
          },
        ]}
      >
        <Icon name="search" size={18} color={theme.textMuted} />
        <TextInput
          placeholder="What do you want to listen to?"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.textPrimary }]}
          accessibilityLabel="Search input field"
        />
      </View>

      <AppText variant="sectionTitle" style={styles.sectionTitle}>
        Explore Genres
      </AppText>

      <View style={styles.genreGrid}>
        {GENRES.map((genre) => (
          <View
            key={genre.id}
            style={[styles.genreCard, { backgroundColor: genre.color }]}
          >
            <AppText variant="cardTitle" color="#FFFFFF">
              {genre.title}
            </AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 14,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  genreCard: {
    width: "47%",
    height: 90,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    justifyContent: "flex-end",
  },
});
