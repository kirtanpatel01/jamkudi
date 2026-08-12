import React from "react";
import { Screen } from "@/components/common/Screen";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { useTheme } from "@/hooks/useTheme";
import { View, TextInput } from "@/tw";

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
      <AppText variant="screenTitle" className="mb-4">
        Search
      </AppText>

      <View
        className="flex-row items-center px-4 h-12 rounded-xl border mb-6"
        style={{
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
        }}
      >
        <Icon name="search" size={18} color={theme.textMuted} />
        <TextInput
          placeholder="What do you want to listen to?"
          placeholderTextColor={theme.textSecondary}
          className="flex-1 ml-3 text-sm"
          style={{ color: theme.textPrimary }}
          accessibilityLabel="Search input field"
        />
      </View>

      <AppText variant="sectionTitle" className="mb-4">
        Explore Genres
      </AppText>

      <View className="flex-row flex-wrap gap-4">
        {GENRES.map((genre) => (
          <View
            key={genre.id}
            className="w-[47%] h-[90px] rounded-xl p-4 justify-end"
            style={{ backgroundColor: genre.color }}
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
