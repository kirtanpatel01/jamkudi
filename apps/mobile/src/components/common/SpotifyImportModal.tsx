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
      setNewPlaylistName(result.playlistInfo.name);
      setActiveTrackTab("MATCHED");
      setStep("PREVIEW");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch Spotify playlist. Please check the URL.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleStartImport = async () => {
    if (!previewResult || previewResult.matchedTracks.length === 0) {
      showToast("No matched songs available to import", "error");
      return;
    }

    setStep("IMPORTING");
    setImportProgress(0);

    let targetId = selectedDestination;
    if (selectedDestination === "NEW") {
      const plName = newPlaylistName.trim() || previewResult.playlistInfo.name;
      const created = await createPlaylist(plName, `Imported from Spotify: ${previewResult.playlistInfo.name}`);
      targetId = created.id;
    }

    let addedCount = 0;
    let duplicateCount = 0;
    const totalToImport = previewResult.matchedTracks.length;

    for (let i = 0; i < totalToImport; i++) {
      const matchItem = previewResult.matchedTracks[i];
      if (matchItem.jamkudiTrack) {
        const res = await addTrackToPlaylist(targetId, matchItem.jamkudiTrack);
        if (res.isDuplicate) {
          duplicateCount++;
        } else if (res.success) {
          addedCount++;
        }
      }
      setImportProgress(i + 1);
    }

    setImportSummary({
      added: addedCount,
      duplicates: duplicateCount,
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
        className="flex-1 bg-black/75 justify-end"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full rounded-t-3xl p-6 border-t shadow-2xl max-h-[85%]"
          style={{
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-x-2">
              <View className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 items-center justify-center">
                <Icon name="music" size={16} color="#22C55E" />
              </View>
              <AppText variant="songTitle" color="textPrimary" className="text-base font-bold">
                Import from Spotify
              </AppText>
            </View>

            <Pressable
              onPress={handleClose}
              disabled={step === "IMPORTING"}
              className="p-1 rounded-full active:opacity-70"
              hitSlop={8}
            >
              <AppText variant="caption" color="textMuted" className="text-xs font-bold px-1">✕</AppText>
            </Pressable>
          </View>

          {/* STEP 1: URL Input */}
          {step === "INPUT" && (
            <View className="py-2">
              <AppText variant="caption" color="textSecondary" className="text-xs font-medium mb-3">
                Paste a Spotify playlist URL to read its songs and match them to Jamkudi's music source.
              </AppText>

              <AppText variant="caption" color="textSecondary" className="text-[11px] uppercase tracking-wider font-bold mb-1.5">
                Spotify Playlist Link *
              </AppText>

              <View
                className="flex-row items-center px-3.5 h-11 rounded-xl border mb-3"
                style={{
                  backgroundColor: theme.background,
                  borderColor: errorMsg ? "#EF4444" : theme.border,
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
                  className="flex-1 text-xs font-medium h-full"
                  style={{ color: theme.textPrimary }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Pressable
                  onPress={handlePasteUrl}
                  className="px-2 py-1 rounded-md active:opacity-75 border"
                  style={{ backgroundColor: theme.surfacePressed, borderColor: theme.border }}
                >
                  <AppText variant="caption" color="textPrimary" className="text-[10px] font-bold">Paste</AppText>
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
                className="py-3 rounded-full bg-green-600 active:bg-green-700 shadow-md items-center flex-row justify-center gap-x-2 mt-2"
              >
                {loadingPreview ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="search" size={16} color="#FFFFFF" />
                    <AppText className="text-xs font-bold text-white">Fetch Playlist</AppText>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* STEP 2: Preview & Destination Selection */}
          {step === "PREVIEW" && previewResult && (
            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[500px]">
              {/* Spotify Playlist Preview Header */}
              <View className="flex-row items-center p-3.5 rounded-2xl border mb-4" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <View className="w-14 h-14 rounded-xl overflow-hidden mr-3 shrink-0" style={{ backgroundColor: theme.surfacePressed }}>
                  <ArtworkImage uri={previewResult.playlistInfo.artwork} iconSize={24} className="w-full h-full" />
                </View>

                <View className="flex-1 min-w-0">
                  <AppText variant="songTitle" color="textPrimary" className="text-base font-bold mb-0.5" numberOfLines={1}>
                    {previewResult.playlistInfo.name}
                  </AppText>
                  <AppText variant="artist" color="textSecondary" className="text-xs font-medium" numberOfLines={1}>
                    By {previewResult.playlistInfo.owner} • {previewResult.playlistInfo.totalTracks} songs
                  </AppText>
                </View>
              </View>

              {/* Clickable Match Stats Summary Badges */}
              <View className="flex-row items-center gap-x-2 mb-4">
                <Pressable
                  onPress={() => setActiveTrackTab("MATCHED")}
                  className={`flex-1 flex-row items-center px-3 py-2.5 rounded-xl border active:opacity-80 ${
                    activeTrackTab === "MATCHED"
                      ? "bg-purple-600/30 border-purple-500"
                      : ""
                  }`}
                  style={activeTrackTab !== "MATCHED" ? { backgroundColor: theme.surface, borderColor: theme.border } : undefined}
                >
                  <Icon name="check" size={14} color={activeTrackTab === "MATCHED" ? "#C084FC" : theme.textMuted} />
                  <AppText
                    color={activeTrackTab === "MATCHED" ? undefined : "textSecondary"}
                    className={`text-xs font-bold ml-1.5 ${
                      activeTrackTab === "MATCHED" ? "text-purple-300" : ""
                    }`}
                  >
                    ✓ {previewResult.matchedTracks.length} matched
                  </AppText>
                </Pressable>

                {previewResult.unmatchedTracks.length > 0 ? (
                  <Pressable
                    onPress={() => setActiveTrackTab("UNMATCHED")}
                    className={`flex-1 flex-row items-center px-3 py-2.5 rounded-xl border active:opacity-80 ${
                      activeTrackTab === "UNMATCHED"
                        ? "bg-amber-600/30 border-amber-500"
                        : ""
                    }`}
                    style={activeTrackTab !== "UNMATCHED" ? { backgroundColor: theme.surface, borderColor: theme.border } : undefined}
                  >
                    <Icon name="alert-circle" size={14} color={activeTrackTab === "UNMATCHED" ? "#FBBF24" : theme.textMuted} />
                    <AppText
                      color={activeTrackTab === "UNMATCHED" ? undefined : "textSecondary"}
                      className={`text-xs font-bold ml-1.5 ${
                        activeTrackTab === "UNMATCHED" ? "text-amber-300" : ""
                      }`}
                    >
                      ⚠ {previewResult.unmatchedTracks.length} not found
                    </AppText>
                  </Pressable>
                ) : null}
              </View>

              {/* Destination Picker */}
              <AppText variant="caption" color="textSecondary" className="mb-2 uppercase tracking-wider text-[11px] font-bold">
                Destination Playlist
              </AppText>

              <Pressable
                onPress={() => setSelectedDestination("NEW")}
                className={`p-3 rounded-2xl border mb-2 flex-row items-center justify-between ${
                  selectedDestination === "NEW"
                    ? "bg-purple-600/20 border-purple-500"
                    : ""
                }`}
                style={selectedDestination !== "NEW" ? { backgroundColor: theme.surface, borderColor: theme.border } : undefined}
              >
                <View className="flex-1 mr-2">
                  <AppText variant="songTitle" color={selectedDestination === "NEW" ? undefined : 'textPrimary'} className={`text-xs font-bold mb-0.5 ${selectedDestination === "NEW" ? "text-purple-300" : ""}`}>
                    + Create New Playlist
                  </AppText>
                  <TextInput
                    value={newPlaylistName}
                    onChangeText={setNewPlaylistName}
                    placeholder="Enter playlist name"
                    placeholderTextColor={theme.isDark ? '#52525B' : '#9CA3AF'}
                    className="text-xs font-semibold border-b border-purple-500/40 py-0.5"
                    style={{ color: theme.textPrimary }}
                  />
                </View>
                {selectedDestination === "NEW" && (
                  <Icon name="check" size={18} color="#C084FC" />
                )}
              </Pressable>

              {playlists.map((pl) => (
                <Pressable
                  key={pl.id}
                  onPress={() => setSelectedDestination(pl.id)}
                  className={`p-3 rounded-2xl border mb-2 flex-row items-center justify-between ${
                    selectedDestination === pl.id
                      ? "bg-purple-600/20 border-purple-500"
                      : ""
                  }`}
                  style={selectedDestination !== pl.id ? { backgroundColor: theme.surface, borderColor: theme.border } : undefined}
                >
                  <View>
                    <AppText variant="songTitle" color={selectedDestination === pl.id ? undefined : 'textPrimary'} className={`text-xs font-bold mb-0.5 ${selectedDestination === pl.id ? "text-purple-300" : ""}`}>
                      {pl.name}
                    </AppText>
                    <AppText variant="caption" color="textSecondary" className="text-[10px] font-medium">
                      {pl.tracks ? pl.tracks.length : 0} songs
                    </AppText>
                  </View>
                  {selectedDestination === pl.id && (
                    <Icon name="check" size={18} color="#C084FC" />
                  )}
                </Pressable>
              ))}

              {/* Tracks List Toggle Tab */}
              {activeTrackTab === "MATCHED" ? (
                <>
                  <AppText variant="caption" className="mt-4 mb-2 uppercase tracking-wider text-[11px] text-purple-400 font-bold">
                    Matched Songs ({previewResult.matchedTracks.length})
                  </AppText>

                  {previewResult.matchedTracks.slice(0, 15).map((m, idx) => (
                    <View key={idx} className="flex-row items-center py-2 border-b" style={{ borderBottomColor: theme.border }}>
                      <Icon name="check" size={14} color="#C084FC" />
                      <View className="ml-2.5 flex-1 min-w-0">
                        <AppText variant="songTitle" color="textPrimary" className="text-xs font-semibold" numberOfLines={1}>
                          {m.jamkudiTrack?.title || m.spotifyTrack.title}
                        </AppText>
                        <AppText variant="artist" color="textSecondary" className="text-[10px] font-medium" numberOfLines={1}>
                          {m.jamkudiTrack?.artist || m.spotifyTrack.artist}
                        </AppText>
                      </View>
                    </View>
                  ))}

                  {previewResult.matchedTracks.length > 15 && (
                    <AppText variant="caption" color="textSecondary" className="text-[11px] text-center py-2">
                      ...and {previewResult.matchedTracks.length - 15} more matched songs
                    </AppText>
                  )}
                </>
              ) : (
                <>
                  <AppText variant="caption" className="mt-4 mb-2 uppercase tracking-wider text-[11px] text-amber-400 font-bold">
                    Songs Not Found in Jamkudi ({previewResult.unmatchedTracks.length})
                  </AppText>

                  {previewResult.unmatchedTracks.map((unm, idx) => (
                    <View key={idx} className="flex-row items-center py-2 border-b" style={{ borderBottomColor: theme.border }}>
                      <Icon name="alert-circle" size={14} color="#FBBF24" />
                      <View className="ml-2.5 flex-1 min-w-0">
                        <AppText variant="songTitle" color="textPrimary" className="text-xs font-semibold" numberOfLines={1}>
                          {unm.title}
                        </AppText>
                        <AppText variant="artist" color="textSecondary" className="text-[10px] font-medium" numberOfLines={1}>
                          {unm.artist}
                        </AppText>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Action Buttons */}
              <View className="flex-row items-center gap-x-3 mt-5 mb-2">
                <Pressable
                  onPress={handleReset}
                  className="flex-1 py-3 rounded-full border active:opacity-75 items-center"
                  style={{ backgroundColor: theme.surfacePressed, borderColor: theme.border }}
                >
                  <AppText variant="caption" color="textSecondary" className="text-xs font-bold">Back</AppText>
                </Pressable>

                <Pressable
                  onPress={handleStartImport}
                  className="flex-1 py-3 rounded-full bg-purple-600 active:bg-purple-700 shadow-md items-center"
                >
                  <AppText className="text-xs font-bold text-white">
                    Import {previewResult.matchedTracks.length} Songs
                  </AppText>
                </Pressable>
              </View>
            </ScrollView>
          )}

          {/* STEP 3: Importing Progress */}
          {step === "IMPORTING" && previewResult && (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color={theme.primary} />
              <AppText variant="songTitle" className="text-base font-bold text-center mt-4 mb-1">
                Importing Playlist...
              </AppText>
              <AppText variant="caption" className="text-xs text-purple-400 font-medium text-center">
                Processed {importProgress} of {previewResult.matchedTracks.length} songs
              </AppText>
            </View>
          )}

          {/* STEP 4: Summary */}
          {step === "SUMMARY" && importSummary && (
            <View className="py-6 items-center">
              <View className="w-14 h-14 rounded-full bg-purple-600/20 border border-purple-500/30 items-center justify-center mb-3">
                <Icon name="check" size={28} color="#C084FC" />
              </View>

              <AppText variant="songTitle" className="text-lg font-bold text-center mb-1">
                Playlist Imported!
              </AppText>

              <View
                className="w-full rounded-2xl border p-4 my-4 gap-y-2"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
              >
                <AppText variant="caption" color="textPrimary" className="text-xs font-semibold">
                  ✓ {importSummary.added} {importSummary.added === 1 ? "song" : "songs"} added
                </AppText>

                {importSummary.duplicates > 0 && (
                  <AppText className="text-xs text-purple-400 font-semibold">
                    • {importSummary.duplicates} songs already existed in playlist
                  </AppText>
                )}

                {importSummary.unmatched > 0 && (
                  <AppText className="text-xs text-amber-500 font-semibold">
                    ⚠ {importSummary.unmatched} songs could not be found in Jamkudi
                  </AppText>
                )}
              </View>

              <Pressable
                onPress={() => {
                  const targetId = importSummary.targetPlaylistId;
                  handleReset();
                  onClose();
                  router.push(`/playlist/${encodeURIComponent(targetId)}` as any);
                }}
                className="w-full py-3 rounded-full bg-purple-600 active:bg-purple-700 shadow-md items-center flex-row justify-center gap-x-2"
              >
                <Icon name="play" size={16} color="#FFFFFF" />
                <AppText className="text-xs font-bold text-white">Open Playlist</AppText>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};
