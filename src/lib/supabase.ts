// CampusMart Phase 1 — Centralized Supabase client
// Security: only VITE_SUPABASE_PUBLISHABLE_KEY (anon key) is used.
// VITE_SUPABASE_SERVICE_ROLE_KEY must NEVER exist here (QR-07).

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. ' +
    'Copy .env.example to .env and fill in your Supabase project credentials.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
