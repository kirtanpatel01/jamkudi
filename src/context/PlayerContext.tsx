import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  createAudioPlayer,
  setAudioModeAsync,
  requestNotificationPermissionsAsync,
  AudioPlayer,
} from "expo-audio";
import { JioSaavnSong } from "@/services/jiosaavn";

interface PlayerContextType {
  currentTrack: JioSaavnSong | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  isInitialized: boolean;
  queue: JioSaavnSong[];
  currentIndex: number;
  playTrack: (song: JioSaavnSong) => Promise<void>;
  playQueue: (songs: JioSaavnSong[], startIndex?: number) => Promise<void>;
  addToQueue: (song: JioSaavnSong) => void;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTrack, setCurrentTrack] = useState<JioSaavnSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [queue, setQueue] = useState<JioSaavnSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const playerRef = useRef<AudioPlayer | null>(null);
  const intervalRef = useRef<any>(null);
  const queueRef = useRef<JioSaavnSong[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const isChangingTrackRef = useRef(false);

  // Synchronize refs for interval closures
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    requestNotificationPermissionsAsync().catch(() => {});

    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    })
      .then(() => setIsInitialized(true))
      .catch(() => setIsInitialized(true));

    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (player && !isChangingTrackRef.current) {
        try {
          if (typeof player.playing === "boolean") {
            setIsPlaying(player.playing);
          }
          if (typeof player.currentTime === "number" && !isNaN(player.currentTime)) {
            setPosition(player.currentTime);
          }
          if (typeof player.duration === "number" && !isNaN(player.duration) && player.duration > 0) {
            setDuration(player.duration);

            // Auto-next track detection when song finishes
            if (
              player.currentTime > 0 &&
              player.duration > 0 &&
              player.currentTime >= player.duration - 0.8
            ) {
              const q = queueRef.current;
              const idx = currentIndexRef.current;
              if (q.length > 0 && idx < q.length - 1) {
                isChangingTrackRef.current = true;
                const nextIdx = idx + 1;
                setCurrentIndex(nextIdx);
                const nextSong = q[nextIdx];
                playTrackInternal(nextSong).finally(() => {
                  setTimeout(() => {
                    isChangingTrackRef.current = false;
                  }, 1000);
                });
              }
            }
          }
        } catch {}
      }
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch {}
      }
    };
  }, []);

  const playTrackInternal = async (song: JioSaavnSong) => {
    try {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch {}
        playerRef.current = null;
      }

      setCurrentTrack(song);
      setPosition(0);
      setDuration(song.duration || 0);

      const player = createAudioPlayer(song.url);
      playerRef.current = player;

      try {
        player.setActiveForLockScreen(true, {
          title: song.title,
          artist: song.artist,
          albumTitle: song.album,
          artworkUrl: song.artwork,
        });
      } catch (lockErr) {
        console.log("Lock screen controls notice:", lockErr);
      }

      player.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing track:", error);
    }
  };

  const playTrack = async (song: JioSaavnSong) => {
    setQueue([song]);
    setCurrentIndex(0);
    await playTrackInternal(song);
  };

  const playQueue = async (songs: JioSaavnSong[], startIndex: number = 0) => {
    if (!songs || songs.length === 0) return;
    setQueue(songs);
    const validIndex = Math.max(0, Math.min(startIndex, songs.length - 1));
    setCurrentIndex(validIndex);
    await playTrackInternal(songs[validIndex]);
  };

  const addToQueue = (song: JioSaavnSong) => {
    setQueue((prev) => [...prev, song]);
  };

  const skipToNext = async () => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    if (q.length > 0 && idx < q.length - 1) {
      const nextIdx = idx + 1;
      setCurrentIndex(nextIdx);
      await playTrackInternal(q[nextIdx]);
    }
  };

  const skipToPrevious = async () => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;

    // If more than 3 seconds into the song, restart current song
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
      } else {
        playerRef.current.play();
        setIsPlaying(true);
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

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        position,
        duration: duration || currentTrack?.duration || 0,
        isInitialized,
        queue,
        currentIndex,
        playTrack,
        playQueue,
        addToQueue,
        skipToNext,
        skipToPrevious,
        togglePlayPause,
        seekTo,
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
