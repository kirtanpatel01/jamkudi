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
  playTrack: (song: JioSaavnSong) => Promise<void>;
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

  const playerRef = useRef<AudioPlayer | null>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    // Request notification permission for Android lock screen & notification shade controls
    requestNotificationPermissionsAsync().catch(() => {});

    // Set audio mode for background playback & lock screen controls
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    })
      .then(() => setIsInitialized(true))
      .catch(() => setIsInitialized(true));

    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (player) {
        try {
          if (typeof player.playing === "boolean") {
            setIsPlaying(player.playing);
          }
          if (typeof player.currentTime === "number" && !isNaN(player.currentTime)) {
            setPosition(player.currentTime);
          }
          if (typeof player.duration === "number" && !isNaN(player.duration) && player.duration > 0) {
            setDuration(player.duration);
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

  const playTrack = async (song: JioSaavnSong) => {
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

      // Enable lock screen & notification drawer controls with metadata
      try {
        player.setActiveForLockScreen(true, {
          title: song.title,
          artist: song.artist,
          albumTitle: song.album,
          artworkUrl: song.artwork,
        });
      } catch (lockErr) {
        console.log("Lock screen controls initialization notice:", lockErr);
      }

      player.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error creating audio player:", error);
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
        playTrack,
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
