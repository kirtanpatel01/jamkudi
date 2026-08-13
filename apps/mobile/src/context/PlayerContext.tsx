import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  createAudioPlayer,
  setAudioModeAsync,
  requestNotificationPermissionsAsync,
  AudioPlayer,
} from "expo-audio";
import { Track, PlaybackState, RepeatMode, QueueItem, QueueSource } from "@/types/track";
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
  currentQueueItem: QueueItem | null;
  playbackState: PlaybackState;
  isPlaying: boolean;
  position: number;
  duration: number;
  isInitialized: boolean;
  queue: QueueItem[];
  currentIndex: number;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  likedTracks: Track[];
  recentlyPlayed: Track[];
  playTrack: (track: Track, source?: QueueSource) => Promise<void>;
  playQueue: (tracks: Track[], startIndex?: number, source?: QueueSource) => Promise<void>;
  playNext: (track: Track, source?: QueueSource) => void;
  addToQueue: (track: Track, source?: QueueSource) => void;
  removeFromQueue: (queueId: string) => void;
  moveInQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  playFromQueue: (queueId: string) => Promise<void>;
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

function createQueueItem(track: Track, source?: QueueSource): QueueItem {
  const uniqueId = `${track.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    queueId: uniqueId,
    track,
    addedAt: Date.now(),
    source: source || "manual",
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentQueueItem, setCurrentQueueItem] = useState<QueueItem | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [originalQueue, setOriginalQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("OFF");

  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);

  const playerRef = useRef<AudioPlayer | null>(null);
  const intervalRef = useRef<any>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const repeatModeRef = useRef<RepeatMode>("OFF");
  const isHandlingCompletionRef = useRef(false);

  // Derived current track representation
  const currentTrack = currentQueueItem ? currentQueueItem.track : null;

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
      if (rep === "ONE" && currentQueueItem) {
        await seekTo(0);
        if (playerRef.current) playerRef.current.play();
      } else if (q.length > 0 && idx < q.length - 1) {
        const nextIdx = idx + 1;
        setCurrentIndex(nextIdx);
        await playItemInternal(q[nextIdx]);
      } else if (rep === "ALL" && q.length > 0) {
        setCurrentIndex(0);
        await playItemInternal(q[0]);
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

  const playItemInternal = async (item: QueueItem) => {
    try {
      setPlaybackState("loading");
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch {}
        playerRef.current = null;
      }

      setCurrentQueueItem(item);
      const track = item.track;
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

  const playTrack = async (track: Track, source: QueueSource = "manual") => {
    const item = createQueueItem(track, source);
    setOriginalQueue([item]);
    setQueue([item]);
    setCurrentIndex(0);
    await playItemInternal(item);
  };

  const playQueue = async (tracks: Track[], startIndex: number = 0, source: QueueSource = "manual") => {
    if (!tracks || tracks.length === 0) return;
    const validIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
    const items = tracks.map((t) => createQueueItem(t, source));

    if (shuffleEnabled) {
      const selectedItem = items[validIndex];
      const rest = items.filter((_, i) => i !== validIndex);
      const shuffled = [selectedItem, ...shuffleArray(rest)];
      setOriginalQueue(items);
      setQueue(shuffled);
      setCurrentIndex(0);
      await playItemInternal(selectedItem);
    } else {
      setOriginalQueue(items);
      setQueue(items);
      setCurrentIndex(validIndex);
      await playItemInternal(items[validIndex]);
    }
  };

  const playNext = (track: Track, source: QueueSource = "manual") => {
    const newItem = createQueueItem(track, source);
    setQueue((prev) => {
      const insertIdx = currentIndex < 0 ? 0 : currentIndex + 1;
      const updated = [...prev];
      updated.splice(insertIdx, 0, newItem);
      return updated;
    });
    setOriginalQueue((prev) => [...prev, newItem]);
  };

  const addToQueue = (track: Track, source: QueueSource = "manual") => {
    const newItem = createQueueItem(track, source);
    setQueue((prev) => [...prev, newItem]);
    setOriginalQueue((prev) => [...prev, newItem]);
  };

  const removeFromQueue = (queueId: string) => {
    const targetIdx = queue.findIndex((item) => item.queueId === queueId);
    if (targetIdx === -1) return;

    if (queue.length === 1) {
      // Removing the only item
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch {}
        playerRef.current = null;
      }
      setQueue([]);
      setOriginalQueue([]);
      setCurrentIndex(-1);
      setCurrentQueueItem(null);
      setIsPlaying(false);
      setPlaybackState("idle");
      return;
    }

    if (targetIdx < currentIndex) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
      setQueue((prev) => prev.filter((item) => item.queueId !== queueId));
    } else if (targetIdx === currentIndex) {
      const remaining = queue.filter((item) => item.queueId !== queueId);
      setQueue(remaining);
      const nextIdx = Math.min(currentIndex, remaining.length - 1);
      setCurrentIndex(nextIdx);
      playItemInternal(remaining[nextIdx]);
    } else {
      setQueue((prev) => prev.filter((item) => item.queueId !== queueId));
    }
  };

  const moveInQueue = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex < 0 ||
      fromIndex >= queue.length ||
      toIndex < 0 ||
      toIndex >= queue.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    // Do not move the currently playing item
    if (fromIndex === currentIndex || toIndex === currentIndex) return;

    setQueue((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      return updated;
    });
  };

  const clearQueue = () => {
    // Keep currently playing track in queue, remove all upcoming items!
    if (currentIndex >= 0 && currentIndex < queue.length) {
      const activeItem = queue[currentIndex];
      setQueue([activeItem]);
      setOriginalQueue([activeItem]);
      setCurrentIndex(0);
    } else {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch {}
        playerRef.current = null;
      }
      setQueue([]);
      setOriginalQueue([]);
      setCurrentIndex(-1);
      setCurrentQueueItem(null);
      setIsPlaying(false);
      setPlaybackState("idle");
    }
  };

  const playFromQueue = async (queueId: string) => {
    const targetIdx = queue.findIndex((item) => item.queueId === queueId);
    if (targetIdx >= 0) {
      setCurrentIndex(targetIdx);
      await playItemInternal(queue[targetIdx]);
    }
  };

  const skipToNext = async () => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const rep = repeatModeRef.current;

    if (q.length > 0 && idx < q.length - 1) {
      const nextIdx = idx + 1;
      setCurrentIndex(nextIdx);
      await playItemInternal(q[nextIdx]);
    } else if (rep === "ALL" && q.length > 0) {
      setCurrentIndex(0);
      await playItemInternal(q[0]);
    }
  };

  const skipToPrevious = async () => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const rep = repeatModeRef.current;

    if (position > 3 && playerRef.current) {
      await seekTo(0);
      return;
    }

    if (q.length > 0 && idx > 0) {
      const prevIdx = idx - 1;
      setCurrentIndex(prevIdx);
      await playItemInternal(q[prevIdx]);
    } else if (rep === "ALL" && q.length > 0) {
      const lastIdx = q.length - 1;
      setCurrentIndex(lastIdx);
      await playItemInternal(q[lastIdx]);
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

    if (nextShuffle && currentQueueItem && queue.length > 1) {
      const rest = queue.filter((item) => item.queueId !== currentQueueItem.queueId);
      const shuffled = [currentQueueItem, ...shuffleArray(rest)];
      setQueue(shuffled);
      setCurrentIndex(0);
    } else if (!nextShuffle && originalQueue.length > 0) {
      setQueue(originalQueue);
      if (currentQueueItem) {
        const origIndex = originalQueue.findIndex((item) => item.queueId === currentQueueItem.queueId);
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
        currentQueueItem,
        playbackState,
        isPlaying,
        position,
        duration: duration || currentTrack?.duration || 0,
        isInitialized,
        queue,
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
        moveInQueue,
        clearQueue,
        playFromQueue,
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
