import React, { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, TextInput as RNTextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/common/AppText';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { Icon } from '@/components/common/Icon';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { View, Pressable, TextInput } from '@/tw';

const JAMKUDI_LOGO = require('../../../assets/images/icon.jpg');

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, error, clearError } = useAuth();
  const { showToast } = useToast();

  const passwordRef = useRef<RNTextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const validateInput = (): boolean => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);
    setLocalError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email address is required');
      valid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError('Please enter a valid email address');
        valid = false;
      }
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }

    return valid;
  };

  const handleSignup = async () => {
    setLocalError(null);
    clearError();

    if (!validateInput()) return;

    setSubmitting(true);
    try {
      await signUp(email.trim(), password);
      showToast('Account created successfully!', 'success');
      router.replace('/(auth)/onboarding');
    } catch (err: any) {
      const msg = err?.message || 'Failed to create account';
      setLocalError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const bannerError = localError || error;

  return (
    <Screen paddingHorizontal={24} hasMiniPlayer={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header App Icon & Titles */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-3xl overflow-hidden border border-purple-500/30 bg-[#191428] items-center justify-center mb-4 shadow-lg shadow-purple-950/50">
              <Image
                source={JAMKUDI_LOGO}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>

            <AppText variant="screenTitle" className="text-3xl font-extrabold text-center mb-1.5 tracking-tight">
              Create Account
            </AppText>

            <AppText variant="caption" color="textSecondary" className="text-sm font-medium text-center px-4 leading-5">
              Join Jamkudi to save playlists and stream music
            </AppText>
          </View>

          {/* Form Error Banner */}
          {bannerError && (
            <View className="p-4 rounded-2xl bg-red-950/90 border border-red-500/60 flex-row items-center mb-6 shadow-md shadow-red-950/50">
              <Icon name="alert-circle" size={22} color="#F87171" className="mr-3" />
              <AppText variant="caption" className="text-sm text-red-200 flex-1 font-semibold">
                {bannerError}
              </AppText>
            </View>
          )}

          {/* Form Fields */}
          <AuthInput
            label="EMAIL ADDRESS"
            icon="mail"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(null);
              if (bannerError) setLocalError(null);
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={emailError}
          />

          <AuthInput
            ref={passwordRef}
            label="PASSWORD (MIN 6 CHARS)"
            icon="lock"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
              if (bannerError) setLocalError(null);
            }}
            placeholder="Create password"
            isPassword={true}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password-new"
            returnKeyType="done"
            onSubmitEditing={handleSignup}
            error={passwordError}
          />

          {/* Primary CTA Button */}
          <View className="mt-2 mb-6">
            <AuthButton
              title="Create Account"
              onPress={handleSignup}
              loading={submitting}
              disabled={submitting}
            />
          </View>

          {/* Navigation Link to Login */}
          <View className="flex-row items-center justify-center py-2">
            <AppText variant="caption" color="textSecondary" className="text-sm font-medium mr-1.5">
              Already have an account?
            </AppText>
            <Pressable
              onPress={() => router.push('/(auth)/login')}
              hitSlop={8}
              className="py-1 px-1 active:opacity-70"
            >
              <AppText variant="caption" className="text-sm font-bold text-purple-400">
                Sign In
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
