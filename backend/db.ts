// backend/db.ts
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Create a single Supabase client for use across the app
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// You can now use 'supabase' to interact with your database.
// Example:
// const { data, error } = await supabase.from('User').select('*');