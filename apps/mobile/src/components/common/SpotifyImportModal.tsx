import React, { useState } from "react";
import { Modal, ScrollView, ActivityIndicator, Clipboard } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/common/AppText";
import { Icon } from "@/components/common/Icon";
import { ArtworkImage } from "@/components/common/ArtworkImage";
import { useTheme } from "@/hooks/useTheme";
import { usePlaylists } from "@/context/PlaylistContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import {
  previewSpotifyImport,
  SpotifyPlaylistPreviewResult,
} from "@/services/spotifyImportService";
import { JioSaavnSong } from "@/services/jiosaavn";
import { View, Pressable, TextInput } from "@/tw";

interface SpotifyImportModalProps {
  visible: boolean;
  onClose: () => void;
}

type ImportStep = "INPUT" | "PREVIEW" | "IMPORTING" | "SUMMARY";

export const SpotifyImportModal: React.FC<SpotifyImportModalProps> = ({
  visible,
  onClose,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { playlists, createPlaylist, addTrackToPlaylist } = usePlaylists();

  const [step, setStep] = useState<ImportStep>("INPUT");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [previewResult, setPreviewResult] = useState<SpotifyPlaylistPreviewResult | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<"NEW" | string>("NEW");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [activeTrackTab, setActiveTrackTab] = useState<"MATCHED" | "UNMATCHED">("MATCHED");

  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState<{
    added: number;
    duplicates: number;
    unmatched: number;
    targetPlaylistId: string;
  } | null>(null);

  const handleReset = () => {
    setStep("INPUT");
    setSpotifyUrl("");
    setLoadingPreview(false);
    setErrorMsg("");
    setPreviewResult(null);
    setSelectedDestination("NEW");
    setNewPlaylistName("");
    setActiveTrackTab("MATCHED");
    setImportProgress(0);
    setImportSummary(null);
  };

  const handleClose = () => {
    if (step === "IMPORTING") return;
    handleReset();
    onClose();
  };

  const handlePasteUrl = async () => {
    try {
      const text = await Clipboard.getString();
      if (text && text.includes("spotify.com")) {
        setSpotifyUrl(text.trim());
        setErrorMsg("");
      } else {
        showToast("Clipboard does not contain a Spotify URL", "info");
      }
    } catch {}
  };

  const handleFetchPreview = async () => {
    const trimmed = spotifyUrl.trim();
    if (!trimmed) {
      setErrorMsg("Please enter a Spotify playlist URL.");
      return;
    }

    if (!user) {
      showToast("Please sign in to import Spotify playlists", "info");
      router.push("/(auth)/login");
      onClose();
      return;
    }

    setLoadingPreview(true);
    setErrorMsg("");

    try {
      const result = await previewSpotifyImport(trimmed);
      setPreviewResult(result);
      setNewPlaylistName(result.playlistInfo.name || "Imported Spotify Playlist");
      setStep("PREVIEW");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch Spotify playlist. Make sure the playlist is public.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleStartImport = async () => {
    if (!previewResult) return;

    setStep("IMPORTING");
    setImportProgress(10);

    let targetId = selectedDestination;
    if (selectedDestination === "NEW") {
      const created = await createPlaylist(
        newPlaylistName.trim() || previewResult.playlistInfo.name || "Spotify Import",
        `Imported from Spotify playlist (${previewResult.playlistInfo.name})`
      );
      targetId = created.id;
    }

    setImportProgress(30);

    const tracksToAdd = previewResult.matchedTracks
      .map((m) => m.jamkudiTrack)
      .filter((t): t is JioSaavnSong => Boolean(t));
    let addedCount = 0;
    let dupCount = 0;

    const total = tracksToAdd.length;
    for (let i = 0; i < total; i++) {
      const song = tracksToAdd[i];
      const { success, isDuplicate } = await addTrackToPlaylist(targetId, song);
      if (isDuplicate) dupCount++;
      else if (success) addedCount++;

      const progress = 30 + Math.round(((i + 1) / total) * 65);
      setImportProgress(progress);
    }

    setImportProgress(100);
    setImportSummary({
      added: addedCount,
      duplicates: dupCount,
      unmatched: previewResult.unmatchedTracks.length,
      targetPlaylistId: targetId,
    });

    setStep("SUMMARY");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable
        onPress={handleClose}
        className="flex-1 bg-black/80 justify-end"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full rounded-t-[32px] p-6 max-h-[85%] shadow-2xl"
          style={{
            backgroundColor: theme.surfaceElevated,
          }}
        >
          {/* Sheet Handle Bar */}
          <View className="w-12 h-1.5 rounded-full bg-white/20 self-center mb-4 -mt-1" />

          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-x-2.5">
              <View className="w-9 h-9 rounded-2xl bg-green-500/20 items-center justify-center">
                <Icon name="music" size={18} color="#22C55E" />
              </View>
              <AppText variant="songTitle" color="textPrimary" className="text-lg font-black">
                Import from Spotify
              </AppText>
            </View>

            <Pressable
              onPress={handleClose}
              disabled={step === "IMPORTING"}
              className="w-9 h-9 rounded-full items-center justify-center active:opacity-70 active:scale-[0.95]"
              style={{ backgroundColor: theme.surfacePressed }}
              hitSlop={8}
            >
              <Icon name="x" size={16} color={theme.textPrimary} />
            </Pressable>
          </View>

          {/* STEP 1: URL Input */}
          {step === "INPUT" && (
            <View className="py-2">
              <AppText variant="caption" color="textSecondary" className="text-xs font-semibold mb-4 leading-5">
                Paste a public Spotify playlist URL to match its songs to Jamkudi's catalog.
              </AppText>

              <AppText variant="caption" color="textSecondary" className="text-[11px] uppercase tracking-widest font-black mb-1.5 ml-1 text-purple-300">
                SPOTIFY PLAYLIST LINK *
              </AppText>

              <View
                className="flex-row items-center px-4 h-12 rounded-2xl mb-4 shadow-inner"
                style={{
                  backgroundColor: theme.background,
                }}
              >
                <TextInput
                  value={spotifyUrl}
                  onChangeText={(text) => {
                    setSpotifyUrl(text);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="https://open.spotify.com/playlist/..."
                  placeholderTextColor={theme.isDark ? '#52525B' : '#9CA3AF'}
                  className="flex-1 text-xs font-semibold h-full py-0"
                  style={{ color: theme.textPrimary }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Pressable
                  onPress={handlePasteUrl}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 active:bg-purple-600/30 active:scale-[0.95]"
                >
                  <AppText variant="caption" className="text-xs font-black text-purple-300">Paste</AppText>
                </Pressable>
              </View>

              {errorMsg ? (
                <AppText className="text-xs text-red-400 font-semibold mb-4 text-center">
                  {errorMsg}
                </AppText>
              ) : null}

              <Pressable
                onPress={handleFetchPreview}
                disabled={loadingPreview}
                className="py-3.5 rounded-full bg-green-600 active:bg-green-700 active:scale-[0.95] items-center flex-row justify-center gap-x-2 mt-2 shadow-lg"
              >
                {loadingPreview ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="search" size={18} color="#FFFFFF" />
                    <AppText className="text-xs font-black text-white uppercase tracking-wider">Fetch Playlist</AppText>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* STEP 2: Preview & Destination Selection */}
          {step === "PREVIEW" && previewResult && (
            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[500px]">
              {/* Spotify Playlist Preview Header */}
              <View className="flex-row items-center p-4 rounded-2xl mb-4 shadow-sm" style={{ backgroundColor: theme.surface }}>
                <View className="w-14 h-14 rounded-2xl overflow-hidden mr-3.5 shrink-0" style={{ backgroundColor: theme.surfacePressed }}>
                  <ArtworkImage uri={previewResult.playlistInfo.artwork} iconSize={24} className="w-full h-full" />
                </View>

                <View className="flex-1 min-w-0">
                  <AppText variant="songTitle" color="textPrimary" className="text-base font-black mb-0.5" numberOfLines={1}>
                    {previewResult.playlistInfo.name}
                  </AppText>
                  <AppText variant="artist" color="textSecondary" className="text-xs font-semibold" numberOfLines={1}>
                    By {previewResult.playlistInfo.owner} • {previewResult.playlistInfo.totalTracks} songs
                  </AppText>
                </View>
              </View>

              {/* Clickable Match Stats Summary Badges */}
              <View className="flex-row items-center gap-x-2 mb-4">
                <Pressable
                  onPress={() => setActiveTrackTab("MATCHED")}
                  className={`flex-1 flex-row items-center px-3.5 py-2.5 rounded-2xl active:opacity-80 ${
                    activeTrackTab === "MATCHED"
                      ? "bg-purple-600/30"
                      : ""
                  }`}
                  style={activeTrackTab !== "MATCHED" ? { backgroundColor: theme.surface } : undefined}
                >
                  <Icon name="check" size={14} color={activeTrackTab === "MATCHED" ? "#C084FC" : theme.textMuted} />
                  <AppText
                    color={activeTrackTab === "MATCHED" ? undefined : "textSecondary"}
                    className={`text-xs font-black ml-1.5 ${
                      activeTrackTab === "MATCHED" ? "text-purple-300" : ""
                    }`}
                  >
                    ✓ {previewResult.matchedTracks.length} matched
                  </AppText>
                </Pressable>

                {previewResult.unmatchedTracks.length > 0 ? (
                  <Pressable
                    onPress={() => setActiveTrackTab("UNMATCHED")}
                    className={`flex-1 flex-row items-center px-3.5 py-2.5 rounded-2xl active:opacity-80 ${
                      activeTrackTab === "UNMATCHED"
                        ? "bg-rose-500/20"
                        : ""
                    }`}
                    style={activeTrackTab !== "UNMATCHED" ? { backgroundColor: theme.surface } : undefined}
                  >
                    <Icon name="x" size={14} color={activeTrackTab === "UNMATCHED" ? "#F87171" : theme.textMuted} />
                    <AppText
                      className={`text-xs font-black ml-1.5 ${
                        activeTrackTab === "UNMATCHED" ? "text-rose-400" : "text-gray-400"
                      }`}
                    >
                      ✕ {previewResult.unmatchedTracks.length} skipped
                    </AppText>
                  </Pressable>
                ) : null}
              </View>

              {/* Start Import Action */}
              <Pressable
                onPress={handleStartImport}
                className="py-3.5 rounded-full bg-green-600 active:bg-green-700 active:scale-[0.95] items-center flex-row justify-center gap-x-2 my-2 shadow-lg"
              >
                <Icon name="check" size={18} color="#FFFFFF" />
                <AppText className="text-xs font-black text-white uppercase tracking-wider">Start Import</AppText>
              </Pressable>
            </ScrollView>
          )}

          {/* STEP 3: Importing Progress */}
          {step === "IMPORTING" && (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#22C55E" />
              <AppText variant="songTitle" className="text-base font-black mt-4 mb-1">
                Importing Songs...
              </AppText>
              <AppText variant="caption" color="textSecondary" className="text-xs font-semibold mb-6">
                Matching and adding tracks to your library
              </AppText>

              <View className="w-full h-3 rounded-full bg-black/20 overflow-hidden mb-2">
                <View
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${importProgress}%` }}
                />
              </View>
              <AppText variant="caption" className="text-xs font-bold text-green-400">
                {importProgress}%
              </AppText>
            </View>
          )}

          {/* STEP 4: Summary */}
          {step === "SUMMARY" && importSummary && (
            <View className="py-6 items-center">
              <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-4 shadow-md">
                <Icon name="check" size={32} color="#22C55E" />
              </View>
              <AppText variant="screenTitle" className="text-xl font-black mb-1">
                Import Complete!
              </AppText>
              <AppText variant="caption" color="textSecondary" className="text-xs font-semibold mb-6 text-center">
                Added {importSummary.added} songs to your playlist.
              </AppText>

              <Pressable
                onPress={handleClose}
                className="w-full py-3.5 rounded-full bg-purple-600 active:bg-purple-700 active:scale-[0.95] items-center shadow-lg"
              >
                <AppText className="text-xs font-black text-white uppercase tracking-wider">Done</AppText>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};
