import React from "react";
import { StyleSheet, Text, View, Pressable, Image, Dimensions } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Fonts } from "@/constants/theme";
import { QUICK_ACCESS_DATA, QuickAccessItem } from "@/data/mockMusic";
import { Icon } from "@/components/common/Icon";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // 20px padding each side + 8px gap

export const QuickAccessGrid: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {QUICK_ACCESS_DATA.map((item: QuickAccessItem) => (
        <Pressable
          key={item.id}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.surface,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {item.isGradient ? (
            <View
              style={[
                styles.gradientArtwork,
                { backgroundColor: theme.primary },
              ]}
            >
              <Icon name="heart-filled" size={18} color="#FFFFFF" />
            </View>
          ) : (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.artwork}
              resizeMode="cover"
            />
          )}

          <Text
            numberOfLines={2}
            style={[styles.title, { color: theme.text }]}
          >
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 28,
  },
  card: {
    width: CARD_WIDTH,
    height: 54,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  artwork: {
    width: 54,
    height: 54,
  },
  gradientArtwork: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontFamily: Fonts.nunito.semiBold,
    fontSize: 13,
    paddingHorizontal: 10,
    lineHeight: 16,
  },
});
