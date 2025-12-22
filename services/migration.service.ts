import { createClient } from '@/lib/supabase/client';

/**
 * Migration service for promoting legacy technicians/office_staff to unified user_profiles
 * This is a one-time utility to link existing records.
 */
export const migrationService = {
    /**
     * Migrate technicians and office_staff to user_profiles
     * - For each unique email, find or create a user_profile
     * - Update user_types array
     * - Set user_profile_id in source tables
     */
    async migrateToUnifiedProfiles(): Promise<{
        techniciansProcessed: number;
        officeStaffProcessed: number;
        profilesCreated: number;
        profilesLinked: number;
        errors: string[];
    }> {
        const supabase = createClient();
        const results = {
            techniciansProcessed: 0,
            officeStaffProcessed: 0,
            profilesCreated: 0,
            profilesLinked: 0,
            errors: [] as string[]
        };

        // =============================================
        // STEP 1: Fetch all technicians without a linked profile
        // =============================================
        const { data: technicians, error: techError } = await supabase
            .from('technicians')
            .select('id, name, email, phone')
            .is('user_profile_id', null);

        if (techError) {
            results.errors.push(`Failed to fetch technicians: ${techError.message}`);
            return results;
        }

        // =============================================
        // STEP 2: Fetch all office_staff without a linked profile
        // =============================================
        const { data: officeStaff, error: staffError } = await supabase
            .from('office_staff')
            .select('id, name, email, phone')
            .is('user_profile_id', null);

        if (staffError) {
            results.errors.push(`Failed to fetch office_staff: ${staffError.message}`);
            return results;
        }

        // =============================================
        // STEP 3: Process technicians
        // =============================================
        for (const tech of technicians || []) {
            try {
                const profileId = await this.findOrCreateProfile({
                    email: tech.email,
                    name: tech.name,
                    phone: tech.phone,
                    userType: 'technician'
                });

                if (profileId) {
                    // Update technician with user_profile_id
                    const { error: updateError } = await supabase
                        .from('technicians')
                        .update({ user_profile_id: profileId })
                        .eq('id', tech.id);

                    if (updateError) {
                        results.errors.push(`Failed to link technician ${tech.name}: ${updateError.message}`);
                    } else {
                        results.profilesLinked++;
                    }
                }
                results.techniciansProcessed++;
            } catch (err) {
                results.errors.push(`Error processing technician ${tech.name}: ${err}`);
            }
        }

        // =============================================
        // STEP 4: Process office_staff
        // =============================================
        for (const staff of officeStaff || []) {
            try {
                const profileId = await this.findOrCreateProfile({
                    email: staff.email,
                    name: staff.name,
                    phone: staff.phone,
                    userType: 'office_staff'
                });

                if (profileId) {
                    // Update office_staff with user_profile_id
                    const { error: updateError } = await supabase
                        .from('office_staff')
                        .update({ user_profile_id: profileId })
                        .eq('id', staff.id);

                    if (updateError) {
                        results.errors.push(`Failed to link office_staff ${staff.name}: ${updateError.message}`);
                    } else {
                        results.profilesLinked++;
                    }
                }
                results.officeStaffProcessed++;
            } catch (err) {
                results.errors.push(`Error processing office_staff ${staff.name}: ${err}`);
            }
        }

        return results;
    },

    /**
     * Find existing profile by email or create a new one
     * Also updates user_types array if profile exists
     */
    async findOrCreateProfile(params: {
        email: string | null;
        name: string;
        phone: string | null;
        userType: 'technician' | 'office_staff';
    }): Promise<string | null> {
        const supabase = createClient();

        // Skip if no email - can't create a proper profile without email
        if (!params.email) {
            console.log(`Skipping ${params.name}: no email provided`);
            return null;
        }

        // Try to find existing profile by email
        const { data: existingProfile, error: findError } = await supabase
            .from('user_profiles')
            .select('id, user_types')
            .eq('email', params.email)
            .maybeSingle();

        if (findError && findError.code !== 'PGRST116') {
            throw new Error(`Failed to find profile: ${findError.message}`);
        }

        if (existingProfile) {
            // Profile exists - add user type if not already present
            const currentTypes = existingProfile.user_types || [];
            if (!currentTypes.includes(params.userType)) {
                const { error: updateError } = await supabase
                    .from('user_profiles')
                    .update({
                        user_types: [...currentTypes, params.userType],
                        is_active: true
                    })
                    .eq('id', existingProfile.id);

                if (updateError) {
                    throw new Error(`Failed to update user_types: ${updateError.message}`);
                }
            }
            return existingProfile.id;
        }

        // Profile doesn't exist - we can't create one because user_profiles.id
        // must reference auth.users. Just log and return null.
        console.log(`No user_profile found for email ${params.email}. User must sign in first.`);
        return null;
    },

    /**
     * Get migration status - how many records are linked vs unlinked
     */
    async getMigrationStatus(): Promise<{
        technicians: { total: number; linked: number; unlinked: number };
        officeStaff: { total: number; linked: number; unlinked: number };
    }> {
        const supabase = createClient();

        // Technicians
        const { count: techTotal } = await supabase
            .from('technicians')
            .select('*', { count: 'exact', head: true });

        const { count: techLinked } = await supabase
            .from('technicians')
            .select('*', { count: 'exact', head: true })
            .not('user_profile_id', 'is', null);

        // Office staff
        const { count: staffTotal } = await supabase
            .from('office_staff')
            .select('*', { count: 'exact', head: true });

        const { count: staffLinked } = await supabase
            .from('office_staff')
            .select('*', { count: 'exact', head: true })
            .not('user_profile_id', 'is', null);

        return {
            technicians: {
                total: techTotal || 0,
                linked: techLinked || 0,
                unlinked: (techTotal || 0) - (techLinked || 0)
            },
            officeStaff: {
                total: staffTotal || 0,
                linked: staffLinked || 0,
                unlinked: (staffTotal || 0) - (staffLinked || 0)
            }
        };
    }
};
