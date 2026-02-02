import { createClient } from '@supabase/supabase-js';

// Uses public keys for client-side reads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// A minimal stub that mimics the chained API used in the app and always returns no data.
const supabaseStub = {
  from: () => ({
    select: () => ({
      limit: async () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
  }),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = supabaseStub;
try {
  if (supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Using fallback data.');
  }
} catch (e) {
  console.warn('Failed to initialize Supabase client, using stub. Error:', e);
}

export const supabase = client;
