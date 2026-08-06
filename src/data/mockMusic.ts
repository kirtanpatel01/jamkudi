export interface QuickAccessItem {
  id: string;
  title: string;
  imageUrl?: string;
  isGradient?: boolean;
  gradientColors?: [string, string];
}

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  type: "album" | "playlist" | "artist";
  tag?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  imageUrl: string;
}

export const QUICK_ACCESS_DATA: QuickAccessItem[] = [
  {
    id: "qa_liked",
    title: "Liked Songs",
    isGradient: true,
    gradientColors: ["#8B5CF6", "#F43F5E"],
  },
  {
    id: "qa_discover",
    title: "Discover Weekly",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80",
  },
  {
    id: "qa_mix1",
    title: "Daily Mix 1",
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80",
  },
  {
    id: "qa_chill",
    title: "Chill Hits",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80",
  },
  {
    id: "qa_bollywood",
    title: "Bollywood Mix",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80",
  },
  {
    id: "qa_recent",
    title: "Recently Played",
    imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80",
  },
];

export const MADE_FOR_YOU_DATA: MediaItem[] = [
  {
    id: "mfy_1",
    title: "Daily Mix 1",
    description: "Arijit Singh, Pritam, Sachin-Jigar and more",
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
    type: "playlist",
  },
  {
    id: "mfy_2",
    title: "Daily Mix 2",
    description: "The Weeknd, Dua Lipa, Bruno Mars and more",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
    type: "playlist",
  },
  {
    id: "mfy_3",
    title: "Discover Weekly",
    description: "Your weekly mixtape of fresh music updated every Monday",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    type: "playlist",
    tag: "NEW",
  },
  {
    id: "mfy_4",
    title: "Release Radar",
    description: "Never miss a new release from your favorite artists",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
    type: "playlist",
  },
  {
    id: "mfy_5",
    title: "Daily Mix 3",
    description: "Diljit Dosanjh, AP Dhillon, Karan Aujla and more",
    imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80",
    type: "playlist",
  },
];

export const RECENTLY_PLAYED_DATA: MediaItem[] = [
  {
    id: "rec_1",
    title: "Arijit Singh",
    description: "Artist",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    type: "artist",
  },
  {
    id: "rec_2",
    title: "After Hours",
    description: "The Weeknd • Album",
    imageUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80",
    type: "album",
  },
  {
    id: "rec_3",
    title: "Aditya Gadhvi",
    description: "Artist",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    type: "artist",
  },
  {
    id: "rec_4",
    title: "Jamkudi Top 50",
    description: "Playlist • 50 tracks",
    imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80",
    type: "playlist",
  },
  {
    id: "rec_5",
    title: "Dua Lipa",
    description: "Artist",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
    type: "artist",
  },
];

export const TOP_MIXES_DATA: MediaItem[] = [
  {
    id: "mix_1",
    title: "Bollywood Mix",
    description: "The biggest Hindi hits right now",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80",
    type: "playlist",
  },
  {
    id: "mix_2",
    title: "Chill Mix",
    description: "Relaxing acoustic and lo-fi tracks",
    imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80",
    type: "playlist",
  },
  {
    id: "mix_3",
    title: "Pop Mix",
    description: "Upbeat pop hits to energize your day",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
    type: "playlist",
  },
  {
    id: "mix_4",
    title: "Romantic Mix",
    description: "Melodic love songs for special moments",
    imageUrl: "https://images.unsplash.com/photo-1518834107882-7782c5053229?w=400&q=80",
    type: "playlist",
  },
  {
    id: "mix_5",
    title: "Coding Mix",
    description: "Deep focus synthwave & ambient beats",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80",
    type: "playlist",
  },
];

export const CURRENTLY_PLAYING: Track = {
  id: "track_now",
  title: "Blinding Lights",
  artist: "The Weeknd",
  album: "After Hours",
  duration: "3:20",
  imageUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80",
};
