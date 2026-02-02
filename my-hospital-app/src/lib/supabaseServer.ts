import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for Next.js API routes
// Tries service role key first, falls back to public anon key if necessary
const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined;
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string | undefined;

if (!supabaseUrl || !serviceKey) {
  console.warn('[Inventory] Supabase env missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_*) are set.');
}

export const supabaseServer = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey)
  : ({
    from: () => ({
      select: async () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
  } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
