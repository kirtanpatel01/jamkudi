import React from "react";
import { View, Image } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/hooks/useTheme";

interface JamkudiMascotProps {
  size?: number;
  moodBadge?: string;
  className?: string;
}

const mascotSource = require("../../../assets/images/icon.jpg");

export const JamkudiMascot: React.FC<JamkudiMascotProps> = ({
  size = 80,
  moodBadge,
  className = "",
}) => {
  const theme = useTheme();

  return (
    <View className={`items-center justify-center ${className}`}>
      {/* Outer soft aura */}
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: size + 20,
          height: size + 20,
          backgroundColor: theme.isDark ? "rgba(155, 124, 255, 0.08)" : "rgba(155, 124, 255, 0.12)",
        }}
      >
        <Image
          source={mascotSource}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          resizeMode="cover"
        />
      </View>

      {moodBadge ? (
        <View
          className="mt-2.5 px-3 py-1 rounded-full flex-row items-center"
          style={{
            backgroundColor: theme.surface,
          }}
        >
          <AppText
            variant="caption"
            className="text-[11px] font-bold text-purple-400 tracking-wider uppercase"
          >
            🎧 {moodBadge}
          </AppText>
        </View>
      ) : null}
    </View>
  );
};
