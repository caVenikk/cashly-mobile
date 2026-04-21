import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const publicKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

if (!url || !publicKey) {
  console.warn(
    '[Cashly] Supabase credentials missing. Copy .env.example to .env and fill in EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY.',
  );
}

// On web the default storage is localStorage, which is what we want for "stay
// logged in across reloads". On native there is no built-in storage adapter
// without async-storage/mmkv, so we fall back to in-memory: sessions won't
// survive app restart, but the deployed target is web-first.
const persistSession = Platform.OS === 'web';

export const supabase: SupabaseClient = createClient(
  url || 'https://placeholder.supabase.co',
  publicKey || 'placeholder',
  {
    auth: {
      persistSession,
      autoRefreshToken: persistSession,
      detectSessionInUrl: false,
    },
  },
);
