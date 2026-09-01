import "../global.css";
import { Stack, useSegments, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StatusBar as RNStatusBar, View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { PlaylistProvider } from "@/context/PlaylistContext";
import { ToastProvider } from "@/context/ToastContext";
import { DownloadProvider } from "@/context/DownloadContext";
import { MiniPlayer } from "@/components/common/MiniPlayer";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught app error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: "#16131F", padding: 24, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#FF4D4D", fontSize: 20, fontWeight: "bold", marginBottom: 12, textAlign: "center" }}>
            App Encountered An Error
          </Text>
          <Text style={{ color: "#A0A0B0", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
            {this.state.error?.message || "An unexpected error occurred during launch."}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: "#8A2BE2", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootNavigation() {
  const theme = useTheme();
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === "android") {
      RNStatusBar.setBackgroundColor(theme.background, true);
      RNStatusBar.setBarStyle(theme.isDark ? "light-content" : "dark-content", true);
    }
  }, [theme.background, theme.isDark]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const currentScreen = segments[1];

    if (!session && (!inAuthGroup || currentScreen === "onboarding")) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup && currentScreen !== "onboarding") {
      router.replace("/(tabs)");
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        style={theme.isDark ? "light" : "dark"}
        animated={true}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="player"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
      {session ? <MiniPlayer /> : null}
    </>
  );
}

export default function RootLayout() {
  const theme = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      RNStatusBar.setBackgroundColor(theme.background, true);
      RNStatusBar.setBarStyle(theme.isDark ? "light-content" : "dark-content", true);
    }
  }, [theme.background, theme.isDark]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar
          style={theme.isDark ? "light" : "dark"}
          animated={true}
        />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar
          style={theme.isDark ? "light" : "dark"}
          animated={true}
        />
        <ToastProvider>
          <AuthProvider>
            <DownloadProvider>
              <PlayerProvider>
                <PlaylistProvider>
                  <RootNavigation />
                </PlaylistProvider>
              </PlayerProvider>
            </DownloadProvider>
          </AuthProvider>
        </ToastProvider>
      </View>
    </ErrorBoundary>
  );
}
