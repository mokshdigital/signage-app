'use server'

import { createClient } from '@supabase/supabase-js'

interface CreateClientResult {
    success: boolean
    error?: string
    credentials?: {
        email: string
        password: string
        userId: string
    }
}

interface CreateClientInput {
    displayName: string
    nickName?: string
    email: string
    password: string
    projectManagerId?: string  // Optional: link to existing PM record
}

/**
 * Server Action: Create a client portal account using admin privileges
 * This bypasses public signup restrictions by using the service role key
 */
export async function createClientAccount(input: CreateClientInput): Promise<CreateClientResult> {
    // Validate environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        return {
            success: false,
            error: 'Server configuration error. Please contact administrator.',
        }
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })

    try {
        // Validate input
        if (!input.email || !input.displayName || !input.password) {
            return { success: false, error: 'Missing required fields' }
        }

        if (input.password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' }
        }

        const normalizedEmail = input.email.toLowerCase().trim()

        // Check if email already exists in user_profiles
        const { data: existingProfile } = await adminClient
            .from('user_profiles')
            .select('id')
            .ilike('email', normalizedEmail)
            .maybeSingle()

        if (existingProfile) {
            return { success: false, error: 'An account with this email already exists' }
        }

        // Create auth user with admin API
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: normalizedEmail,
            password: input.password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                display_name: input.displayName,
            },
        })

        if (authError || !authData.user) {
            console.error('Auth creation error:', authError)
            return {
                success: false,
                error: authError?.message || 'Failed to create authentication account',
            }
        }

        const userId = authData.user.id

        // Create user_profile with 'external' type and client role
        // First get the client role ID
        const { data: clientRole } = await adminClient
            .from('roles')
            .select('id')
            .eq('name', 'client')
            .single()

        const { error: profileError } = await adminClient
            .from('user_profiles')
            .insert({
                id: userId,
                display_name: input.displayName,
                nick_name: input.nickName || null,
                email: normalizedEmail,
                user_type: 'external',
                role_id: clientRole?.id || null,
                is_active: true,
                onboarding_completed: true, // Clients skip onboarding
            })

        if (profileError) {
            console.error('Profile creation error:', profileError)
            // Try to clean up the auth user
            await adminClient.auth.admin.deleteUser(userId)
            return {
                success: false,
                error: 'Failed to create user profile. Please try again.',
            }
        }

        // If a project manager ID was provided, link the PM to this user profile
        if (input.projectManagerId) {
            const { error: pmLinkError } = await adminClient
                .from('project_managers')
                .update({ user_profile_id: userId })
                .eq('id', input.projectManagerId)

            if (pmLinkError) {
                console.error('PM link error:', pmLinkError)
                // Non-fatal: the account is created, just not linked
            }
        }

        return {
            success: true,
            credentials: {
                email: normalizedEmail,
                password: input.password,
                userId,
            },
        }
    } catch (error) {
        console.error('Unexpected error creating client:', error)
        return {
            success: false,
            error: 'An unexpected error occurred. Please try again.',
        }
    }
}

/**
 * Generate a random secure password
 */
export async function generateSecurePassword(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    const specialChars = '!@#$%&*'
    let password = ''

    // 8 alphanumeric characters
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Add 2 special characters
    for (let i = 0; i < 2; i++) {
        password += specialChars.charAt(Math.floor(Math.random() * specialChars.length))
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
}

