import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publicKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!url || !publicKey) {
  console.warn(
    '[Cashly] Supabase credentials missing. Copy .env.example to .env and fill in EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY.',
  );
}

// Use an untyped client — the Supabase typed Database gets gnarly fast with our
// Insert/Update semantics. We enforce shapes manually in src/services/*.
export const supabase: SupabaseClient = createClient(url ?? 'http://invalid.invalid', publicKey ?? 'invalid', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
