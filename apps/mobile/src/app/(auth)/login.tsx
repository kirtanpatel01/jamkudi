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

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, error, clearError } = useAuth();
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
      setEmailError('Please enter your email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Please enter your password');
      valid = false;
    }

    return valid;
  };

  const handleLogin = async () => {
    setLocalError(null);
    clearError();

    if (!validateInput()) return;

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      showToast('Welcome back!', 'success');
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password';
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
              Jamkudi Music
            </AppText>

            <AppText variant="caption" color="textSecondary" className="text-sm font-medium text-center px-4 leading-5">
              Sign in to continue listening to your personal library
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
            label="PASSWORD"
            icon="lock"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
              if (bannerError) setLocalError(null);
            }}
            placeholder="Enter password"
            isPassword={true}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            error={passwordError}
          />

          {/* Primary CTA Button */}
          <View className="mt-2 mb-6">
            <AuthButton
              title="Sign In"
              onPress={handleLogin}
              loading={submitting}
              disabled={submitting}
            />
          </View>

          {/* Navigation Link to Signup */}
          <View className="flex-row items-center justify-center py-2">
            <AppText variant="caption" color="textSecondary" className="text-sm font-medium mr-1.5">
              Don't have an account?
            </AppText>
            <Pressable
              onPress={() => router.push('/(auth)/signup')}
              hitSlop={8}
              className="py-1 px-1 active:opacity-70"
            >
              <AppText variant="caption" className="text-sm font-bold text-purple-400">
                Sign Up
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
