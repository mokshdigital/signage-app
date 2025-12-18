'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getCurrentUserPermissions } from '@/services/rbac.service';
import { createClient } from '@/lib/supabase/client';
import type { Role, PermissionContext, UserWithRole } from '@/types/rbac';

// Default context value
const defaultContext: PermissionContext & { profile: UserWithRole | null } = {
    permissions: [],
    role: null,
    profile: null,
    isLoading: true,
    hasPermission: () => false,
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
};

interface ExtendedPermissionContext extends PermissionContext {
    profile: UserWithRole | null;
}

// Create the context
const PermissionsContext = createContext<ExtendedPermissionContext>(defaultContext);

// Provider component
export function PermissionsProvider({ children }: { children: ReactNode }) {
    const [permissions, setPermissions] = useState<string[]>([]);
    const [role, setRole] = useState<Role | null>(null);
    const [profile, setProfile] = useState<UserWithRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch permissions on mount
    useEffect(() => {
        async function fetchPermissions() {
            try {
                const supabase = createClient();

                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsLoading(false);
                    return;
                }

                // Get user profile with role
                const { data: userProfile } = await supabase
                    .from('user_profiles')
                    .select(`
                        id,
                        display_name,
                        avatar_url,
                        phone,
                        alternate_email,
                        onboarding_completed,
                        created_at,
                        updated_at,
                        role_id,
                        role:roles(*)
                    `)
                    .eq('id', user.id)
                    .single();

                if (userProfile) {
                    // Fix type casting for UserWithRole since Supabase returns slightly different structure
                    const fullProfile = userProfile as unknown as UserWithRole;
                    setProfile(fullProfile);

                    if (fullProfile.role) {
                        setRole(fullProfile.role);
                    }
                }

                // Get permissions
                const perms = await getCurrentUserPermissions();
                setPermissions(perms);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchPermissions();
    }, []);

    // Permission check functions
    const hasPermission = useCallback((permission: string): boolean => {
        // Check for exact permission or 'manage' permission for the resource
        const [resource] = permission.split(':');
        return permissions.includes(permission) || permissions.includes(`${resource}:manage`);
    }, [permissions]);

    const hasAnyPermission = useCallback((permsToCheck: string[]): boolean => {
        return permsToCheck.some(p => hasPermission(p));
    }, [hasPermission]);

    const hasAllPermissions = useCallback((permsToCheck: string[]): boolean => {
        return permsToCheck.every(p => hasPermission(p));
    }, [hasPermission]);

    const contextValue: ExtendedPermissionContext = {
        permissions,
        role,
        profile,
        isLoading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
    };

    return (
        <PermissionsContext.Provider value={contextValue}>
            {children}
        </PermissionsContext.Provider>
    );
}

// Hook to use permissions
export function usePermissions(): ExtendedPermissionContext {
    const context = useContext(PermissionsContext);
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }
    return context;
}

// Utility hook for simple permission checks
export function useHasPermission(permission: string): boolean {
    const { hasPermission, isLoading } = usePermissions();
    if (isLoading) return false;
    return hasPermission(permission);
}

// Component for conditional rendering based on permission
export function RequirePermission({
    permission,
    children,
    fallback = null
}: {
    permission: string | string[];
    children: ReactNode;
    fallback?: ReactNode;
}) {
    const { hasPermission, hasAnyPermission, isLoading } = usePermissions();

    if (isLoading) {
        return null;
    }

    const hasAccess = Array.isArray(permission)
        ? hasAnyPermission(permission)
        : hasPermission(permission);

    return hasAccess ? <>{children}</> : <>{fallback}</>;
}
