import React, { useState } from "react";
import { StyleSheet, Text, ScrollView, Pressable } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Fonts } from "@/constants/theme";

const CHIPS = ["All", "Music", "Podcasts"];

export const FilterChips: React.FC = () => {
  const theme = useTheme();
  const [selectedChip, setSelectedChip] = useState("All");

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      {CHIPS.map((chip) => {
        const isSelected = selectedChip === chip;
        return (
          <Pressable
            key={chip}
            onPress={() => setSelectedChip(chip)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isSelected
                  ? theme.primary
                  : theme.surface,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected
                    ? "#FFFFFF"
                    : theme.textSecondary,
                },
              ]}
            >
              {chip}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  container: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontFamily: Fonts.nunito.semiBold,
    fontSize: 13,
  },
});
