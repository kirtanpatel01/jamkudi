export type Track = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  audioUrl: string;
  duration: number;
};

export type PlaybackState =
  | "idle"
  | "loading"
  | "buffering"
  | "playing"
  | "paused"
  | "error";

export type RepeatMode = "OFF" | "ALL" | "ONE";

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
