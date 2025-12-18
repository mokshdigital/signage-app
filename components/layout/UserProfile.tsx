'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, Button, LogoutIcon, Badge } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';

interface UserProfileProps {
    onSignOut: () => void;
}

export function UserProfile({ onSignOut }: UserProfileProps) {
    const { profile, role, isLoading } = usePermissions();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoading || !profile) return null;

    // Separate name parts for "Welcome, [Name]" handling if desired, 
    // but design prompt asks for name on the left of the avatar.
    const displayName = profile.display_name || 'User';

    const handleLogout = () => {
        setIsOpen(false);
        onSignOut();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Area */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-900 leading-tight">
                        {displayName}
                    </span>
                    {role && (
                        <span className="text-xs text-gray-500 leading-tight">
                            {role.display_name}
                        </span>
                    )}
                </div>
                <Avatar
                    src={profile.avatar_url}
                    alt={displayName}
                    size="md"
                    className="border-2 border-white shadow-sm"
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    {/* Header Section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate" title={profile.alternate_email || ''}>
                            {profile.alternate_email}
                        </p>
                        <div className="mt-2">
                            {role ? <Badge variant="info" size="sm" className="px-2 py-0.5">{role.display_name}</Badge> : null}
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        <Link
                            href="/dashboard/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="text-lg">👤</span>
                            Profile Settings
                        </Link>
                        {/* We can add more links here later like "Settings" if we want to deep link to role settings for admins */}
                        {role?.name === 'super_admin' && (
                            <Link
                                href="/dashboard/settings"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                                onClick={() => setIsOpen(false)}
                            >
                                <span className="text-lg">⚙️</span>
                                System Settings
                            </Link>
                        )}
                    </div>

                    {/* Footer / Logout */}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                            <LogoutIcon className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
