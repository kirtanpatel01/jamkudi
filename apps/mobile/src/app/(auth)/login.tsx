import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/common/AppText';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { Icon } from '@/components/common/Icon';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { View, Pressable } from '@/tw';

const JAMKUDI_LOGO = require('../../../assets/images/icon.jpg');

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, error, clearError } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLocalError(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Please enter your email address');
      return;
    }

    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(trimmedEmail, password);
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

  const errorMessage = localError || error;

  return (
    <Screen paddingHorizontal={24}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header App Icon & Titles */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-3xl overflow-hidden border border-purple-500/30 bg-zinc-900 items-center justify-center mb-4">
              <Image
                source={JAMKUDI_LOGO}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>

            <AppText variant="screenTitle" className="text-3xl font-extrabold text-center mb-1.5 text-white tracking-tight">
              Jamkudi Music
            </AppText>

            <AppText variant="caption" className="text-sm text-zinc-400 font-medium text-center px-4">
              Sign in to continue listening to your personal library
            </AppText>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View className="p-4 rounded-2xl bg-red-950/90 border border-red-500/60 flex-row items-center mb-6">
              <Icon name="alert-circle" size={22} color="#F87171" className="mr-3" />
              <AppText variant="caption" className="text-sm text-red-200 flex-1 font-semibold">
                {errorMessage}
              </AppText>
            </View>
          )}

          {/* Form Fields */}
          <AuthInput
            label="Email Address"
            icon="mail"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errorMessage) setLocalError(null);
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
          />

          <AuthInput
            label="Password"
            icon="lock"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errorMessage) setLocalError(null);
            }}
            placeholder="Enter password"
            isPassword={true}
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
            <AppText variant="caption" className="text-sm text-zinc-400 font-medium mr-1.5">
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
