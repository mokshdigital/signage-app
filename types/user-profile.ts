// User Profile types for onboarding and profile management

// User type enum - simplified to internal vs external
export type UserType = 'internal' | 'external';

export interface UserProfile {
    id: string;
    display_name: string;
    avatar_url: string | null;
    phone: string | null;
    alternate_email: string | null;
    title: string | null; // Set by administrator
    onboarding_completed: boolean;
    // Identity Fields
    nick_name: string | null;
    user_type: UserType; // Simplified: 'internal' | 'external'
    is_active: boolean;
    email: string | null;
    // Role
    role_id: string | null;

    created_at: string;
    updated_at: string;
}

export interface OnboardingFormData {
    display_name: string;
    nick_name?: string;
    avatar_url: string | null;
    phone: string;
    alternate_email?: string;
}

export interface UserProfileUpdate {
    display_name?: string;
    nick_name?: string;
    avatar_url?: string;
    phone?: string;
    alternate_email?: string;
    title?: string; // Admin only
    onboarding_completed?: boolean;
    is_active?: boolean;
    user_type?: UserType;
    role_id?: string;
}
