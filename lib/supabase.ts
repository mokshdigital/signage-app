// Re-export from the new supabase client structure for backward compatibility
// Use @/lib/supabase/client for client components
// Use @/lib/supabase/server for server components

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser-side Supabase client for use in Client Components
// This maintains backward compatibility with existing code
export function createClient() {
    return createBrowserClient<Database>(
        supabaseUrl,
        supabaseAnonKey
    )
}

// Default export for backward compatibility
export const supabase = createClient()
