import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// TypeScript now knows these are strings after the checks above
const SUPABASE_URL: string = supabaseUrl;
const SUPABASE_ANON_KEY: string = supabaseAnonKey;

// Singleton client instance to avoid multiple GoTrueClient instances
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

// Client-side Supabase client (for use in client components)
// This client handles auth state and cookies automatically in the browser
// Uses singleton pattern to prevent multiple instances
export function createClient() {
    if (!supabaseClient) {
        supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        });
    }
    return supabaseClient;
}

// Default export for backward compatibility
export const supabase = createClient();
