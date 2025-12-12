'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: '📊' },
        { name: 'Technicians', href: '/dashboard/technicians', icon: '👷' },
        { name: 'Equipment', href: '/dashboard/equipment', icon: '🔧' },
        { name: 'Vehicles', href: '/dashboard/vehicles', icon: '🚗' },
        { name: 'Work Orders', href: '/dashboard/work-orders', icon: '📋' },
    ];

    return (
        <>
            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-20
                    w-64 bg-white border-r border-gray-200 
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    mt-16 lg:mt-0
                `.replace(/\s+/g, ' ').trim()}
            >
                <nav className="p-4 space-y-2 max-h-[calc(100vh-64px)] overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    // Close sidebar on mobile when navigating
                                    if (window.innerWidth < 1024) onClose();
                                }}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }
                                `.replace(/\s+/g, ' ').trim()}
                            >
                                <span className="text-xl" aria-hidden="true">{item.icon}</span>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 lg:hidden z-10"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
        </>
    );
}
