import React from "react";
import { Dimensions } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { QUICK_ACCESS_DATA, QuickAccessItem } from "@/data/mockMusic";
import { Icon } from "@/components/common/Icon";
import { AppText } from "@/components/common/AppText";
import { FontFamily } from "@/constants/theme";
import { View, Pressable } from "@/tw";
import { Image } from "@/tw/image";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

export const QuickAccessGrid: React.FC = () => {
  const theme = useTheme();

  return (
    <View className="flex-row flex-wrap gap-2 mb-7">
      {QUICK_ACCESS_DATA.map((item: QuickAccessItem) => (
        <Pressable
          key={item.id}
          className="h-[54px] rounded-lg flex-row items-center overflow-hidden active:opacity-85"
          style={{
            width: CARD_WIDTH,
            backgroundColor: theme.surface,
          }}
        >
          {item.isGradient ? (
            <View
              className="w-[54px] h-[54px] items-center justify-center"
              style={{ backgroundColor: theme.primary }}
            >
              <Icon name="heart-filled" size={18} color="#FFFFFF" />
            </View>
          ) : (
            <Image
              source={{ uri: item.imageUrl }}
              className="w-[54px] h-[54px]"
            />
          )}

          <AppText
            numberOfLines={2}
            className="flex-1 text-[13px] px-2.5 leading-[16px]"
            style={{
              fontFamily: FontFamily.nunito.semiBold,
              color: theme.text,
            }}
          >
            {item.title}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
};
