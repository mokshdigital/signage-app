import { User, Session } from '@supabase/supabase-js';

/**
 * Check if a user session is valid
 */
export function isSessionValid(session: Session | null): boolean {
    if (!session) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    
    // Check if session expires within the next 5 minutes
    return expiresAt > now + 300;
}

/**
 * Format user display name
 */
export function getUserDisplayName(user: User | null): string {
    if (!user) return 'Guest';
    
    return (
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'User'
    );
}

/**
 * Get user's authentication provider
 */
export function getUserAuthProvider(user: User | null): string {
    if (!user) return 'Unknown';
    
    const provider = user.app_metadata?.provider;
    if (provider === 'google') return 'Google';
    if (provider === 'email') return 'Email';
    
    return 'Email'; // Default
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Check if user has a specific role
 * TODO: Implement when user roles are defined
 */
export function hasRole(user: User | null, role: string): boolean {
    // Stub for future implementation
    // When roles are implemented, check user.user_metadata?.role or a separate roles table
    return false;
}

/**
 * Get user role
 * TODO: Implement when user roles are defined
 */
export function getUserRole(user: User | null): string | null {
    // Stub for future implementation
    // When roles are implemented, return user.user_metadata?.role or query roles table
    return null;
}

/**
 * Check if user has a specific permission
 * TODO: Implement when permissions are defined
 */
export function hasPermission(user: User | null, permission: string): boolean {
    // Stub for future implementation
    // When permissions are implemented, check against user's role permissions
    return false;
}

