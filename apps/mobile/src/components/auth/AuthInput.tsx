import React, { forwardRef, useState } from 'react';
import { type TextInputProps, TextInput as RNTextInput } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { Icon, IconName } from '@/components/common/Icon';
import { useTheme } from '@/hooks/useTheme';
import { View, Pressable, TextInput } from '@/tw';

export interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon: IconName;
  error?: string | null;
  isPassword?: boolean;
}

export const AuthInput = forwardRef<RNTextInput, AuthInputProps>(({
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

  const getBackgroundColor = () => {
    if (isFocused) return theme.surfacePressed;
    return theme.surface;
  };

  return (
    <View className="mb-5 w-full">
      {/* Field Label */}
      <AppText variant="caption" color="textSecondary" className="text-xs font-bold uppercase tracking-wider mb-2 ml-1">
        {label}
      </AppText>

      {/* Full-width Interactive Container */}
      <Pressable
        onPress={() => {
          if (typeof ref === 'object' && ref?.current) {
            ref.current.focus();
          }
        }}
        className="w-full h-14 px-4 rounded-2xl flex-row items-center justify-between"
        style={{
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
        {isPassword ? (
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
        ) : null}
      </Pressable>

      {/* Field Level Error Message */}
      {error ? (
        <AppText variant="caption" className="text-xs text-red-400 font-semibold mt-1.5 ml-1">
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

AuthInput.displayName = 'AuthInput';

