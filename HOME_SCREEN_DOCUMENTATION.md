# Jamkudi Home Screen - Feature & Visual Architecture Documentation

The **Home Screen** (`src/app/(tabs)/index.tsx`) serves as the central hub of the Jamkudi music player. It highlights Jamkudi's core mood-to-music identity by featuring **Set the Vibe ✨** right at the top, dynamic listening history, language-agnostic mood queries, honest section naming, and strict global track deduplication.

---

## 1. Executive Content Hierarchy

```mermaid
graph TD
    A[Header: WELCOME BACK + Dynamic Greeting] --> B[1. Set the Vibe - Jamkudi Mood Engine]
    B --> C[2. Continue Listening (History) OR Quick Picks (New User)]
    C --> D[3. Popular Right Now - Deduplicated Top Songs]
    D --> E[4. Featured Artists - Verified 500x500 CDN Avatars]
    E --> F[5. Trending Discovery - Distinct Music Feed]
```

---

## 2. Detailed Section Specifications

### 2.1 Section 1: Set the Vibe ✨ (Jamkudi Identity First)
- **Positioning**: Directly under the top header.
- **Purpose**: Establishes Jamkudi's core mood-to-music differentiator (*"What are you feeling right now?"*).
- **Language-Agnostic Mood Queries**:
  - **Chill 🌊** → `"Chill Melodies"`
  - **Energetic ⚡** → `"High Energy Beats"`
  - **Romantic 💖** → `"Romantic Songs"`
  - **Focus 🧠** → `"Focus Ambient"`
  - **Party 🎉** → `"Party Dance Hits"`
  - **Nostalgic 📻** → `"Nostalgic Retro Hits"`
  - **Sad 🌧️** → `"Sad Melodies"`
- **Behavior**: 1-tap execution fetches matching tracks, populates the queue, and starts playback.

---

### 2.2 Section 2: Dynamic Continue Listening 🎧 / Quick Picks ⚡
- **Dynamic Purpose**:
  - Renders **Continue Listening 🎧** with real user history from `recentlyPlayed` (`AsyncStorage`).
  - Renders **Quick Picks ⚡** when history is empty (new users).
- **Deduplication**: Played tracks are registered in the global `seenTrackIds` set.

---

### 2.3 Section 3: Popular Right Now 🔥
- **Purpose**: Broad discovery of top hits.
- **Deduplication Engine**: Filters out songs registered in `seenTrackIds` so no track repeats.

---

### 2.4 Section 4: Featured Artists 🎤
- **Honest Labeling**: Named **Featured Artists 🎤**.
- **Verified Avatars**: Pinned high-res 500x500 CDN profile URLs for Arijit Singh, A.R. Rahman, Diljit Dosanjh, Shreya Ghoshal, Anirudh Ravichander, Pritam, and Badshah.

---

### 2.5 Section 5: Trending Discovery 🎵
- **Honest Labeling**: Named **Trending Discovery 🎵**.
- **Zero Duplicate Tracks**: Strict deduplication against all earlier sections.

---

## 3. Summary Matrix

| Section | Title | Primary Purpose | Data Provider |
| :--- | :--- | :--- | :--- |
| **Section 1** | **Set the Vibe ✨** | 1-tap mood session generation | Language-neutral JioSaavn queries |
| **Section 2** | **Continue Listening / Quick Picks** | Personal listening history | `PlayerContext.recentlyPlayed` (AsyncStorage) |
| **Section 3** | **Popular Right Now 🔥** | Top popular tracks | JioSaavn API + Global Deduplication |
| **Section 4** | **Featured Artists 🎤** | Artist discography discovery | Verified 500x500 CDN Profile Images |
| **Section 5** | **Trending Discovery 🎵** | Music discovery feed | JioSaavn API + Global Deduplication |
