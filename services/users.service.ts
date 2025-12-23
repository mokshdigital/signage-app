import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/types/user-profile';

export interface UnifiedUser extends UserProfile {
    technician?: {
        id: string;
        skills: string[] | null;
    } | null;
    role?: {
        id: string;
        name: string;
        display_name: string;
    } | null;
}

export interface Invitation {
    id: string;
    email: string;
    display_name: string;
    nick_name: string | null;
    role_id: string | null;
    is_technician: boolean;
    is_office_staff: boolean;
    skills: string[] | null;
    job_title: string | null;
    invited_by: string | null;
    created_at: string;
    claimed_at: string | null;
    claimed_by: string | null;
    // Joined data
    role?: { id: string; name: string; display_name: string } | null;
}

export interface CreateInvitationData {
    email: string;
    display_name: string;
    nick_name?: string;
    role_id?: string | null;
    is_technician: boolean;
    skills?: string[];
    job_title?: string;
}

export interface UpdateUserData {
    display_name?: string;
    nick_name?: string;
    phone?: string;
    role_id?: string | null;
    is_technician?: boolean;
    skills?: string[];
    job_title?: string;
    is_active?: boolean;
}

/**
 * Unified User Management Service
 * Handles invitations and user profile management
 */
export const usersService = {
    /**
     * Get all active users (claimed invitations)
     */
    async getAll(): Promise<UnifiedUser[]> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
                *,
                role:roles(id, name, display_name)
            `)
            .order('display_name', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch users: ${error.message}`);
        }

        const users = data || [];
        const userIds = users.map(u => u.id);

        // Get technician links
        const { data: techLinks } = await supabase
            .from('technicians')
            .select('id, skills, user_profile_id')
            .in('user_profile_id', userIds);

        const techMap = new Map(techLinks?.map(t => [t.user_profile_id, t]) || []);

        return users.map(user => ({
            ...user,
            technician: techMap.get(user.id) || null,
        })) as UnifiedUser[];
    },

    /**
     * Get pending invitations (not yet claimed)
     */
    async getInvitations(): Promise<Invitation[]> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('invitations')
            .select(`
                *,
                role:roles(id, name, display_name)
            `)
            .is('claimed_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch invitations: ${error.message}`);
        }

        return data || [];
    },

    /**
     * Create a new invitation (pre-register a user)
     */
    async createInvitation(data: CreateInvitationData): Promise<Invitation> {
        const supabase = createClient();

        // Get current user for invited_by
        const { data: { user } } = await supabase.auth.getUser();

        const { data: invitation, error } = await supabase
            .from('invitations')
            .insert({
                email: data.email.toLowerCase(),
                display_name: data.display_name,
                nick_name: data.nick_name || null,
                role_id: data.role_id || null,
                is_technician: data.is_technician,
                skills: data.skills || null,
                job_title: data.job_title || null,
                invited_by: user?.id || null,
            })
            .select(`*, role:roles(id, name, display_name)`)
            .single();

        if (error) {
            throw new Error(`Failed to create invitation: ${error.message}`);
        }

        return invitation;
    },

    /**
     * Update an existing invitation
     */
    async updateInvitation(id: string, data: Partial<CreateInvitationData>): Promise<Invitation> {
        const supabase = createClient();

        const updateData: any = {};
        if (data.email !== undefined) updateData.email = data.email.toLowerCase();
        if (data.display_name !== undefined) updateData.display_name = data.display_name;
        if (data.nick_name !== undefined) updateData.nick_name = data.nick_name;
        if (data.role_id !== undefined) updateData.role_id = data.role_id;
        if (data.is_technician !== undefined) updateData.is_technician = data.is_technician;
        if (data.skills !== undefined) updateData.skills = data.skills;
        if (data.job_title !== undefined) updateData.job_title = data.job_title;

        const { data: invitation, error } = await supabase
            .from('invitations')
            .update(updateData)
            .eq('id', id)
            .select(`*, role:roles(id, name, display_name)`)
            .single();

        if (error) {
            throw new Error(`Failed to update invitation: ${error.message}`);
        }

        return invitation;
    },

    /**
     * Delete an invitation
     */
    async deleteInvitation(id: string): Promise<void> {
        const supabase = createClient();

        const { error } = await supabase
            .from('invitations')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete invitation: ${error.message}`);
        }
    },

    /**
     * Update an existing user profile
     */
    async updateUser(id: string, data: UpdateUserData): Promise<UnifiedUser> {
        const supabase = createClient();

        // Update user_profile
        const updateData: any = {};
        if (data.display_name !== undefined) updateData.display_name = data.display_name;
        if (data.nick_name !== undefined) updateData.nick_name = data.nick_name;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.job_title !== undefined) updateData.title = data.job_title;
        if (data.role_id !== undefined) updateData.role_id = data.role_id;

        // Note: is_technician only affects the technicians table,
        // not user_profiles (since we now use role-based user_type)

        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (profileError) {
            throw new Error(`Failed to update user: ${profileError.message}`);
        }

        // Handle technician record
        if (data.is_technician !== undefined) {
            const { data: existingTech } = await supabase
                .from('technicians')
                .select('id')
                .eq('user_profile_id', id)
                .maybeSingle();

            if (data.is_technician && !existingTech) {
                await supabase.from('technicians').insert({
                    name: profile.display_name,
                    email: profile.email,
                    skills: data.skills || [],
                    user_profile_id: id,
                });
            } else if (!data.is_technician && existingTech) {
                await supabase.from('technicians').delete().eq('id', existingTech.id);
            } else if (data.is_technician && existingTech && data.skills !== undefined) {
                await supabase.from('technicians').update({ skills: data.skills }).eq('id', existingTech.id);
            }
        }

        // Removed office_staff logic as the table is deprecated

        return this.getUserById(id);
    },

    /**
     * Get a single user by ID
     */
    async getUserById(id: string): Promise<UnifiedUser> {
        const supabase = createClient();

        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select(`*, role:roles(id, name, display_name)`)
            .eq('id', id)
            .single();

        if (error) {
            throw new Error(`User not found: ${error.message}`);
        }

        const { data: tech } = await supabase
            .from('technicians')
            .select('id, skills')
            .eq('user_profile_id', id)
            .maybeSingle();

        return {
            ...profile,
            technician: tech || null,
        } as UnifiedUser;
    },

    /**
     * Archive a user (soft delete)
     */
    async archiveUser(id: string): Promise<void> {
        const supabase = createClient();

        const { error } = await supabase
            .from('user_profiles')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to archive user: ${error.message}`);
        }
    },

    /**
     * Restore an archived user
     */
    async restoreUser(id: string): Promise<void> {
        const supabase = createClient();

        const { error } = await supabase
            .from('user_profiles')
            .update({ is_active: true })
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to restore user: ${error.message}`);
        }
    },

    /**
     * Check if email is already invited or registered
     */
    async isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
        const supabase = createClient();
        const normalizedEmail = email.toLowerCase();

        // Check invitations
        let invQuery = supabase
            .from('invitations')
            .select('id')
            .ilike('email', normalizedEmail);
        if (excludeId) invQuery = invQuery.neq('id', excludeId);
        const { data: invData } = await invQuery.maybeSingle();

        if (invData) return true;

        // Check user_profiles
        const { data: profileData } = await supabase
            .from('user_profiles')
            .select('id')
            .ilike('email', normalizedEmail)
            .maybeSingle();

        return !!profileData;
    },

    /**
     * Get technicians (for directory)
     */
    async getTechnicians(): Promise<UnifiedUser[]> {
        const supabase = createClient();

        const { data: techLinks, error } = await supabase
            .from('technicians')
            .select(`
                id,
                skills,
                user_profile_id,
                user_profile:user_profiles(*, role:roles(id, name, display_name))
            `)
            .not('user_profile_id', 'is', null);

        if (error) {
            throw new Error(`Failed to fetch technicians: ${error.message}`);
        }

        return (techLinks || [])
            .filter((t: any) => t.user_profile?.is_active !== false)
            .map((t: any) => ({
                ...t.user_profile,
                technician: { id: t.id, skills: t.skills },
            })) as UnifiedUser[];
    },

    /**
     * Get office staff (for directory)
     */
    async getOfficeStaff(): Promise<UnifiedUser[]> {
        const supabase = createClient();

        const { data: users, error } = await supabase
            .from('user_profiles')
            .select(`
                *,
                role:roles(id, name, display_name)
            `)
            .eq('user_type', 'internal')
            .eq('is_active', true)
            .order('display_name', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch office staff: ${error.message}`);
        }

        // Filter out those who are technicians
        const userIds = (users || []).map((u: any) => u.id);
        const { data: techLinks } = await supabase
            .from('technicians')
            .select('user_profile_id')
            .in('user_profile_id', userIds);

        const techUserIds = new Set(techLinks?.map((t: any) => t.user_profile_id) || []);

        return (users || [])
            .filter((u: any) => !techUserIds.has(u.id))
            .map((u: any) => ({
                ...u,
                technician: null,
            })) as UnifiedUser[];
    },
};
