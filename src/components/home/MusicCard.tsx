import React from "react";
import { StyleSheet, Text, View, Pressable, Image } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Fonts } from "@/constants/theme";
import { MediaItem } from "@/data/mockMusic";

interface MusicCardProps {
  item: MediaItem;
}

export const MusicCard: React.FC<MusicCardProps> = ({ item }) => {
  const theme = useTheme();
  const isArtist = item.type === "artist";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={[
            styles.image,
            isArtist ? styles.artistImage : styles.squareImage,
          ]}
          resizeMode="cover"
        />
        {item.tag && (
          <View
            style={[
              styles.tagContainer,
              { backgroundColor: theme.primary },
            ]}
          >
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>
        )}
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.title,
          { color: theme.text },
          isArtist && styles.artistTitle,
        ]}
      >
        {item.title}
      </Text>

      {item.description && (
        <Text
          numberOfLines={2}
          style={[styles.description, { color: theme.textSecondary }]}
        >
          {item.description}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    marginRight: 14,
  },
  imageContainer: {
    marginBottom: 8,
    position: "relative",
  },
  image: {
    width: 140,
    height: 140,
  },
  squareImage: {
    borderRadius: 8,
  },
  artistImage: {
    borderRadius: 70,
  },
  tagContainer: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: "#FFFFFF",
    fontFamily: Fonts.nunito.bold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: Fonts.nunito.bold,
    fontSize: 13,
    marginBottom: 3,
  },
  artistTitle: {
    textAlign: "center",
  },
  description: {
    fontFamily: Fonts.nunito.regular,
    fontSize: 11,
    lineHeight: 15,
  },
});
