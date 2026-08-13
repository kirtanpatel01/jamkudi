import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface AuthMeResponse {
  user: {
    id: string;
    email: string | null;
  };
  profile: UserProfile;
}

/**
 * Reusable HTTP API request wrapper that attaches the active Supabase JWT access token.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

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
 * Calls backend GET /auth/me to retrieve authenticated user details and profile.
 */
export async function fetchAuthMe(): Promise<AuthMeResponse> {
  return apiRequest<AuthMeResponse>('/auth/me');
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
