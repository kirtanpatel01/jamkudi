export interface RemoteCommandListeners {
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onInterruption?: () => void;
  onError?: (err: any) => void;
}

export interface AudioPlayerInstance {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  playing: boolean;
  currentTime: number;
  duration: number;
  hasError?: boolean;
  setActiveForLockScreen?: (active: boolean, metadata?: any) => void;
  setRemoteCommandListeners?: (listeners: RemoteCommandListeners) => void;
  unload?: () => void;
}

let expoAudioModule: any = null;
try {
  expoAudioModule = require('expo-audio');
} catch (e) {
  expoAudioModule = null;
}

export async function initAudioSystem(): Promise<void> {
  try {
    if (expoAudioModule && expoAudioModule.requestNotificationPermissionsAsync) {
      await expoAudioModule.requestNotificationPermissionsAsync();
    }
  } catch {}

  try {
    if (expoAudioModule && expoAudioModule.setAudioModeAsync) {
      await expoAudioModule.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: "doNotMix",
      });
    }
  } catch {}
}

export function createUnifiedPlayer(streamUrl: string): AudioPlayerInstance {
  let listeners: RemoteCommandListeners = {};
  let hasErrorState = false;

  // 1. Try expo-audio native player
  if (expoAudioModule && expoAudioModule.createAudioPlayer) {
    try {
      const player = expoAudioModule.createAudioPlayer(streamUrl);
      if (player) {
        if (typeof player.addListener === "function") {
          try {
            player.addListener("statusChange", (status: any) => {
              if (status?.error) {
                hasErrorState = true;
                listeners.onError?.(status.error);
              }
            });
          } catch {}
        }
        return {
          play: () => { try { player.play(); } catch {} },
          pause: () => { try { player.pause(); } catch {} },
          seekTo: (seconds: number) => { try { player.seekTo(seconds); } catch {} },
          get playing() { return player.playing ?? player.isPlaying ?? false; },
          get currentTime() { return player.currentTime ?? 0; },
          get duration() { return player.duration ?? 0; },
          get hasError() { return hasErrorState; },
          setActiveForLockScreen: (_active: boolean, _metadata?: any) => {
            try {
              if (player.setLockScreenMetadata) {
                player.setLockScreenMetadata(_metadata);
              }
            } catch {}
          },
          setRemoteCommandListeners: (l: RemoteCommandListeners) => {
            listeners = l;
          },
          unload: () => {
            try { if (player.release) player.release(); else if (player.remove) player.remove(); } catch {}
          },
        };
      }
    } catch (err) {
      console.warn("expo-audio native player failed, using fallback player:", err);
    }
  }

  // 2. Fallback web / mock player
  let mockPlaying = false;
  let mockTime = 0;

  return {
    play: () => { mockPlaying = true; },
    pause: () => { mockPlaying = false; },
    seekTo: (seconds: number) => { mockTime = seconds; },
    get playing() { return mockPlaying; },
    get currentTime() { return mockTime; },
    get duration() { return 180; },
    get hasError() { return hasErrorState; },
    setActiveForLockScreen: () => {},
    setRemoteCommandListeners: (l: RemoteCommandListeners) => {
      listeners = l;
    },
    unload: () => { mockPlaying = false; },
  };
}
