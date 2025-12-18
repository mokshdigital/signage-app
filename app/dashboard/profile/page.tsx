'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { Card, Avatar, Badge, LoadingSpinner } from '@/components/ui';

export default function ProfilePage() {
    const { profile, role, isLoading } = usePermissions();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!profile) {
        return <div className="p-8 text-center text-gray-500">Profile not found.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

            <Card className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <Avatar
                            src={profile.avatar_url}
                            alt={profile.display_name}
                            size="xl"
                            className="w-24 h-24 text-3xl"
                        />
                        {/* Placeholder for future avatar upload */}
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h2 className="text-xl font-semibold text-gray-900">{profile.display_name}</h2>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500">
                            <span>{profile.alternate_email || 'No email set'}</span>
                        </div>
                        <div className="pt-2">
                            {role ? (
                                <Badge variant="info">{role.display_name}</Badge>
                            ) : (
                                <Badge variant="warning">No Role</Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="mt-1 text-gray-900">{profile.phone || '-'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Member Since</label>
                        <p className="mt-1 text-gray-900">
                            {new Date(profile.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Account Status</label>
                        <div className="mt-1">
                            {profile.onboarding_completed ? (
                                <Badge variant="success">Active</Badge>
                            ) : (
                                <Badge variant="warning">Pending Onboarding</Badge>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="p-6 bg-gray-50 border-dashed">
                <div className="text-center text-gray-500">
                    <p>Profile editing features coming soon.</p>
                </div>
            </Card>
        </div>
    );
}
