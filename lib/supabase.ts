import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    // During SSR/build, return null to prevent errors
    if (!supabaseUrl || !supabaseKey) {
      return null;
    }
  }

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      'Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and a Supabase key to your .env.local file.'
    );
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey);
  }

  return supabaseInstance;
}

export const supabase = getSupabase();
