import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  createAudioPlayer,
  setAudioModeAsync,
  requestNotificationPermissionsAsync,
  AudioPlayer,
} from "expo-audio";
import { Track, PlaybackState, RepeatMode } from "@/types/track";
import {
  loadLikedSongs,
  saveLikedSongs,
  loadRecentlyPlayed,
  addRecentlyPlayed,
  loadSettings,
  saveSettings,
} from "@/utils/storage";

interface PlayerContextType {
  currentTrack: Track | null;
  playbackState: PlaybackState;
  isPlaying: boolean;
  position: number;
  duration: number;
  isInitialized: boolean;
  queue: Track[];
  originalQueue: Track[];
  currentIndex: number;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  likedTracks: Track[];
  recentlyPlayed: Track[];
  playTrack: (track: Track) => Promise<void>;
  playQueue: (tracks: Track[], startIndex?: number) => Promise<void>;
  playNext: (track: Track) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLikeTrack: (track: Track) => void;
  isLiked: (trackId: string) => boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const [queue, setQueue] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("OFF");

  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);

  const playerRef = useRef<AudioPlayer | null>(null);
  const intervalRef = useRef<any>(null);
  const queueRef = useRef<Track[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const repeatModeRef = useRef<RepeatMode>("OFF");
  const isHandlingCompletionRef = useRef(false);

  // Sync refs for closures
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  // Load initial settings & persisted data from AsyncStorage
  useEffect(() => {
    requestNotificationPermissionsAsync().catch(() => {});

    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    })
      .then(() => setIsInitialized(true))
      .catch(() => setIsInitialized(true));

    Promise.all([loadLikedSongs(), loadRecentlyPlayed(), loadSettings()]).then(
      ([liked, recent, settings]) => {
        setLikedTracks(liked);
        setRecentlyPlayed(recent);
        setRepeatMode(settings.repeatMode);
        setShuffleEnabled(settings.shuffleEnabled);
      }
    );

    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (player && !isHandlingCompletionRef.current) {
        try {
          if (typeof player.playing === "boolean") {
            setIsPlaying(player.playing);
            setPlaybackState(player.playing ? "playing" : "paused");
          }
          if (typeof player.currentTime === "number" && !isNaN(player.currentTime)) {
            setPosition(player.currentTime);
          }
          if (typeof player.duration === "number" && !isNaN(player.duration) && player.duration > 0) {
            setDuration(player.duration);

            // Completion Guard: Auto-next playback status detection
            if (
              player.currentTime > 0 &&
              player.duration > 0 &&
              player.currentTime >= player.duration - 0.7
            ) {
              handleTrackCompletion();
            }
          }
        } catch {}
      }
    }, 400);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch {}
      }
    };
  }, []);

  const handleTrackCompletion = async () => {
    if (isHandlingCompletionRef.current) return;
    isHandlingCompletionRef.current = true;

    const rep = repeatModeRef.current;
    const q = queueRef.current;
    const idx = currentIndexRef.current;

    try {
      if (rep === "ONE" && currentTrack) {
        await seekTo(0);
        if (playerRef.current) playerRef.current.play();
      } else if (q.length > 0 && idx < q.length - 1) {
        const nextIdx = idx + 1;
        setCurrentIndex(nextIdx);
        await playTrackInternal(q[nextIdx]);
      } else if (rep === "ALL" && q.length > 0) {
        setCurrentIndex(0);
        await playTrackInternal(q[0]);
      } else {
        setPlaybackState("paused");
        setIsPlaying(false);
      }
    } finally {
      setTimeout(() => {
        isHandlingCompletionRef.current = false;
      }, 1200);
    }
  };

  const playTrackInternal = async (track: Track) => {
    try {
      setPlaybackState("loading");
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch {}
        playerRef.current = null;
      }

      setCurrentTrack(track);
      setPosition(0);
      setDuration(track.duration || 0);

      // Record to Recently Played storage
      addRecentlyPlayed(track).then(setRecentlyPlayed);

      const streamUrl = track.audioUrl || (track as any).url;
      const player = createAudioPlayer(streamUrl);
      playerRef.current = player;

      try {
        player.setActiveForLockScreen(true, {
          title: track.title,
          artist: track.artist,
          albumTitle: track.album,
          artworkUrl: track.artwork,
        });
      } catch (lockErr) {
        console.log("Lock screen controls notice:", lockErr);
      }

      player.play();
      setIsPlaying(true);
      setPlaybackState("playing");
    } catch (error) {
      console.error("Error playing track:", error);
      setPlaybackState("error");
    }
  };

  const playTrack = async (track: Track) => {
    setOriginalQueue([track]);
    setQueue([track]);
    setCurrentIndex(0);
    await playTrackInternal(track);
  };

  const playQueue = async (tracks: Track[], startIndex: number = 0) => {
    if (!tracks || tracks.length === 0) return;
    const validIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));

    if (shuffleEnabled) {
      const selectedTrack = tracks[validIndex];
      const rest = tracks.filter((_, i) => i !== validIndex);
      const shuffled = [selectedTrack, ...shuffleArray(rest)];
      setOriginalQueue(tracks);
      setQueue(shuffled);
      setCurrentIndex(0);
      await playTrackInternal(selectedTrack);
    } else {
      setOriginalQueue(tracks);
      setQueue(tracks);
      setCurrentIndex(validIndex);
      await playTrackInternal(tracks[validIndex]);
    }
  };

  const playNext = (track: Track) => {
    setQueue((prev) => {
      const nextIndex = currentIndex + 1;
      const updated = [...prev];
      updated.splice(nextIndex, 0, track);
      return updated;
    });
    setOriginalQueue((prev) => [...prev, track]);
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
    setOriginalQueue((prev) => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index < currentIndex) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setOriginalQueue([]);
    setCurrentIndex(-1);
  };

  const skipToNext = async () => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const rep = repeatModeRef.current;

    if (q.length > 0 && idx < q.length - 1) {
      const nextIdx = idx + 1;
      setCurrentIndex(nextIdx);
      await playTrackInternal(q[nextIdx]);
    } else if (rep === "ALL" && q.length > 0) {
      setCurrentIndex(0);
      await playTrackInternal(q[0]);
    }
  };

  const skipToPrevious = async () => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;

    if (position > 3 && playerRef.current) {
      await seekTo(0);
      return;
    }

    if (q.length > 0 && idx > 0) {
      const prevIdx = idx - 1;
      setCurrentIndex(prevIdx);
      await playTrackInternal(q[prevIdx]);
    }
  };

  const togglePlayPause = async () => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pause();
        setIsPlaying(false);
        setPlaybackState("paused");
      } else {
        playerRef.current.play();
        setIsPlaying(true);
        setPlaybackState("playing");
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  };

  const seekTo = async (seconds: number) => {
    if (!playerRef.current) return;
    try {
      playerRef.current.seekTo(seconds);
      setPosition(seconds);
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };

  const toggleShuffle = () => {
    const nextShuffle = !shuffleEnabled;
    setShuffleEnabled(nextShuffle);
    saveSettings({ shuffleEnabled: nextShuffle });

    if (nextShuffle && currentTrack && queue.length > 1) {
      const rest = queue.filter((t) => t.id !== currentTrack.id);
      const shuffled = [currentTrack, ...shuffleArray(rest)];
      setQueue(shuffled);
      setCurrentIndex(0);
    } else if (!nextShuffle && originalQueue.length > 0) {
      setQueue(originalQueue);
      if (currentTrack) {
        const origIndex = originalQueue.findIndex((t) => t.id === currentTrack.id);
        setCurrentIndex(origIndex >= 0 ? origIndex : 0);
      }
    }
  };

  const toggleRepeat = () => {
    const modes: RepeatMode[] = ["OFF", "ALL", "ONE"];
    const nextIndex = (modes.indexOf(repeatMode) + 1) % modes.length;
    const nextMode = modes[nextIndex];
    setRepeatMode(nextMode);
    saveSettings({ repeatMode: nextMode });
  };

  const toggleLikeTrack = (track: Track) => {
    setLikedTracks((prev) => {
      const isAlreadyLiked = prev.some((t) => t.id === track.id);
      const updated = isAlreadyLiked
        ? prev.filter((t) => t.id !== track.id)
        : [track, ...prev];
      saveLikedSongs(updated);
      return updated;
    });
  };

  const isLiked = (trackId: string) => {
    return likedTracks.some((t) => t.id === trackId);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        playbackState,
        isPlaying,
        position,
        duration: duration || currentTrack?.duration || 0,
        isInitialized,
        queue,
        originalQueue,
        currentIndex,
        shuffleEnabled,
        repeatMode,
        likedTracks,
        recentlyPlayed,
        playTrack,
        playQueue,
        playNext,
        addToQueue,
        removeFromQueue,
        clearQueue,
        skipToNext,
        skipToPrevious,
        togglePlayPause,
        seekTo,
        toggleShuffle,
        toggleRepeat,
        toggleLikeTrack,
        isLiked,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};
