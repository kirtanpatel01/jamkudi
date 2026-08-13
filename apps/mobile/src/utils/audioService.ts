export interface AudioPlayerInstance {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  playing: boolean;
  currentTime: number;
  duration: number;
  setActiveForLockScreen?: (active: boolean, metadata?: any) => void;
  unload?: () => void;
}

let expoAudioModule: any = null;
try {
  expoAudioModule = require('expo-audio');
} catch (e) {
  expoAudioModule = null;
}

let expoAvModule: any = null;
try {
  expoAvModule = require('expo-av');
} catch (e) {
  expoAvModule = null;
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
    } else if (expoAvModule && expoAvModule.Audio && expoAvModule.Audio.setAudioModeAsync) {
      await expoAvModule.Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    }
  } catch {}
}

export function createUnifiedPlayer(streamUrl: string): AudioPlayerInstance {
  // 1. Try expo-audio native player
  if (expoAudioModule && expoAudioModule.createAudioPlayer) {
    try {
      const player = expoAudioModule.createAudioPlayer(streamUrl);
      if (player) return player;
    } catch (err) {
      console.warn("expo-audio native player failed, trying fallback:", err);
    }
  }

  // 2. Try expo-av Audio.Sound player
  if (expoAvModule && expoAvModule.Audio && expoAvModule.Audio.Sound) {
    try {
      let soundObj: any = new expoAvModule.Audio.Sound();
      let isPlayingState = false;
      let currentPos = 0;
      let totalDur = 0;

      soundObj.loadAsync({ uri: streamUrl }, { shouldPlay: true })
        .then((status: any) => {
          if (status.isLoaded) {
            isPlayingState = status.isPlaying;
            currentPos = (status.positionMillis || 0) / 1000;
            totalDur = (status.durationMillis || 0) / 1000;
          }
        })
        .catch((err: any) => console.log("expo-av load notice:", err));

      soundObj.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          isPlayingState = status.isPlaying;
          currentPos = (status.positionMillis || 0) / 1000;
          totalDur = (status.durationMillis || 0) / 1000;
        }
      });

      return {
        play: () => {
          soundObj?.playAsync().catch(() => {});
          isPlayingState = true;
        },
        pause: () => {
          soundObj?.pauseAsync().catch(() => {});
          isPlayingState = false;
        },
        seekTo: (seconds: number) => {
          soundObj?.setPositionAsync(seconds * 1000).catch(() => {});
          currentPos = seconds;
        },
        get playing() {
          return isPlayingState;
        },
        get currentTime() {
          return currentPos;
        },
        get duration() {
          return totalDur;
        },
        setActiveForLockScreen: () => {},
        unload: () => {
          soundObj?.unloadAsync().catch(() => {});
          soundObj = null;
        },
      };
    } catch (avErr) {
      console.warn("expo-av player failed, using web/mock player:", avErr);
    }
  }

  // 3. Fallback web / mock player
  let mockPlaying = false;
  let mockTime = 0;

  return {
    play: () => { mockPlaying = true; },
    pause: () => { mockPlaying = false; },
    seekTo: (seconds: number) => { mockTime = seconds; },
    get playing() { return mockPlaying; },
    get currentTime() { return mockTime; },
    get duration() { return 180; },
    setActiveForLockScreen: () => {},
    unload: () => { mockPlaying = false; },
  };
}
