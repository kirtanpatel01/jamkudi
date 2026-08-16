import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { AppText } from "@/components/common/AppText";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { useTheme } from "@/hooks/useTheme";
import { View, Pressable } from "@/tw";

interface ArtistPortraitProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const ArtistPortrait: React.FC<ArtistPortraitProps> = ({
  name,
  imageUrl,
  size = 76,
  onPress,
  style,
  className = "",
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className={`items-center active:scale-[0.95] ${className}`}
      style={[{ width: size }, style]}
    >
      <View
        className="rounded-full overflow-hidden mb-2 items-center justify-center"
        style={{
          width: size,
          height: size,
          backgroundColor: theme.surface,
        }}
      >
        <ArtworkImage uri={imageUrl} width={size} height={size} iconSize={size / 3} />
      </View>

      <AppText
        variant="caption"
        color="textPrimary"
        className="text-xs font-semibold text-center"
        numberOfLines={1}
      >
        {name}
      </AppText>
    </Pressable>
  );
};
