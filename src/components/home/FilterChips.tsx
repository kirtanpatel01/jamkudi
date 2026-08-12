import React, { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { AppText } from "@/components/common/AppText";
import { FontFamily } from "@/constants/theme";
import { ScrollView, Pressable } from "@/tw";

const CHIPS = ["All", "Music", "Podcasts"];

export const FilterChips: React.FC = () => {
  const theme = useTheme();
  const [selectedChip, setSelectedChip] = useState("All");

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-5 -mx-5"
      contentContainerClassName="px-5 gap-2"
    >
      {CHIPS.map((chip) => {
        const isSelected = selectedChip === chip;
        return (
          <Pressable
            key={chip}
            onPress={() => setSelectedChip(chip)}
            className="px-4 py-2 rounded-full active:opacity-80"
            style={{
              backgroundColor: isSelected ? theme.primary : theme.surface,
            }}
          >
            <AppText
              className="text-[13px]"
              style={{
                fontFamily: FontFamily.nunito.semiBold,
                color: isSelected ? "#FFFFFF" : theme.textSecondary,
              }}
            >
              {chip}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
