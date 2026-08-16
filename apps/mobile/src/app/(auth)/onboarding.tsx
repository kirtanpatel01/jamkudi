import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput as RNTextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { ArtworkImage } from '@/components/common/ArtworkImage';
import { Icon } from '@/components/common/Icon';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { FEATURED_ARTISTS, searchArtists } from '@/services/jiosaavn';
import { Pressable, View, TextInput } from '@/tw';

type Step = 1 | 2 | 3;

type SelectedArtist = {
  id: string;
  name: string;
  imageUrl?: string;
};

const GENRES = [
  { id: 'pop', label: 'Pop', emoji: '🎤' },
  { id: 'hip-hop', label: 'Hip-Hop', emoji: '🎧' },
  { id: 'bollywood', label: 'Bollywood', emoji: '🎬' },
  { id: 'indie', label: 'Indie', emoji: '🎸' },
  { id: 'rock', label: 'Rock', emoji: '🤘' },
  { id: 'rnb', label: 'R&B', emoji: '🎷' },
  { id: 'electronic', label: 'Electronic', emoji: '🎹' },
  { id: 'lo-fi', label: 'Lo-fi', emoji: '☕' },
  { id: 'classical', label: 'Classical', emoji: '🎻' },
  { id: 'gujarati', label: 'Gujarati', emoji: '🪘' },
  { id: 'punjabi', label: 'Punjabi', emoji: '🪗' },
];

const MAX_ARTISTS = 5;

