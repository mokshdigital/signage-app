// RBAC (Role-Based Access Control) Type Definitions

export interface Role {
    id: string;
    name: string; // slug: 'super_admin', 'technician'
    display_name: string;
    description: string | null;
    is_system: boolean;
    user_type: 'internal' | 'external'; // Which user type can have this role
    created_at: string;
    updated_at: string;
}

export interface Permission {
    id: string;
    name: string; // 'work_orders:create'
    resource: string; // 'work_orders'
    action: string; // 'create', 'read', 'update', 'delete', 'manage'
    description: string | null;
    created_at: string;
}

export interface RolePermission {
    role_id: string;
    permission_id: string;
    created_at: string;
}

// Role with permissions populated
export interface RoleWithPermissions extends Role {
    permissions: Permission[];
}

// For creating/updating roles
export interface RoleInput {
    name: string;
    display_name: string;
    description?: string | null;
    user_type?: 'internal' | 'external';
}

// User profile with role
export interface UserWithRole {
    id: string;
    display_name: string;
    avatar_url: string | null;
    phone: string | null;
    alternate_email: string | null;
    role_id: string | null;
    role: Role | null;
    onboarding_completed: boolean;
    created_at: string;
    updated_at: string;
}

// Permission check types
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'assign';
export type PermissionResource =
    | 'users'
    | 'roles'
    | 'permissions'
    | 'work_orders'
    | 'technicians'
    | 'equipment'
    | 'vehicles'
    | 'reports'
    | 'settings'
    | 'dashboard';

// Permission name format
export type PermissionName = `${PermissionResource}:${PermissionAction}`;

// Permission context for hooks
export interface PermissionContext {
    permissions: string[];
    role: Role | null;
    isLoading: boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
}

// Grouped permissions for UI display
export interface PermissionGroup {
    resource: string;
    displayName: string;
    permissions: Permission[];
}
