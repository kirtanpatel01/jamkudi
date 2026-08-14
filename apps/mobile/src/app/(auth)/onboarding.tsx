import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
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
import { Pressable, View } from '@/tw';

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
  { id: 'rock', label: 'Rock', emoji: '⚡' },
  { id: 'rnb', label: 'R&B', emoji: '🎷' },
  { id: 'electronic', label: 'Electronic', emoji: '🎛️' },
  { id: 'lo-fi', label: 'Lo-fi', emoji: '☕' },
  { id: 'classical', label: 'Classical', emoji: '🎻' },
  { id: 'gujarati', label: 'Gujarati', emoji: '🪘' },
  { id: 'punjabi', label: 'Punjabi', emoji: '🪕' },
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
  const nameRef = useRef<TextInput>(null);
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
  const isSelected = (artist: SelectedArtist) => artists.some(
    (selected) => selected.id === artist.id || selected.name.toLowerCase() === artist.name.toLowerCase()
  );

  const goToStep = (nextStep: Step) => {
    Keyboard.dismiss();
    setStep(nextStep);
  };

  const toggleGenre = (label: string) => {
    setGenres((current) => current.includes(label) ? current.filter((genre) => genre !== label) : [...current, label]);
  };

  const toggleArtist = (artist: SelectedArtist) => {
    if (isSelected(artist)) {
      setArtists((current) => current.filter((item) => item.id !== artist.id && item.name.toLowerCase() !== artist.name.toLowerCase()));
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

  const surfaceStyle = { backgroundColor: theme.surfaceElevated, borderColor: theme.border };
  const mutedStyle = { color: theme.textSecondary };

  return (
    <Screen paddingHorizontal={20}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-row items-center justify-between pt-2 pb-4 min-h-[48px]">
          {step > 1 ? (
            <Pressable onPress={() => goToStep((step - 1) as Step)} hitSlop={12} className="flex-row items-center py-2 pr-3" accessibilityRole="button" accessibilityLabel="Go back">
              <Icon name="chevron-left" size={22} color={theme.textPrimary} />
              <AppText variant="caption" className="font-bold ml-1" style={{ color: theme.textPrimary }}>Back</AppText>
            </Pressable>
          ) : <View />}
          <Pressable onPress={skip} hitSlop={12} className="py-2" accessibilityRole="button" accessibilityLabel="Skip setup for now">
            <AppText variant="caption" className="font-bold" style={{ color: theme.primary }}>Skip for now</AppText>
          </Pressable>
        </View>

        <View className="flex-row items-center mb-4" accessibilityLabel={`Step ${step} of 3`}>
          {[1, 2, 3].map((item) => (
            <View key={item} className="flex-1 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: item <= step ? theme.primary : theme.border }} />
          ))}
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: 12 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: transition, transform: [{ translateY: transition.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
            <View className="w-16 h-16 rounded-3xl items-center justify-center mb-6" style={{ backgroundColor: theme.primarySubtle }}>
              <Icon name={step === 1 ? 'user' : step === 2 ? 'disc' : 'music'} size={31} color={theme.primary} />
            </View>

            {step === 1 && <>
              <AppText variant="screenTitle" className="text-3xl font-bold tracking-tight mb-2" style={{ color: theme.textPrimary }}>Make it yours</AppText>
              <AppText variant="body" className="text-base leading-6 mb-8" style={mutedStyle}>What should we call you? This is how Jamkudi will greet you.</AppText>
              <AppText variant="caption" className="font-bold mb-2 ml-1" style={{ color: theme.textPrimary }}>YOUR NAME</AppText>
              <Pressable onPress={() => nameRef.current?.focus()} className="h-14 px-4 rounded-2xl border flex-row items-center" style={{ ...surfaceStyle, borderColor: isNameFocused ? theme.primary : theme.border }}>
                <Icon name="user" size={20} color={isNameFocused ? theme.primary : theme.textMuted} />
                <TextInput ref={nameRef} value={displayName} onChangeText={setDisplayName} onFocus={() => setIsNameFocused(true)} onBlur={() => setIsNameFocused(false)} placeholder="Your name" placeholderTextColor={theme.textMuted} autoCapitalize="words" autoFocus returnKeyType="next" onSubmitEditing={next} className="flex-1 h-full ml-3 text-base" style={{ color: theme.textPrimary, fontFamily: 'Nunito_600SemiBold' }} />
              </Pressable>
              <AppText variant="caption" className="mt-3 ml-1" style={mutedStyle}>You can change this anytime in Settings.</AppText>
            </>}

            {step === 2 && <>
              <AppText variant="screenTitle" className="text-3xl font-bold tracking-tight mb-2" style={{ color: theme.textPrimary }}>Set the vibe</AppText>
              <AppText variant="body" className="text-base leading-6 mb-5" style={mutedStyle}>Pick any genres you enjoy. These help shape your first recommendations.</AppText>
              <AppText variant="caption" className="font-bold mb-3" style={{ color: theme.primary }}>{genres.length ? `${genres.length} selected` : 'OPTIONAL — PICK AS MANY AS YOU LIKE'}</AppText>
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {GENRES.map((genre) => {
                  const selected = genres.includes(genre.label);
                  return <Pressable key={genre.id} onPress={() => toggleGenre(genre.label)} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} className="px-4 py-3 rounded-2xl border flex-row items-center" style={{ backgroundColor: selected ? theme.primary : theme.surfaceElevated, borderColor: selected ? theme.primary : theme.border }}>
                    <AppText className="text-base mr-2">{genre.emoji}</AppText>
                    <AppText variant="caption" className="font-bold" style={{ color: selected ? theme.onPrimary : theme.textPrimary }}>{genre.label}</AppText>
                    {selected && <Icon name="check" size={16} color={theme.onPrimary} style={{ marginLeft: 7 }} />}
                  </Pressable>;
                })}
              </View>
            </>}

            {step === 3 && <>
              <AppText variant="screenTitle" className="text-3xl font-bold tracking-tight mb-2" style={{ color: theme.textPrimary }}>Who’s on repeat?</AppText>
              <AppText variant="body" className="text-base leading-6 mb-5" style={mutedStyle}>Choose up to {MAX_ARTISTS} artists, or leave this for later.</AppText>
              <View className="h-13 px-4 rounded-2xl border flex-row items-center mb-5" style={surfaceStyle}>
                <Icon name="search" size={20} color={theme.textMuted} />
                <TextInput value={query} onChangeText={setQuery} placeholder="Search artists" placeholderTextColor={theme.textMuted} returnKeyType="search" className="flex-1 h-full ml-3 text-base" style={{ color: theme.textPrimary, fontFamily: 'Nunito_600SemiBold' }} />
                {isSearching ? <ActivityIndicator size="small" color={theme.primary} /> : query ? <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search"><Icon name="x" size={20} color={theme.textMuted} /></Pressable> : null}
              </View>
              {artists.length > 0 && <View className="mb-5 rounded-2xl border p-3" style={{ backgroundColor: theme.primarySubtle, borderColor: theme.primary }}>
                <AppText variant="caption" className="font-bold mb-2" style={{ color: theme.primary }}>YOUR PICKS · {artists.length}/{MAX_ARTISTS}</AppText>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>{artists.map((artist) => <Pressable key={artist.id} onPress={() => toggleArtist(artist)} className="flex-row items-center px-3 py-2 rounded-full" style={{ backgroundColor: theme.primary }} accessibilityLabel={`Remove ${artist.name}`}><AppText variant="caption" className="font-bold mr-1.5" style={{ color: theme.onPrimary }}>{artist.name}</AppText><Icon name="x" size={14} color={theme.onPrimary} /></Pressable>)}</View>
              </View>}
              <AppText variant="caption" className="font-bold mb-3" style={{ color: theme.textSecondary }}>{query ? 'SEARCH RESULTS' : 'POPULAR ON JAMKUDI'}</AppText>
              {searchFailed ? <View className="rounded-2xl border p-4" style={surfaceStyle}><AppText variant="body" style={mutedStyle}>Search is unavailable right now. You can still choose from the artists below.</AppText></View> : null}
              {!isSearching && query && suggestedArtists.length === 0 ? <View className="rounded-2xl border p-5 items-center" style={surfaceStyle}><AppText variant="body" style={mutedStyle}>No artists found. Try a different spelling.</AppText></View> : <View className="flex-row flex-wrap" style={{ gap: 14 }}>{suggestedArtists.map((artist) => {
                const selected = isSelected(artist);
                return <Pressable key={artist.id} onPress={() => toggleArtist(artist)} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} className="items-center" style={{ width: '29%' }}>
                  <View className="w-18 h-18 rounded-full overflow-hidden border-2 items-center justify-center" style={{ borderColor: selected ? theme.primary : theme.border, backgroundColor: theme.surface }}><ArtworkImage uri={artist.imageUrl} iconSize={22} className="w-full h-full" />{selected && <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }}><View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: theme.primary }}><Icon name="check" size={17} color={theme.onPrimary} /></View></View>}</View>
                  <AppText variant="caption" className="font-bold text-center mt-2" numberOfLines={1} style={{ color: selected ? theme.primary : theme.textPrimary }}>{artist.name}</AppText>
                </Pressable>;
              })}</View>}
            </>}
          </Animated.View>
        </ScrollView>

        <View className="pt-4">
          <AppButton title={step === 3 ? 'Start listening' : 'Continue'} onPress={next} disabled={isSaving} loading={isSaving} size="lg" className="w-full" rightIcon={step === 3 ? 'music' : undefined} />
          {step > 1 && <Pressable onPress={() => step === 2 ? goToStep(3) : finish()} className="py-4 items-center" disabled={isSaving}><AppText variant="caption" className="font-bold" style={{ color: theme.textSecondary }}>{step === 2 ? 'I’ll choose genres later' : 'I’ll choose artists later'}</AppText></Pressable>}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
