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
        disabled || loading ? 'opacity-60 bg-purple-700' : 'bg-purple-600 active:bg-purple-700 active:scale-[0.98]'
      }`}
      style={[
        {
          shadowColor: '#A855F7',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 5,
        },
        style,
      ]}
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
