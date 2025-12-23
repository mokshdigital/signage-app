import { createClient } from '@/lib/supabase/client';
import type {
    Role,
    Permission,
    RoleWithPermissions,
    RoleInput,
    PermissionGroup,
    UserWithRole
} from '@/types/rbac';

// ============================================
// ROLES SERVICE
// ============================================

/**
 * Fetch all roles
 */
export async function getRoles(): Promise<Role[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching roles:', error);
        throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    return data || [];
}

/**
 * Fetch a single role with its permissions
 */
export async function getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions | null> {
    const supabase = createClient();

    // Fetch role
    const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', roleId)
        .single();

    if (roleError) {
        if (roleError.code === 'PGRST116') return null;
        throw new Error(`Failed to fetch role: ${roleError.message}`);
    }

    // Fetch permissions for this role
    const { data: rolePermissions, error: rpError } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);

    if (rpError) {
        throw new Error(`Failed to fetch role permissions: ${rpError.message}`);
    }

    const permissionIds = rolePermissions.map(rp => rp.permission_id);

    // Fetch full permission details
    let permissions: Permission[] = [];
    if (permissionIds.length > 0) {
        const { data: perms, error: permsError } = await supabase
            .from('permissions')
            .select('*')
            .in('id', permissionIds);

        if (permsError) {
            throw new Error(`Failed to fetch permissions: ${permsError.message}`);
        }
        permissions = perms || [];
    }

    return {
        ...role,
        permissions,
    };
}

/**
 * Create a new role
 */
export async function createRole(input: RoleInput): Promise<Role> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('roles')
        .insert([{
            name: input.name,
            display_name: input.display_name,
            description: input.description || null,
            user_type: input.user_type || 'internal', // Default to internal
            is_system: false, // User-created roles are never system roles
        }])
        .select()
        .single();

    if (error) {
        // Log full error details
        console.error('Error creating role:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
        });

        // Provide helpful error messages based on error code
        if (error.code === '42P01') {
            throw new Error('Database table "roles" does not exist. Please run the migration first.');
        }
        if (error.code === '42501') {
            throw new Error('Permission denied. Please check RLS policies or run migration.');
        }
        if (error.code === '23505') {
            throw new Error('A role with this name already exists.');
        }
        throw new Error(`Failed to create role: ${error.message || error.code || 'Unknown error'}`);
    }

    return data;
}

/**
 * Update a role
 */
export async function updateRole(roleId: string, input: Partial<RoleInput>): Promise<Role> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('roles')
        .update(input)
        .eq('id', roleId)
        .select()
        .single();

    if (error) {
        console.error('Error updating role:', error);
        throw new Error(`Failed to update role: ${error.message}`);
    }

    return data;
}

/**
 * Delete a role (only non-system roles)
 */
export async function deleteRole(roleId: string): Promise<void> {
    const supabase = createClient();

    // First check if it's a system role
    const { data: role, error: fetchError } = await supabase
        .from('roles')
        .select('is_system')
        .eq('id', roleId)
        .single();

    if (fetchError) {
        throw new Error(`Failed to fetch role: ${fetchError.message}`);
    }

    if (role.is_system) {
        throw new Error('Cannot delete system roles');
    }

    const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

    if (error) {
        console.error('Error deleting role:', error);
        throw new Error(`Failed to delete role: ${error.message}`);
    }
}

// ============================================
// PERMISSIONS SERVICE
// ============================================

/**
 * Fetch all permissions
 */
export async function getPermissions(): Promise<Permission[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true })
        .order('action', { ascending: true });

    if (error) {
        console.error('Error fetching permissions:', error);
        throw new Error(`Failed to fetch permissions: ${error.message}`);
    }

    return data || [];
}

/**
 * Get permissions grouped by resource for UI display
 */
export async function getPermissionsGrouped(): Promise<PermissionGroup[]> {
    const permissions = await getPermissions();

    const resourceDisplayNames: Record<string, string> = {
        users: 'User Management',
        roles: 'Role Management',
        permissions: 'Permissions',
        work_orders: 'Work Orders',
        technicians: 'Technicians',
        equipment: 'Equipment',
        vehicles: 'Vehicles',
        reports: 'Reports & Analytics',
        settings: 'System Settings',
        dashboard: 'Dashboard',
    };

    const grouped = permissions.reduce((acc, perm) => {
        const existing = acc.find(g => g.resource === perm.resource);
        if (existing) {
            existing.permissions.push(perm);
        } else {
            acc.push({
                resource: perm.resource,
                displayName: resourceDisplayNames[perm.resource] || perm.resource,
                permissions: [perm],
            });
        }
        return acc;
    }, [] as PermissionGroup[]);

    return grouped;
}

// ============================================
// ROLE PERMISSIONS SERVICE
// ============================================

/**
 * Assign a permission to a role
 */
export async function assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
        .from('role_permissions')
        .insert([{ role_id: roleId, permission_id: permissionId }]);

    if (error) {
        // Ignore duplicate key errors
        if (error.code !== '23505') {
            console.error('Error assigning permission:', error);
            throw new Error(`Failed to assign permission: ${error.message}`);
        }
    }
}

/**
 * Remove a permission from a role
 */
export async function removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId);

    if (error) {
        console.error('Error removing permission:', error);
        throw new Error(`Failed to remove permission: ${error.message}`);
    }
}

/**
 * Update all permissions for a role (replace)
 */
export async function updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    const supabase = createClient();

    // Delete all existing permissions
    const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

    if (deleteError) {
        throw new Error(`Failed to clear role permissions: ${deleteError.message}`);
    }

    // Insert new permissions
    if (permissionIds.length > 0) {
        const inserts = permissionIds.map(pid => ({
            role_id: roleId,
            permission_id: pid,
        }));

        const { error: insertError } = await supabase
            .from('role_permissions')
            .insert(inserts);

        if (insertError) {
            throw new Error(`Failed to set role permissions: ${insertError.message}`);
        }
    }
}

// ============================================
// USER PERMISSIONS SERVICE
// ============================================

/**
 * Get current user's permissions
 */
export async function getCurrentUserPermissions(): Promise<string[]> {
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return [];
    }

    // Get user's profile with role
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', user.id)
        .single();

    if (profileError || !profile?.role_id) {
        return [];
    }

    // Get role's permissions
    const { data: rolePermissions, error: rpError } = await supabase
        .from('role_permissions')
        .select('permissions:permission_id(name)')
        .eq('role_id', profile.role_id);

    if (rpError) {
        console.error('Error fetching user permissions:', rpError);
        return [];
    }

    // Extract permission names - handle the joined data structure
    const permissions = rolePermissions
        .map(rp => {
            const perm = rp.permissions as unknown as { name: string } | null;
            return perm?.name;
        })
        .filter((name): name is string => !!name);

    return permissions;
}

/**
 * Get user with their role information
 */
export async function getUserWithRole(userId: string): Promise<UserWithRole | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('user_profiles')
        .select(`
            *,
            role:roles(*)
        `)
        .eq('id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data as unknown as UserWithRole;
}

/**
 * Get all users with their roles
 */
export async function getAllUsersWithRoles(): Promise<UserWithRole[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('user_profiles')
        .select(`
            *,
            role:roles(*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return (data || []) as unknown as UserWithRole[];
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(userId: string, roleId: string | null): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from('user_profiles')
        .update({ role_id: roleId })
        .eq('id', userId);

    if (error) {
        throw new Error(`Failed to assign role: ${error.message}`);
    }
}
