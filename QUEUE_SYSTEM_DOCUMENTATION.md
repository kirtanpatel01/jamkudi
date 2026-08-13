# Jamkudi Global Queue & Up Next System - Technical Documentation

The **Jamkudi Global Queue & Up Next System** (`src/context/PlayerContext.tsx` & `src/components/common/QueueModal.tsx`) provides a single, canonical global queue serving all screens (Home, Search, Artist, Album, Library, MiniPlayer, Full Player).

---

## 1. Single Global Queue Data Model

```ts
export type QueueSource =
  | "search"
  | "album"
  | "artist"
  | "playlist"
  | "collection"
  | "mood"
  | "home"
  | "library"
  | "manual";

export interface QueueItem {
  queueId: string;
  track: Track;
  addedAt: number;
  source?: QueueSource;
}
```

### Unique Queue Occurrence Identifier (`queueId`)
Each item in the queue is identified by a unique `queueId` (e.g. `${track.id}_${timestamp}_${random}`). This allows intentional duplicate tracks to exist in the queue (e.g., *Apna Bana Le* added twice). Removing an item by `queueId` removes ONLY that specific queue occurrence without removing other instances.

---

## 2. Global Queue API Methods (`PlayerContext.tsx`)

| API Method | Behavior | Impact on Playback |
| :--- | :--- | :--- |
| **`playQueue(tracks, index, source)`** | Replaces active queue with `QueueItem[]` | Starts playing track at `index` |
| **`playNext(track, source)`** | Inserts track at `currentIndex + 1` | Does NOT interrupt current song |
| **`addToQueue(track, source)`** | Appends track to end of queue | Does NOT interrupt current song |
| **`removeFromQueue(queueId)`** | Removes item matching `queueId` | If active item removed, plays next |
| **`moveInQueue(fromIndex, toIndex)`** | Reorders items in `queue` | Reorders without restarting track |
| **`clearQueue()`** | Clears all upcoming tracks | Keeps current song playing! |
| **`playFromQueue(queueId)`** | Advances directly to item `queueId` | Starts playback of selected item |

---

## 3. Up Next Queue Sheet (`QueueModal.tsx`)

Accessible from the Full Player modal (`/player`) via the **Queue** button without interrupting playback.

1. **NOW PLAYING**: Card showing active track artwork, title, artist, duration, and play status.
2. **UP NEXT**: List of upcoming `QueueItem` rows showing rank index (`01`, `02`), artwork, title, artist, duration, **Move Up (▲)** / **Move Down (▼)** reorder controls, and **Remove (✕)** action button.
3. **Clear Queue Action**: Lightweight confirmation alert clearing upcoming items while keeping current track playing smoothly.
4. **Empty State**: Shown when no upcoming tracks exist (*"No tracks up next • Add songs from Search, Albums, Artists, or your Library."*).

---

## 4. Acceptance Verification Matrix

- [x] Single global queue shared across all screens.
- [x] Unique `queueId` supporting intentional duplicate songs.
- [x] Both **Play Next** (insert after current) and **Add to Queue** (append to end) provided.
- [x] Queue screen reordering (`moveInQueue`) and removal (`removeFromQueue`).
- [x] Non-destructive `clearQueue` keeping current song playing.
- [x] Automatic queue progression upon track completion.
- [x] MiniPlayer & Toast system feedback.
- [x] `npx tsc --noEmit` passing with **0 errors**.