function normalizeArtist(artist: any): SelectedArtist {
  const images = Array.isArray(artist?.image) ? artist.image : [];
  const bestImage = images.find((image: any) => image?.quality === '500x500') || images[images.length - 1];

  return {
    id: String(artist?.id || artist?.name || ''),
    name: String(artist?.name || artist?.title || 'Unknown artist'),
    imageUrl:
      artist?.imageUrl ||
      (typeof artist?.image === 'string' ? artist.image : '') ||
      (typeof bestImage === 'string' ? bestImage : bestImage?.url || bestImage?.link || ''),
  };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { profile, updateProfileData } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [genres, setGenres] = useState<string[]>(profile?.favorite_genres || []);
  const [artists, setArtists] = useState<SelectedArtist[]>(() =>
    (profile?.favorite_artists || []).map((name) => {
      const featured = FEATURED_ARTISTS.find((artist) => artist.name.toLowerCase() === name.toLowerCase());
      return normalizeArtist(featured || { id: name, name });
    })
  );
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SelectedArtist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<RNTextInput>(null);
  const transition = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    transition.setValue(0);
    Animated.timing(transition, { toValue: 1, duration: 240, useNativeDriver: true }).start();
  }, [step, transition]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      setIsSearching(false);
      setSearchFailed(false);
      return;
    }

    let active = true;
    setIsSearching(true);
    setSearchFailed(false);
    const timer = setTimeout(async () => {
      try {
        const found = await searchArtists(trimmedQuery);
        if (active) setResults(found.map(normalizeArtist).filter((artist) => artist.id));
      } catch {
        if (active) setSearchFailed(true);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const suggestedArtists = useMemo(
    () => (query.trim() ? results : FEATURED_ARTISTS.map(normalizeArtist)),
    [query, results]
  );

  const hasName = displayName.trim().length > 0;
  const isSelected = (artist: SelectedArtist) =>
    artists.some(
      (selected) => selected.id === artist.id || selected.name.toLowerCase() === artist.name.toLowerCase()
    );

  const goToStep = (nextStep: Step) => {
    Keyboard.dismiss();
    setStep(nextStep);
  };

  const toggleGenre = (label: string) => {
    setGenres((current) =>
      current.includes(label) ? current.filter((genre) => genre !== label) : [...current, label]
    );
  };

  const toggleArtist = (artist: SelectedArtist) => {
    if (isSelected(artist)) {
      setArtists((current) =>
        current.filter((item) => item.id !== artist.id && item.name.toLowerCase() !== artist.name.toLowerCase())
      );
      return;
    }
    if (artists.length >= MAX_ARTISTS) {
      showToast(`Choose up to ${MAX_ARTISTS} artists`, 'info');
      return;
    }
    setArtists((current) => [...current, artist]);
  };

  const finish = async () => {
    if (isSaving) return;
    setIsSaving(true);
    Keyboard.dismiss();
    try {
      await updateProfileData({
        display_name: displayName.trim() || profile?.display_name || profile?.username || null,
        favorite_genres: genres,
        favorite_artists: artists.map((artist) => artist.name),
        onboarding_completed: true,
      });
      showToast('Your music home is ready.', 'success');
      router.replace('/(tabs)');
    } catch (error: any) {
      showToast(error?.message || "We couldn't save your preferences. Please try again.", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const skip = () => {
    if (isSaving) return;
    Keyboard.dismiss();
    showToast('You can personalize Jamkudi anytime from Settings.', 'info');
    router.replace('/(tabs)');
  };

  const next = () => {
    if (step === 1 && !hasName) {
      nameRef.current?.focus();
      showToast('Add a name so we can make this feel more personal.', 'info');
      return;
    }
    if (step === 1) goToStep(2);
    else if (step === 2) goToStep(3);
    else finish();
  };

  return (
    <Screen paddingHorizontal={24} hasMiniPlayer={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        {/* Header Bar */}
        <View className="flex-row items-center justify-between pt-2 pb-4 min-h-[48px]">
          {step > 1 ? (
            <Pressable
              onPress={() => goToStep((step - 1) as Step)}
              hitSlop={12}
              className="flex-row items-center py-2 pr-3 active:opacity-75"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon name="chevron-left" size={22} color="#FFFFFF" />
              <AppText variant="caption" className="font-bold text-white ml-1">
                Back
              </AppText>
            </Pressable>
          ) : (
            <View />
          )}

          <Pressable
            onPress={skip}
            hitSlop={12}
            className="py-2 active:opacity-75"
            accessibilityRole="button"
            accessibilityLabel="Skip setup for now"
          >
            <AppText variant="caption" className="font-bold text-purple-400">
              Skip for now
            </AppText>
          </Pressable>
        </View>

        {/* Step Progress Bar */}
        <View className="flex-row items-center mb-6" accessibilityLabel={`Step ${step} of 3`}>
          {[1, 2, 3].map((item) => (
            <View
              key={item}
              className={`flex-1 h-1.5 rounded-full mr-2 ${
                item <= step ? 'bg-purple-600' : 'bg-zinc-800 border border-zinc-700/50'
              }`}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: transition,
              transform: [
                {
                  translateY: transition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            }}
          >
            {/* Step Icon Badge */}
            <View className="w-16 h-16 rounded-3xl items-center justify-center mb-6 border border-purple-500/30 bg-[#191428] shadow-lg shadow-purple-950/40">
              <Icon name={step === 1 ? 'user' : step === 2 ? 'disc' : 'music'} size={28} color="#C084FC" />
            </View>

            {/* STEP 1: Display Name */}
            {step === 1 && (
              <>
                <AppText variant="screenTitle" className="text-3xl font-extrabold tracking-tight mb-2">
                  Make it yours
                </AppText>
                <AppText variant="body" color="textSecondary" className="text-base leading-6 font-medium mb-8">
                  What should we call you? This is how Jamkudi will greet you.
                </AppText>

                <AppText variant="caption" color="textSecondary" className="text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                  YOUR NAME
                </AppText>

                <Pressable
                  onPress={() => nameRef.current?.focus()}
                  className="w-full h-14 px-4 rounded-2xl border flex-row items-center"
                  style={{
                    borderColor: isNameFocused ? '#A855F7' : theme.border,
                    backgroundColor: isNameFocused ? (theme.isDark ? '#1C162E' : '#F9F5FF') : theme.surface,
                  }}
                >
                  <Icon name="user" size={20} color={isNameFocused ? '#C084FC' : theme.textMuted} className="mr-3" />
                  <TextInput
                    ref={nameRef}
                    value={displayName}
                    onChangeText={setDisplayName}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    placeholder="Your name"
                    placeholderTextColor={theme.isDark ? '#52525B' : '#9CA3AF'}
                    autoCapitalize="words"
                    autoFocus
                    returnKeyType="next"
                    onSubmitEditing={next}
                    className="flex-1 h-full text-base font-semibold py-0"
                    style={{ color: theme.textPrimary }}
                  />
                </Pressable>

                <AppText variant="caption" color="textMuted" className="text-xs font-medium mt-3 ml-1">
                  You can change this anytime in Settings.
                </AppText>
              </>
            )}

            {/* STEP 2: Genres Selection */}
            {step === 2 && (
              <>
                <AppText variant="screenTitle" className="text-3xl font-extrabold tracking-tight mb-2">
                  Set the vibe
                </AppText>
                <AppText variant="body" color="textSecondary" className="text-base leading-6 font-medium mb-5">
                  Pick any genres you enjoy. These help shape your first recommendations.
                </AppText>
                <AppText variant="caption" className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
                  {genres.length > 0 ? `${genres.length} SELECTED` : 'OPTIONAL — PICK AS MANY AS YOU LIKE'}
                </AppText>

                <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                  {GENRES.map((genre) => {
                    const selected = genres.includes(genre.label);
                    return (
                      <Pressable
                        key={genre.id}
                        onPress={() => toggleGenre(genre.label)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        className={`px-4 py-3 rounded-2xl border flex-row items-center active:scale-[0.96] ${
                          selected
                            ? 'bg-purple-600 border-purple-500 shadow-md shadow-purple-950/40'
                            : 'active:opacity-80'
                        }`}
                        style={!selected ? { backgroundColor: theme.surface, borderColor: theme.border } : undefined}
                      >
                        <AppText className="text-base mr-2">{genre.emoji}</AppText>
                        <AppText
                          variant="caption"
                          color={selected ? 'onPrimary' : 'textPrimary'}
                          className="font-bold"
                        >
                          {genre.label}
                        </AppText>
                        {selected && <Icon name="check" size={16} color="#FFFFFF" className="ml-2" />}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* STEP 3: Artists Selection */}
            {step === 3 && (
              <>
                <AppText variant="screenTitle" className="text-3xl font-extrabold tracking-tight mb-2">
                  Who's on repeat?
                </AppText>
                <AppText variant="body" color="textSecondary" className="text-base leading-6 font-medium mb-5">
                  Choose up to {MAX_ARTISTS} artists, or leave this for later.
                </AppText>

                {/* Search Bar */}
                <View
                  className="h-13 px-4 rounded-2xl border flex-row items-center mb-5"
                  style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                >
                  <Icon name="search" size={20} color={theme.textMuted} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search artists"
                    placeholderTextColor={theme.isDark ? '#52525B' : '#9CA3AF'}
                    returnKeyType="search"
                    className="flex-1 h-full ml-3 text-base font-semibold py-0"
                    style={{ color: theme.textPrimary }}
                  />
                  {isSearching ? (
                    <ActivityIndicator size="small" color="#C084FC" />
                  ) : query ? (
                    <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
                      <Icon name="x" size={20} color={theme.textMuted} />
                    </Pressable>
                  ) : null}
                </View>

                {/* Selected Picks Chips */}
                {artists.length > 0 ? (
                  <View
                    className="mb-5 rounded-2xl border p-3.5"
                    style={{ backgroundColor: theme.isDark ? '#1C162E' : theme.surfaceElevated, borderColor: '#A855F7' }}
                  >
                    <AppText variant="caption" className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                      YOUR PICKS · {artists.length}/{MAX_ARTISTS}
                    </AppText>
                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {artists.map((artist) => (
                        <Pressable
                          key={artist.id}
                          onPress={() => toggleArtist(artist)}
                          className="flex-row items-center px-3.5 py-2 rounded-full bg-purple-600 active:bg-purple-700 active:scale-[0.96]"
                          accessibilityLabel={`Remove ${artist.name}`}
                        >
                          <AppText variant="caption" className="font-bold text-white mr-1.5">
                            {artist.name}
                          </AppText>
                          <Icon name="x" size={14} color="#FFFFFF" />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                <AppText variant="caption" color="textSecondary" className="text-xs font-bold uppercase tracking-wider mb-3">
                  {query ? 'SEARCH RESULTS' : 'POPULAR ON JAMKUDI'}
                </AppText>

                {searchFailed ? (
                  <View className="rounded-2xl border p-4" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                    <AppText variant="body" color="textSecondary">
                      Search is unavailable right now. You can still choose from the artists below.
                    </AppText>
                  </View>
                ) : null}

                {!isSearching && query && suggestedArtists.length === 0 ? (
                  <View className="rounded-2xl border p-5 items-center" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                    <AppText variant="body" color="textSecondary">
                      No artists found. Try a different spelling.
                    </AppText>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap" style={{ gap: 14 }}>
                    {suggestedArtists.map((artist) => {
                      const selected = isSelected(artist);
                      return (
                        <Pressable
                          key={artist.id}
                          onPress={() => toggleArtist(artist)}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          className="items-center active:scale-[0.95]"
                          style={{ width: '29%' }}
                        >
                          <View
                            className={`w-18 h-18 rounded-full overflow-hidden border-2 items-center justify-center ${
                              selected ? 'border-purple-500 bg-purple-950' : 'bg-zinc-800'
                            }`}
                            style={!selected ? { borderColor: theme.border, backgroundColor: theme.surface } : undefined}
                          >
                            <ArtworkImage uri={artist.imageUrl} iconSize={22} className="w-full h-full" />
                            {selected ? (
                              <View
                                className="absolute inset-0 items-center justify-center"
                                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                              >
                                <View className="w-7 h-7 rounded-full items-center justify-center bg-purple-600">
                                  <Icon name="check" size={17} color="#FFFFFF" />
                                </View>
                              </View>
                            ) : null}
                          </View>
                          <AppText
                            variant="caption"
                            color={selected ? undefined : 'textPrimary'}
                            className={`font-bold text-center mt-2 ${selected ? 'text-purple-400' : ''}`}
                            numberOfLines={1}
                          >
                            {artist.name}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </Animated.View>
        </ScrollView>

        {/* Bottom CTA Action Bar */}
        <View className="py-4 border-t" style={{ borderTopColor: theme.border }}>
          <AppButton
            title={step === 3 ? 'Start listening' : 'Continue'}
            onPress={next}
            disabled={isSaving}
            loading={isSaving}
            size="lg"
            className="w-full"
            rightIcon={step === 3 ? 'music' : undefined}
          />
          {step > 1 ? (
            <Pressable
              onPress={() => (step === 2 ? goToStep(3) : finish())}
              className="py-3 items-center active:opacity-75"
              disabled={isSaving}
            >
              <AppText variant="caption" color="textSecondary" className="font-bold">
                {step === 2 ? "I'll choose genres later" : "I'll choose artists later"}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
