import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || ''

/**
 * Standard Supabase client using the publishable key (sb_publishable_xxx).
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey)
