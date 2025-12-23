import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Server Component context - handled by middleware
                        }
                    },
                },
            }
        )

        // Admin client to bypass RLS for profile operations
        const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const userEmail = user.email?.toLowerCase()

                // Check if user already has a profile (returning user)
                const { data: existingProfile } = await adminClient
                    .from('user_profiles')
                    .select('id, onboarding_completed')
                    .eq('id', user.id)
                    .maybeSingle()

                if (existingProfile) {
                    // User already has profile - redirect based on onboarding
                    const redirectPath = existingProfile.onboarding_completed ? next : '/onboarding'
                    return redirectTo(request, origin, redirectPath)
                }

                // Check for invitation by email
                const { data: invitation } = await adminClient
                    .from('invitations')
                    .select('*, role:roles(user_type)')
                    .ilike('email', userEmail || '')
                    .is('claimed_at', null)
                    .maybeSingle()

                if (!invitation) {
                    // No invitation = not authorized
                    console.log(`Unauthorized: ${userEmail} has no invitation`)
                    await supabase.auth.signOut()
                    return redirectTo(request, origin, `/unauthorized?email=${encodeURIComponent(userEmail || '')}`)
                }

                // Claim invitation: Create user profile
                console.log(`Claiming invitation for ${userEmail}`)

                // Determine user_type from the assigned role (default to 'internal' if no role)
                const userType = invitation.role?.user_type || 'internal'

                // Create user_profile
                const { error: profileError } = await adminClient
                    .from('user_profiles')
                    .insert({
                        id: user.id,
                        display_name: invitation.display_name,
                        nick_name: invitation.nick_name,
                        email: userEmail,
                        avatar_url: user.user_metadata?.avatar_url || null,
                        role_id: invitation.role_id,
                        user_type: userType,
                        title: invitation.job_title || null,
                        is_active: true,
                        onboarding_completed: false, // Will complete onboarding
                    })

                if (profileError) {
                    console.error('Error creating profile:', profileError)
                    return redirectTo(request, origin, `/login?error=Failed to create profile`)
                }

                // Create technician record if the role is 'technician'
                if (invitation.is_technician) {
                    await adminClient.from('technicians').insert({
                        name: invitation.display_name,
                        email: userEmail,
                        skills: invitation.skills || [],
                        user_profile_id: user.id,
                    })
                }

                // Mark invitation as claimed
                await adminClient
                    .from('invitations')
                    .update({
                        claimed_at: new Date().toISOString(),
                        claimed_by: user.id,
                    })
                    .eq('id', invitation.id)

                // New users go to onboarding
                return redirectTo(request, origin, '/onboarding')
            }
        }
    }

    return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}

function redirectTo(request: Request, origin: string, path: string): NextResponse {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${path}`)
    } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${path}`)
    } else {
        return NextResponse.redirect(`${origin}${path}`)
    }
}
