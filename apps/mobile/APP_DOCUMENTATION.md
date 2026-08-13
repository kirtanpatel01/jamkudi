# Jamkudi Music App - Feature & Technical Architecture Documentation

Jamkudi is a full-featured, cross-platform audio streaming application built with **Expo SDK 57**, **React Native 0.86**, **TypeScript**, **NativeWind v5 / Tailwind CSS v4**, and the native **`expo-audio`** playback engine. It streams high-fidelity 320kbps audio from the **JioSaavn API**.

---

## 1. Executive Summary & Tech Stack

- **Framework**: Expo SDK 57 (`expo-router` v57 file-based navigation)
- **Runtime**: React Native 0.86 (React 19)
- **Audio Engine**: `expo-audio` with background playback & lock-screen media controls
- **Styling System**: NativeWind v5 (`react-native-css`, Tailwind CSS v4)
- **Fonts**: Custom Google Fonts (**Fredoka** for headers & **Nunito** for UI text)
- **API Provider**: JioSaavn REST API (`saavn.sumit.co` & `saavn.dev`)

---

## 2. Feature-Wise Breakdown & Implementation Details

### 2.1 Background Audio Streaming & Native OS Controls
- **What it does**: Streams audio in the background even when the app is minimized or the screen is locked, displaying media controls in the phone's notification drawer and lock screen.
- **How it's implemented**:
  - Configured `setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" })` in `src/context/PlayerContext.tsx`.
  - Added iOS `UIBackgroundModes: ["audio"]` and Android permissions (`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `WAKE_LOCK`) in `app.json`.
  - Invokes `player.setActiveForLockScreen(true, metadata)` when a track starts playing, providing track title, artist, album name, and 500x500 artwork.
  - Automatically requests notification permissions on Android 13+ via `requestNotificationPermissionsAsync()`.

---

### 2.2 Full-Screen Audio Player Modal ([player.tsx](file:///e:/self/jamkudi/src/app/player.tsx))
- **What it does**: A full-screen audio player with interactive controls and progress slider.
- **How it's implemented**:
  - **Album Artwork**: Displays high-res album artwork inside a 340x340 rounded card with soft drop shadows.
  - **Progress Seeker**: Integrates `@react-native-community/slider` linked to `position` and `duration` from `PlayerContext`. Allows real-time sliding with elapsed (`1:45`) and remaining (`3:30`) time updates.
  - **Controls Bar**:
    - **Play/Pause**: Toggles playback via `togglePlayPause()`.
    - **Skip Next / Skip Previous**: Binds to `skipToNext()` and `skipToPrevious()`. Includes smart rewind (restarts song if >3 seconds into track).
    - **Up-Next Queue Button**: Opens `QueueModal`.
    - **Lyrics Button**: Opens `LyricsModal`.
    - **Header Dismiss**: Chevron button calling `router.back()` to dismiss modal.

---

### 2.3 Persistent Floating Mini-Player Bar ([MiniPlayer.tsx](file:///e:/self/jamkudi/src/components/common/MiniPlayer.tsx))
- **What it does**: A floating player bar fixed above the bottom navigation tabs across Home, Search, and Library screens.
- **How it's implemented**:
  - Positioned absolutely at `bottom-16` inside `src/app/(tabs)/_layout.tsx`.
  - Includes a top mini progress line indicator (`(position / duration) * 100%`).
  - Displays thumbnail artwork, single-line track title, and artist name.
  - Provides quick Play/Pause and Skip Next buttons.
  - Tapping the mini-player body triggers `router.push("/player")` to open the full-screen player.

---

### 2.4 Queue System & Auto-Next Playback ([PlayerContext.tsx](file:///e:/self/jamkudi/src/context/PlayerContext.tsx))
- **What it does**: Manages track queues, manual skipping, and automatic track advancement when a song finishes.
- **How it's implemented**:
  - Maintained global state: `queue: JioSaavnSong[]`, `currentIndex: number`.
  - **`playQueue(songs, index)`**: Populates the active queue and starts playing the track at `index`.
  - **`addToQueue(song)`**: Appends a song to the active queue.
  - **Auto-Next Detection**: The status polling interval detects when `currentTime >= duration - 0.8` seconds and automatically triggers `skipToNext()`.

---

### 2.5 Dynamic Home Discovery Feed ([index.tsx](file:///e:/self/jamkudi/src/app/%28tabs%29/index.tsx))
- **What it does**: The central discovery hub with personalized feeds and top charts.
- **How it's implemented**:
  - **Dynamic Time Greeting**: Evaluates device time (`getGreeting()`) to display "Good morning", "Good afternoon", or "Good evening".
  - **Quick Access Grid**: 2x3 grid of top tracks with live playing indicators.
  - **Trending Hits Carousel**: Horizontal `ScrollView` displaying 140x140 square artwork cards.
  - **Featured Artists Carousel**: Circular profile avatar cards for Arijit Singh, Shreya Ghoshal, Pritam, Anirudh, and Badshah. Tapping an artist queries JioSaavn for their top tracks and queues them.
  - **Top Charts List**: Vertical song list displaying title, artist, album, duration, and 1-tap playback.

---

### 2.6 Search & Genre Category Exploration ([search.tsx](file:///e:/self/jamkudi/src/app/%28tabs%29/search.tsx))
- **What it does**: Real-time JioSaavn song search and 1-tap genre category filtering.
- **How it's implemented**:
  - **Debounced Input**: Search input with 400ms debounce calling `searchSongs(query)`.
  - **Genre Chips**: Category pills bar ("Trending", "Bollywood", "Punjabi", "Romantic", "Pop", "Lo-Fi", "Dance"). Tapping a pill instantly updates search results for that genre.
  - **Queue Integration**: Tapping any song in search results populates the entire search result list into the queue for continuous auto-next playback.

---

### 2.7 Up-Next Queue Sheet Modal ([QueueModal.tsx](file:///e:/self/jamkudi/src/components/common/QueueModal.tsx))
- **What it does**: Displays the list of songs in the active queue with 1-tap track jumping.
- **How it's implemented**:
  - Modal component showing track index (`Track 2 of 15`), track artwork, title, artist, and duration.
  - Highlights the currently active song with a purple border and animated icon.
  - Tapping any song invokes `playQueue(queue, index)` to jump directly to that song.

---

### 2.8 Synchronized Song Lyrics Overlay ([LyricsModal.tsx](file:///e:/self/jamkudi/src/components/common/LyricsModal.tsx))
- **What it does**: Fetches and displays song lyrics for the playing track.
- **How it's implemented**:
  - Implemented `getLyrics(songId)` in `src/services/jiosaavn.ts` fetching from `/songs/:id/lyrics`.
  - Displays track metadata and scrollable formatted lyrics text with HTML entity unescaping (`<br>` to line breaks).

---

### 2.9 Your Library & Playlists Hub ([library.tsx](file:///e:/self/jamkudi/src/app/%28tabs%29/library.tsx))
- **What it does**: Personal music collection manager.
- **How it's implemented**:
  - **Liked Songs Banner**: Featured purple gradient card with quick play action.
  - **Curated Playlists**: Quick access cards for Arijit Special, Chill Lo-Fi, and Workout Punjabi playlists.

---

### 2.10 Settings & Audio Quality Selector ([SettingsModal.tsx](file:///e:/self/jamkudi/src/components/common/SettingsModal.tsx))
- **What it does**: App preferences and streaming quality control.
- **How it's implemented**:
  - Allows selecting between **High Definition (320 kbps)** for maximum fidelity and **Data Saver (160 kbps)** for reduced cellular data usage.
  - Accessible via the Settings gear icon in the Home Screen header.

---

## 3. Project Directory Structure

```
jamkudi/
├── app.json                  # Expo config, permissions & plugins
├── package.json              # App dependencies & pinned packages
├── APP_DOCUMENTATION.md      # Full application documentation
├── src/
│   ├── app/                  # Expo Router file-based routes
│   │   ├── _layout.tsx       # Root layout & PlayerProvider wrapper
│   │   ├── player.tsx        # Full-screen Audio Player modal
│   │   └── (tabs)/           # Tab Navigation
│   │       ├── _layout.tsx   # Tabs layout & MiniPlayer wrapper
│   │       ├── index.tsx     # Home Screen discovery feed
│   │       ├── search.tsx    # Live Search & Genre category pills
│   │       └── library.tsx   # Your Library & Playlists
│   ├── components/
│   │   └── common/           # Shared UI components
│   │       ├── AppText.tsx   # Custom Typography component
│   │       ├── Icon.tsx      # Icon component wrapper
│   │       ├── IconButton.tsx# Accessible icon button
│   │       ├── MiniPlayer.tsx# Persistent floating mini player
│   │       ├── QueueModal.tsx# Up-Next queue viewer modal
│   │       ├── LyricsModal.tsx# Song lyrics viewer modal
│   │       ├── SettingsModal.tsx# Settings & Audio Quality modal
│   │       └── Screen.tsx    # Safe area container wrapper
│   ├── context/
│   │   └── PlayerContext.tsx # Global audio player & queue state
│   ├── services/
│   │   └── jiosaavn.ts       # JioSaavn API service & data formatters
│   ├── tw/                   # NativeWind / Tailwind CSS wrappers
│   └── global.css            # Global CSS theme & Google Fonts
```
