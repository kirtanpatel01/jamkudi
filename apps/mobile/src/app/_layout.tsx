import "../global.css";
import { Stack, useSegments, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StatusBar as RNStatusBar, View, ActivityIndicator } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { PlaylistProvider } from "@/context/PlaylistContext";
import { ToastProvider } from "@/context/ToastContext";
import { DownloadProvider } from "@/context/DownloadContext";
import { MiniPlayer } from "@/components/common/MiniPlayer";
import {
  useFonts,
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from "@expo-google-fonts/fredoka";
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync().catch(() => {});

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
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
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
  );
}
