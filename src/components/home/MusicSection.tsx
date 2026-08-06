import React from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Fonts } from "@/constants/theme";
import { MediaItem } from "@/data/mockMusic";
import { MusicCard } from "./MusicCard";

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
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {showAll && (
          <Pressable hitSlop={8}>
            <Text style={[styles.showAll, { color: theme.textSecondary }]}>
              Show all
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {data.map((item) => (
          <MusicCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontFamily: Fonts.fredoka.semiBold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  showAll: {
    fontFamily: Fonts.nunito.semiBold,
    fontSize: 12,
  },
  scrollView: {
    marginHorizontal: -20,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
});
