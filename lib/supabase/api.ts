import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Simple Supabase client for API routes (Route Handlers)
// This doesn't handle cookies/sessions since API routes don't need user context
// For user-authenticated API routes, use the server.ts client instead

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
    if (!supabaseServiceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
    }
    return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey)
}
