'use client';

import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui';

interface HeaderProps {
    user: User | null;
    onSignOut: () => void;
    onToggleSidebar: () => void;
}

export function Header({ user, onSignOut, onToggleSidebar }: HeaderProps) {
    return (
        <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30 h-16">
            <div className="flex items-center justify-between px-4 h-full">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Toggle sidebar"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>

                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                            TL
                        </div>
                        <span className="text-xl font-bold text-gray-900 tracking-tight">
                            Tops Lighting
                        </span>
                    </Link>
                </div>

                {/* User Info & Logout */}
                <div className="flex items-center gap-4">
                    {user && (
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-sm font-medium text-gray-900">
                                {user.user_metadata?.first_name || 'User'}
                            </span>
                            <span className="text-xs text-gray-500">
                                {user.email}
                            </span>
                        </div>
                    )}
                    <Button
                        onClick={onSignOut}
                        variant="danger"
                        size="sm"
                        leftIcon="🚪"
                    >
                        Logout
                    </Button>
                </div>
            </div>
        </header>
    );
}
