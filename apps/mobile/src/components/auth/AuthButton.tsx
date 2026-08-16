import React from 'react';
import { ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Pressable } from '@/tw';

export interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      className={`w-full h-14 rounded-2xl items-center justify-center ${
        disabled || loading ? 'opacity-60 bg-[#9B7CFF]' : 'bg-[#9B7CFF] active:bg-[#8062E8] active:scale-[0.98]'
      }`}
      style={[style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <AppText className="text-base font-bold text-white tracking-wide text-center">
          {title}
        </AppText>
      )}
    </Pressable>
  );
};
