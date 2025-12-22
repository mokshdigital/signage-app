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

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isAuthPage = request.nextUrl.pathname === '/login'
    const isClientLoginPage = request.nextUrl.pathname === '/client-login'
    const isOnboardingPage = request.nextUrl.pathname === '/onboarding'
    const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')
    const isClientDashboardPage = request.nextUrl.pathname.startsWith('/client-dashboard')

    // Protect internal dashboard and onboarding routes - redirect to login if not authenticated
    if (!user && (isDashboardPage || isOnboardingPage)) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Protect client dashboard - redirect to client-login if not authenticated
    if (!user && isClientDashboardPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/client-login'
        return NextResponse.redirect(url)
    }

    // For authenticated users accessing client dashboard, verify they are a client
    if (user && isClientDashboardPage) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_types, is_active')
            .eq('id', user.id)
            .single()

        // If no profile, not active, or not a client - redirect to client-login
        if (!profile || !profile.is_active) {
            await supabase.auth.signOut()
            const url = request.nextUrl.clone()
            url.pathname = '/client-login'
            return NextResponse.redirect(url)
        }

        const userTypes = profile.user_types || []
        if (!userTypes.includes('client')) {
            // Not a client - sign out and redirect
            await supabase.auth.signOut()
            const url = request.nextUrl.clone()
            url.pathname = '/client-login'
            url.searchParams.set('error', 'unauthorized')
            return NextResponse.redirect(url)
        }
    }

    // For authenticated users, check onboarding status for internal dashboard access
    if (user && isDashboardPage) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()

        // If no profile or onboarding not completed, redirect to onboarding
        if (!profile || !profile.onboarding_completed) {
            const url = request.nextUrl.clone()
            url.pathname = '/onboarding'
            return NextResponse.redirect(url)
        }
    }

    // If user has completed onboarding and tries to access onboarding page, redirect to dashboard
    if (user && isOnboardingPage) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()

        if (profile?.onboarding_completed) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    // Redirect authenticated users away from internal login page
    if (user && isAuthPage) {
        // Check if they need onboarding first
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()

        const url = request.nextUrl.clone()
        url.pathname = (!profile || !profile.onboarding_completed) ? '/onboarding' : '/dashboard'
        return NextResponse.redirect(url)
    }

    // Redirect authenticated client users away from client-login page
    if (user && isClientLoginPage) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_types')
            .eq('id', user.id)
            .single()

        const userTypes = profile?.user_types || []
        if (userTypes.includes('client')) {
            const url = request.nextUrl.clone()
            url.pathname = '/client-dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}

