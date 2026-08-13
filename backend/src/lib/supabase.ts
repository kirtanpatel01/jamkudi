import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_placeholder'

/**
 * Standard Supabase client using the publishable key (sb_publishable_xxx).
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey)

/**
 * Creates a per-request Supabase client scoped with the user's Bearer access token.
 * All queries made through this client automatically enforce Row Level Security (RLS).
 */
export function getSupabaseUserClient(accessToken: string) {
  return createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  })
}
