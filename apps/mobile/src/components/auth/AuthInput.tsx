import React, { forwardRef, useState } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Icon, IconName } from '@/components/common/Icon';
import { useTheme } from '@/hooks/useTheme';
import { View, Pressable } from '@/tw';

export interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon: IconName;
  error?: string | null;
  isPassword?: boolean;
}

export const AuthInput = forwardRef<TextInput, AuthInputProps>(({
  label,
  icon,
  error,
  isPassword = false,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'none',
  keyboardType = 'default',
  autoComplete,
  returnKeyType,
  onSubmitEditing,
  ...rest
}, ref) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getBorderColor = () => {
    if (error) return '#EF4444'; // Red-500
    if (isFocused) return '#A855F7'; // Purple-500
    return theme.isDark ? '#2B233D' : '#E9E5ED';
  };

  const getBackgroundColor = () => {
    if (isFocused) return theme.isDark ? '#1C162E' : '#F9F5FF';
    return theme.isDark ? '#161224' : '#FFFFFF';
  };

  return (
    <View className="mb-5 w-full">
      {/* Field Label */}
      <AppText variant="caption" className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 ml-1">
        {label}
      </AppText>

      {/* Full-width Interactive Container */}
      <Pressable
        onPress={() => {
          if (typeof ref === 'object' && ref?.current) {
            ref.current.focus();
          }
        }}
        className="w-full h-14 px-4 rounded-2xl border flex-row items-center justify-between"
        style={{
          borderColor: getBorderColor(),
          backgroundColor: getBackgroundColor(),
        }}
      >
        {/* Left Icon */}
        <Icon
          name={icon}
          size={20}
          color={error ? '#F87171' : isFocused ? '#C084FC' : theme.isDark ? '#9CA3AF' : '#77717F'}
          className="mr-3"
        />

        {/* TextInput occupying full available width */}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.isDark ? '#52525B' : '#9CA3AF'}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 h-full text-base font-semibold py-0"
          style={{
            color: theme.isDark ? '#FFFFFF' : '#18151D',
          }}
          {...rest}
        />

        {/* Far-right Password Eye Toggle Button */}
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={12}
            className="p-2 -mr-1 items-center justify-center rounded-full active:bg-white/10 ml-2"
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color={showPassword ? '#C084FC' : theme.isDark ? '#9CA3AF' : '#77717F'}
            />
          </Pressable>
        )}
      </Pressable>

      {/* Field Level Error Message */}
      {error && (
        <AppText variant="caption" className="text-xs text-red-400 font-semibold mt-1.5 ml-1">
          {error}
        </AppText>
      )}
    </View>
  );
});

AuthInput.displayName = 'AuthInput';

