import { safeStorage } from '@/utils/safeStorage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dehivfdemtfljszowwtx.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tMIcFk18gTZ1l5gTDCBVIw_x7L-jh3i';

/**
 * React Native Supabase client initialized with safeStorage for persistent sessions.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
