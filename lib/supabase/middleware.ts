import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make your app very slow!

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const isAuthPage = pathname === '/login'
    const isOnboardingPage = pathname === '/onboarding'
    const isDashboardPage = pathname.startsWith('/dashboard')
    const isUnauthorizedPage = pathname === '/unauthorized'

    // Allow access to unauthorized page without auth
    if (isUnauthorizedPage) {
        return supabaseResponse
    }

    // Protect dashboard and onboarding routes - redirect to login if not authenticated
    if (!user && (isDashboardPage || isOnboardingPage)) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // For authenticated users, check profile and onboarding status
    if (user && (isDashboardPage || isOnboardingPage)) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed, is_active')
            .eq('id', user.id)
            .single()

        // If no profile exists for this user, they weren't properly claimed
        // This shouldn't happen if callback worked, but handle edge case
        if (!profile) {
            const url = request.nextUrl.clone()
            url.pathname = '/unauthorized'
            return NextResponse.redirect(url)
        }

        // Check if user is deactivated
        if (profile.is_active === false) {
            // Sign out and redirect to unauthorized
            await supabase.auth.signOut()
            const url = request.nextUrl.clone()
            url.pathname = '/unauthorized'
            url.searchParams.set('reason', 'deactivated')
            return NextResponse.redirect(url)
        }

        // Handle onboarding redirects
        if (isDashboardPage && !profile.onboarding_completed) {
            // User needs to complete onboarding first
            const url = request.nextUrl.clone()
            url.pathname = '/onboarding'
            return NextResponse.redirect(url)
        }

        if (isOnboardingPage && profile.onboarding_completed) {
            // User already completed onboarding, go to dashboard
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    // Redirect authenticated users away from login page
    if (user && isAuthPage) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()

        const url = request.nextUrl.clone()
        url.pathname = (!profile || !profile.onboarding_completed) ? '/onboarding' : '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
