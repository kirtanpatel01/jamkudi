import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fetchAuthMe, updateProfile as updateProfileApi, UserProfile } from '@/services/apiClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadBackendProfile = useCallback(async (activeUser: User) => {
    try {
      const res = await fetchAuthMe();
      setProfile(res.profile);
    } catch (err: any) {
      console.warn('Backend profile fetch notice:', err.message);
      // Fallback profile from Supabase directly or default
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .maybeSingle();

      if (dbProfile) {
        setProfile(dbProfile as UserProfile);
      } else {
        setProfile({
          id: activeUser.id,
          username: activeUser.email?.split('@')[0] || activeUser.id.slice(0, 8),
          display_name:
            activeUser.user_metadata?.full_name ||
            activeUser.email?.split('@')[0] ||
            'User',
          avatar_url: activeUser.user_metadata?.avatar_url || null,
          bio: null,
          favorite_genres: [],
          favorite_artists: [],
          onboarding_completed: false,
        });
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadBackendProfile(user);
    }
  }, [user, loadBackendProfile]);

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      let updatedProfile: UserProfile | null = null;
      try {
        const res = await updateProfileApi(updates);
        updatedProfile = res.profile;
      } catch (err: any) {
        console.warn('Backend API update notice, using direct Supabase fallback:', err.message);

        // Try direct update first
        let { data, error: dbErr } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .select('*')
          .maybeSingle();

        // If row doesn't exist yet, try upsert
        if (dbErr || !data) {
          const upsertRes = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
            .select('*')
            .maybeSingle();
          data = upsertRes.data;
          dbErr = upsertRes.error;
        }

        if (dbErr) {
          console.error('Supabase profile update error:', dbErr);
          throw new Error(dbErr.message || 'Failed to save profile changes');
        }

        if (data) {
          updatedProfile = data as UserProfile;
        }
      }

      setProfile((prev) => {
        const baseProfile: UserProfile = prev || {
          id: user.id,
          username: user.email?.split('@')[0] || user.id.slice(0, 8),
          display_name: null,
          avatar_url: null,
          bio: null,
          favorite_genres: [],
          favorite_artists: [],
          onboarding_completed: false,
        };
        return {
          ...baseProfile,
          ...updates,
          ...(updatedProfile || {}),
        };
      });
    } catch (err: any) {
      console.error('Failed to update profile data:', err);
      throw err;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Check initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        loadBackendProfile(initialSession.user).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Listen to Auth State Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await loadBackendProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadBackendProfile]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) {
        throw new Error(signInErr.message);
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await loadBackendProfile(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpErr) {
        throw new Error(signUpErr.message);
      }

      if (data.session && data.user) {
        setUser(data.user);
        setSession(data.session);
        await loadBackendProfile(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err: any) {
      setError(err.message || 'Signout failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfileData,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
