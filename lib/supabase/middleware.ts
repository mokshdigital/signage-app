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

    const isAuthPage = request.nextUrl.pathname === '/login'
    const isOnboardingPage = request.nextUrl.pathname === '/onboarding'
    const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')

    // Protect dashboard and onboarding routes - redirect to login if not authenticated
    if (!user && (isDashboardPage || isOnboardingPage)) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // For authenticated users, check onboarding status for dashboard access
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

    // Redirect authenticated users away from login page
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

    // IMPORTANT: You *must* return the supabaseResponse object as is.
    // If you're creating a new response object, make sure to:
    // 1. Pass the request in it, like NextResponse.next({ request })
    // 2. Copy over the cookies, like supabaseResponse.cookies.getAll().forEach(...)
    // 3. Change the myNewResponse object to fit your needs, but avoid changing cookies
    // 4. Finally: return myNewResponse

    return supabaseResponse
}

