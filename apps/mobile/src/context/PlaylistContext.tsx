import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { Track } from "@/types/track";
import { JioSaavnSong } from "@/services/jiosaavn";
import {
  UserPlaylist,
  fetchUserPlaylists,
  createUserPlaylist,
  updateUserPlaylist,
  deleteUserPlaylist,
  addTrackToUserPlaylist,
  removeTrackFromUserPlaylist,
  reorderUserPlaylistTracks,
} from "@/services/playlistService";

interface PlaylistContextType {
  playlists: UserPlaylist[];
  loading: boolean;
  refreshPlaylists: () => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<UserPlaylist>;
  updatePlaylist: (id: string, name: string, description?: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track | JioSaavnSong) => Promise<{ success: boolean; isDuplicate: boolean }>;
  removeTrackFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  reorderPlaylistTracks: (playlistId: string, tracks: JioSaavnSong[]) => Promise<void>;
  getPlaylistById: (id: string) => UserPlaylist | null;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUserPlaylists(user?.id);
      setPlaylists(data);
    } catch (err) {
      console.warn("Failed to load user playlists:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  const createPlaylist = async (name: string, description?: string): Promise<UserPlaylist> => {
    const newPl = await createUserPlaylist(name, description, user?.id);
    await refreshPlaylists();
    return newPl;
  };

  const updatePlaylist = async (id: string, name: string, description?: string): Promise<void> => {
    await updateUserPlaylist(id, name, description, user?.id);
    await refreshPlaylists();
  };

  const deletePlaylist = async (id: string): Promise<void> => {
    await deleteUserPlaylist(id, user?.id);
    await refreshPlaylists();
  };

  const addTrackToPlaylist = async (
    playlistId: string,
    track: Track | JioSaavnSong
  ): Promise<{ success: boolean; isDuplicate: boolean }> => {
    const result = await addTrackToUserPlaylist(playlistId, track, user?.id);
    if (result.success) {
      await refreshPlaylists();
    }
    return result;
  };

  const removeTrackFromPlaylist = async (playlistId: string, songId: string): Promise<void> => {
    await removeTrackFromUserPlaylist(playlistId, songId, user?.id);
    await refreshPlaylists();
  };

  const reorderPlaylistTracks = async (playlistId: string, tracks: JioSaavnSong[]): Promise<void> => {
    await reorderUserPlaylistTracks(playlistId, tracks, user?.id);
    await refreshPlaylists();
  };

  const getPlaylistById = useCallback(
    (id: string): UserPlaylist | null => {
      return playlists.find((p) => p.id === id) || null;
    },
    [playlists]
  );

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        loading,
        refreshPlaylists,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        reorderPlaylistTracks,
        getPlaylistById,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylists = (): PlaylistContextType => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error("usePlaylists must be used within a PlaylistProvider");
  }
  return context;
};
