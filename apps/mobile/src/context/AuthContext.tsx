import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  fetchAuthMe,
  loginApi,
  signUpApi,
  logoutApi,
  updateProfile as updateProfileApi,
  UserProfile,
  User,
  Session,
  getStoredAuthToken,
} from '@/services/apiClient';

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

  const loadBackendProfile = useCallback(async () => {
    try {
      const res = await fetchAuthMe();
      setUser(res.user);
      setProfile(res.profile);
    } catch (err: any) {
      console.warn('Backend profile fetch notice:', err.message);
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadBackendProfile();
    }
  }, [user, loadBackendProfile]);

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const res = await updateProfileApi(updates);
      setProfile(res.profile);
    } catch (err: any) {
      console.error('Failed to update profile data:', err);
      throw err;
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function checkInitialAuth() {
      try {
        const token = await getStoredAuthToken();
        if (token) {
          setSession({ access_token: token });
          const res = await fetchAuthMe();
          if (isMounted) {
            setUser(res.user);
            setProfile(res.profile);
          }
        }
      } catch (err: any) {
        console.warn('Initial auth check notice:', err.message);
        if (isMounted) {
          await logoutApi();
          setUser(null);
          setProfile(null);
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkInitialAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await loginApi(email, password);
      setUser(res.user);
      setSession(res.session);
      setProfile(res.profile);
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
      const res = await signUpApi(email, password);
      setUser(res.user);
      setSession(res.session);
      setProfile(res.profile);
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
      await logoutApi();
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
