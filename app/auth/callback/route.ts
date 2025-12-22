import { createServerClient } from '@supabase/ssr'
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

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const userEmail = user.email?.toLowerCase()

                // ==============================================
                // GUEST LIST CHECK: Only pre-registered emails allowed
                // ==============================================

                // First, try to find profile by auth user ID (already claimed)
                const { data: existingProfile } = await supabase
                    .from('user_profiles')
                    .select('id, email, onboarding_completed')
                    .eq('id', user.id)
                    .maybeSingle();

                // If user already has a profile by ID, they're good
                if (existingProfile) {
                    console.log(`User ${userEmail} already has profile, proceeding...`);

                    // Determine redirect path
                    let redirectPath = next;
                    if (!existingProfile.onboarding_completed) {
                        redirectPath = '/onboarding';
                    }

                    const forwardedHost = request.headers.get('x-forwarded-host');
                    const isLocalEnv = process.env.NODE_ENV === 'development';

                    if (isLocalEnv) {
                        return NextResponse.redirect(`${origin}${redirectPath}`);
                    } else if (forwardedHost) {
                        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`);
                    } else {
                        return NextResponse.redirect(`${origin}${redirectPath}`);
                    }
                }

                // Look for a pre-created profile with this email (case-insensitive)
                const { data: invitedProfile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('id, email, onboarding_completed')
                    .ilike('email', userEmail || '')
                    .maybeSingle();

                if (profileError) {
                    console.error('Error checking invited profile:', profileError);
                }

                // If NO pre-created profile exists, user wasn't invited
                if (!invitedProfile) {
                    console.log(`Unauthorized access attempt: ${userEmail} not in guest list`);

                    // Sign them out immediately
                    await supabase.auth.signOut()

                    // Redirect to unauthorized page
                    const forwardedHost = request.headers.get('x-forwarded-host')
                    const isLocalEnv = process.env.NODE_ENV === 'development'
                    const baseUrl = isLocalEnv ? origin : (forwardedHost ? `https://${forwardedHost}` : origin)

                    return NextResponse.redirect(`${baseUrl}/unauthorized?email=${encodeURIComponent(userEmail || '')}`)
                }

                // ==============================================
                // PROFILE CLAIMING: Link pre-created profile to auth user
                // ==============================================

                // The pre-created profile exists but has a different ID (or no auth link)
                // We need to update it to use this Google user's auth.uid
                if (invitedProfile.id !== user.id) {
                    console.log(`Claiming profile for ${userEmail}: updating ID from ${invitedProfile.id} to ${user.id}`)

                    // Create a new profile with the auth user's ID, copying data from invited profile
                    // Note: We can't just update the ID due to FK constraints, so we need to handle this carefully
                    // For now, let's update the profile to link to this user

                    // Since user_profiles.id must match auth.users.id (FK constraint),
                    // we need a different approach: create a new profile for this user
                    const { error: createError } = await supabase
                        .from('user_profiles')
                        .upsert({
                            id: user.id,
                            display_name: user.user_metadata?.full_name || user.user_metadata?.name || userEmail?.split('@')[0] || 'User',
                            email: userEmail,
                            avatar_url: user.user_metadata?.avatar_url || null,
                            onboarding_completed: invitedProfile.onboarding_completed || false,
                            is_active: true,
                            user_types: ['invited'], // Mark as invited user
                        }, { onConflict: 'id' })

                    if (createError) {
                        console.error('Error creating/updating profile:', createError)
                    } else {
                        // Optionally: Copy over any roles or other data from the invited profile
                        // Delete the old invited profile (no longer needed)
                        await supabase
                            .from('user_profiles')
                            .delete()
                            .eq('id', invitedProfile.id)
                            .neq('id', user.id) // Safety: don't delete the one we just created
                    }
                }

                // Determine redirect path based on onboarding status
                let redirectPath = next

                // Re-fetch the profile (might have been just created)
                const { data: currentProfile } = await supabase
                    .from('user_profiles')
                    .select('onboarding_completed')
                    .eq('id', user.id)
                    .single()

                if (!currentProfile || !currentProfile.onboarding_completed) {
                    redirectPath = '/onboarding'
                }

                const forwardedHost = request.headers.get('x-forwarded-host')
                const isLocalEnv = process.env.NODE_ENV === 'development'

                if (isLocalEnv) {
                    return NextResponse.redirect(`${origin}${redirectPath}`)
                } else if (forwardedHost) {
                    return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
                } else {
                    return NextResponse.redirect(`${origin}${redirectPath}`)
                }
            }
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
