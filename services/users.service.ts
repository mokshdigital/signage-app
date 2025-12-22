import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/types/user-profile';

export interface UnifiedUser extends UserProfile {
    // Extension data
    technician?: {
        id: string;
        skills: string[] | null;
    } | null;
    office_staff?: {
        id: string;
        title: string | null;
    } | null;
    role?: {
        id: string;
        name: string;
        display_name: string;
    } | null;
}

export interface CreateUserData {
    email: string;
    display_name: string;
    nick_name?: string;
    role_id?: string | null;
    is_technician: boolean;
    is_office_staff: boolean;
    // Conditional fields
    skills?: string[];
    job_title?: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {
    is_active?: boolean;
}

/**
 * Unified User Management Service
 * Handles CRUD operations across user_profiles, technicians, and office_staff tables
 */
export const usersService = {
    /**
     * Get all users with their extension data
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

        // Fetch technician and office_staff links for each profile
        const users = data || [];
        const userIds = users.map(u => u.id);

        // Get technician links
        const { data: techLinks } = await supabase
            .from('technicians')
            .select('id, skills, user_profile_id')
            .in('user_profile_id', userIds);

        // Get office_staff links  
        const { data: staffLinks } = await supabase
            .from('office_staff')
            .select('id, title, user_profile_id')
            .in('user_profile_id', userIds);

        // Map extension data to users
        const techMap = new Map(techLinks?.map(t => [t.user_profile_id, t]) || []);
        const staffMap = new Map(staffLinks?.map(s => [s.user_profile_id, s]) || []);

        return users.map(user => ({
            ...user,
            technician: techMap.get(user.id) || null,
            office_staff: staffMap.get(user.id) || null,
        })) as UnifiedUser[];
    },

    /**
     * Get active users only (for directories)
     */
    async getActive(): Promise<UnifiedUser[]> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
                *,
                role:roles(id, name, display_name)
            `)
            .eq('is_active', true)
            .order('display_name', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch active users: ${error.message}`);
        }

        const users = data || [];
        const userIds = users.map(u => u.id);

        const { data: techLinks } = await supabase
            .from('technicians')
            .select('id, skills, user_profile_id')
            .in('user_profile_id', userIds);

        const { data: staffLinks } = await supabase
            .from('office_staff')
            .select('id, title, user_profile_id')
            .in('user_profile_id', userIds);

        const techMap = new Map(techLinks?.map(t => [t.user_profile_id, t]) || []);
        const staffMap = new Map(staffLinks?.map(s => [s.user_profile_id, s]) || []);

        return users.map(user => ({
            ...user,
            technician: techMap.get(user.id) || null,
            office_staff: staffMap.get(user.id) || null,
        })) as UnifiedUser[];
    },

    /**
     * Get technicians (users with technician link)
     */
    async getTechnicians(): Promise<UnifiedUser[]> {
        const supabase = createClient();

        // Get technician records with linked profiles
        const { data: techLinks, error: techError } = await supabase
            .from('technicians')
            .select(`
                id,
                skills,
                user_profile_id,
                user_profile:user_profiles(*)
            `)
            .not('user_profile_id', 'is', null);

        if (techError) {
            throw new Error(`Failed to fetch technicians: ${techError.message}`);
        }

        // Also get unlinked technicians (legacy)
        const { data: unlinkedTechs } = await supabase
            .from('technicians')
            .select('*')
            .is('user_profile_id', null);

        // Combine linked and unlinked
        const linked = (techLinks || []).map((t: any) => ({
            ...t.user_profile,
            technician: { id: t.id, skills: t.skills },
            office_staff: null,
        }));

        const unlinked = (unlinkedTechs || []).map(t => ({
            id: t.id,
            display_name: t.name,
            nick_name: null,
            email: t.email,
            phone: t.phone,
            is_active: true,
            user_types: ['technician'],
            onboarding_completed: false,
            created_at: t.created_at,
            updated_at: t.created_at,
            avatar_url: null,
            alternate_email: null,
            title: null,
            role: null,
            technician: { id: t.id, skills: t.skills },
            office_staff: null,
        }));

        return [...linked, ...unlinked] as UnifiedUser[];
    },

    /**
     * Get office staff (users with office_staff link)
     */
    async getOfficeStaff(): Promise<UnifiedUser[]> {
        const supabase = createClient();

        const { data: staffLinks, error: staffError } = await supabase
            .from('office_staff')
            .select(`
                id,
                title,
                user_profile_id,
                user_profile:user_profiles(*)
            `)
            .not('user_profile_id', 'is', null);

        if (staffError) {
            throw new Error(`Failed to fetch office staff: ${staffError.message}`);
        }

        const { data: unlinkedStaff } = await supabase
            .from('office_staff')
            .select('*')
            .is('user_profile_id', null);

        const linked = (staffLinks || []).map((s: any) => ({
            ...s.user_profile,
            technician: null,
            office_staff: { id: s.id, title: s.title },
        }));

        const unlinked = (unlinkedStaff || []).map(s => ({
            id: s.id,
            display_name: s.name,
            nick_name: null,
            email: s.email,
            phone: s.phone,
            is_active: true,
            user_types: ['office_staff'],
            onboarding_completed: false,
            created_at: s.created_at,
            updated_at: s.created_at,
            avatar_url: null,
            alternate_email: null,
            title: s.title,
            role: null,
            technician: null,
            office_staff: { id: s.id, title: s.title },
        }));

        return [...linked, ...unlinked] as UnifiedUser[];
    },

    /**
     * Create a new user (pre-registration / invitation)
     * This creates a user_profile entry that will be claimed on first sign-in
     */
    async create(data: CreateUserData): Promise<UnifiedUser> {
        const supabase = createClient();

        // Generate a temporary UUID for the profile
        // This will be replaced when the user signs in
        const tempId = crypto.randomUUID();

        // Build user_types array
        const userTypes: string[] = [];
        if (data.is_technician) userTypes.push('technician');
        if (data.is_office_staff) userTypes.push('office_staff');

        // 1. Create user_profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                id: tempId,
                email: data.email.toLowerCase(),
                display_name: data.display_name,
                nick_name: data.nick_name || null,
                role_id: data.role_id || null,
                user_types: userTypes,
                is_active: true,
                onboarding_completed: true, // Admin-created users skip onboarding
            })
            .select()
            .single();

        if (profileError) {
            throw new Error(`Failed to create user profile: ${profileError.message}`);
        }

        let techRecord = null;
        let staffRecord = null;

        // 2. Create technician record if needed
        if (data.is_technician) {
            const { data: tech, error: techError } = await supabase
                .from('technicians')
                .insert({
                    name: data.display_name,
                    email: data.email.toLowerCase(),
                    skills: data.skills || [],
                    user_profile_id: profile.id,
                })
                .select()
                .single();

            if (techError) {
                console.error('Error creating technician record:', techError);
            } else {
                techRecord = tech;
            }
        }

        // 3. Create office_staff record if needed
        if (data.is_office_staff) {
            const { data: staff, error: staffError } = await supabase
                .from('office_staff')
                .insert({
                    name: data.display_name,
                    email: data.email.toLowerCase(),
                    title: data.job_title || null,
                    user_profile_id: profile.id,
                })
                .select()
                .single();

            if (staffError) {
                console.error('Error creating office_staff record:', staffError);
            } else {
                staffRecord = staff;
            }
        }

        return {
            ...profile,
            technician: techRecord ? { id: techRecord.id, skills: techRecord.skills } : null,
            office_staff: staffRecord ? { id: staffRecord.id, title: staffRecord.title } : null,
            role: null,
        } as UnifiedUser;
    },

    /**
     * Update an existing user
     */
    async update(id: string, data: UpdateUserData): Promise<UnifiedUser> {
        const supabase = createClient();

        // Build user_types array
        const userTypes: string[] = [];
        if (data.is_technician) userTypes.push('technician');
        if (data.is_office_staff) userTypes.push('office_staff');

        // 1. Update user_profile
        const updateData: any = {};
        if (data.display_name !== undefined) updateData.display_name = data.display_name;
        if (data.nick_name !== undefined) updateData.nick_name = data.nick_name;
        if (data.email !== undefined) updateData.email = data.email.toLowerCase();
        if (data.role_id !== undefined) updateData.role_id = data.role_id;
        if (data.is_active !== undefined) updateData.is_active = data.is_active;
        if (data.is_technician !== undefined || data.is_office_staff !== undefined) {
            updateData.user_types = userTypes;
        }

        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (profileError) {
            throw new Error(`Failed to update user: ${profileError.message}`);
        }

        // 2. Handle technician record
        if (data.is_technician !== undefined) {
            const { data: existingTech } = await supabase
                .from('technicians')
                .select('id')
                .eq('user_profile_id', id)
                .maybeSingle();

            if (data.is_technician && !existingTech) {
                // Create technician record
                await supabase.from('technicians').insert({
                    name: profile.display_name,
                    email: profile.email,
                    skills: data.skills || [],
                    user_profile_id: id,
                });
            } else if (!data.is_technician && existingTech) {
                // Remove technician record
                await supabase.from('technicians').delete().eq('id', existingTech.id);
            } else if (data.is_technician && existingTech && data.skills !== undefined) {
                // Update skills
                await supabase.from('technicians').update({ skills: data.skills }).eq('id', existingTech.id);
            }
        }

        // 3. Handle office_staff record
        if (data.is_office_staff !== undefined) {
            const { data: existingStaff } = await supabase
                .from('office_staff')
                .select('id')
                .eq('user_profile_id', id)
                .maybeSingle();

            if (data.is_office_staff && !existingStaff) {
                // Create office_staff record
                await supabase.from('office_staff').insert({
                    name: profile.display_name,
                    email: profile.email,
                    title: data.job_title || null,
                    user_profile_id: id,
                });
            } else if (!data.is_office_staff && existingStaff) {
                // Remove office_staff record
                await supabase.from('office_staff').delete().eq('id', existingStaff.id);
            } else if (data.is_office_staff && existingStaff && data.job_title !== undefined) {
                // Update title
                await supabase.from('office_staff').update({ title: data.job_title }).eq('id', existingStaff.id);
            }
        }

        // Re-fetch full user data
        return this.getById(id);
    },

    /**
     * Get a single user by ID
     */
    async getById(id: string): Promise<UnifiedUser> {
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

        const { data: staff } = await supabase
            .from('office_staff')
            .select('id, title')
            .eq('user_profile_id', id)
            .maybeSingle();

        return {
            ...profile,
            technician: tech || null,
            office_staff: staff || null,
        } as UnifiedUser;
    },

    /**
     * Archive a user (soft delete)
     */
    async archive(id: string): Promise<void> {
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
    async restore(id: string): Promise<void> {
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
     * Check if email is already in use
     */
    async isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
        const supabase = createClient();

        let query = supabase
            .from('user_profiles')
            .select('id')
            .eq('email', email.toLowerCase());

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data } = await query.maybeSingle();
        return !!data;
    }
};
