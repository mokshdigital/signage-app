'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getUserDisplayName, getUserAuthProvider, formatDate } from '@/lib/auth-utils';

export default function AccountPage() {
    const { user, session, loading, signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Account</h1>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 max-w-2xl">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user.email || 'Not provided'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {getUserDisplayName(user)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {formatDate(user.created_at)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Authentication Method</dt>
                                <dd className="mt-1 text-sm text-gray-900">{getUserAuthProvider(user)}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h2>
                        <button
                            onClick={signOut}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

