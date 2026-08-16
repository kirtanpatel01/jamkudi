import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { safeStorage } from '@/utils/safeStorage';

const AUTH_TOKEN_KEY = 'jamkudi_auth_token';

const getApiBaseUrl = (): string => {
  let url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        return `http://${hostIp}:3000`;
      }
    }
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }
  }
  return url;
};

const API_BASE_URL = getApiBaseUrl();

export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorite_genres?: string[];
  favorite_artists?: string[];
  onboarding_completed?: boolean;
}

export interface User {
  id: string;
  email: string | null;
}

export interface Session {
  access_token: string;
  refresh_token?: string;
  user?: User;
}

export interface AuthResponse {
  user: User;
  session: Session | null;
  profile: UserProfile;
}

export async function getStoredAuthToken(): Promise<string | null> {
  return safeStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setStoredAuthToken(token: string | null): Promise<void> {
  if (token) {
    await safeStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await safeStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

/**
 * Reusable HTTP API request wrapper that attaches the active stored JWT access token.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getStoredAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      body?.message || body?.error || `Request failed with status ${response.status}`
    );
  }

  return body as T;
}

/**
 * Calls backend POST /auth/login to authenticate with backend.
 */
export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.session?.access_token) {
    await setStoredAuthToken(res.session.access_token);
  }
  return res;
}

/**
 * Calls backend POST /auth/signup to register with backend.
 */
export async function signUpApi(email: string, password: string): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.session?.access_token) {
    await setStoredAuthToken(res.session.access_token);
  }
  return res;
}

/**
 * Clears stored token on logout.
 */
export async function logoutApi(): Promise<void> {
  await setStoredAuthToken(null);
}

/**
 * Calls backend GET /auth/me to retrieve authenticated user details and profile.
 */
export async function fetchAuthMe(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/me');
}

/**
 * Calls backend GET /profile to retrieve current profile.
 */
export async function fetchProfile(): Promise<{ profile: UserProfile }> {
  return apiRequest<{ profile: UserProfile }>('/profile');
}

/**
 * Calls backend PATCH /profile to update allowed profile fields.
 */
export async function updateProfile(
  updates: Partial<Omit<UserProfile, 'id'>>
): Promise<{ profile: UserProfile }> {
  return apiRequest<{ profile: UserProfile }>('/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}
