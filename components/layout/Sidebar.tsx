'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

interface NavItem {
    name: string;
    href: string;
    icon: string;
    permission?: string | string[];
}

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const { hasPermission, hasAnyPermission, isLoading } = usePermissions();

    const mainNavItems: NavItem[] = [
        { name: 'Dashboard', href: '/dashboard', icon: '📊', permission: 'dashboard:read' },
        { name: 'People', href: '/dashboard/people', icon: '👥', permission: 'technicians:read' },
        { name: 'Equipment', href: '/dashboard/equipment', icon: '🔧', permission: 'equipment:read' },
        { name: 'Vehicles', href: '/dashboard/vehicles', icon: '🚗', permission: 'vehicles:read' },
        { name: 'Clients', href: '/dashboard/clients', icon: '🏢', permission: 'work_orders:read' },
        { name: 'Work Orders', href: '/dashboard/work-orders', icon: '📋', permission: 'work_orders:read' },
        { name: 'Work Orders (Beta)', href: '/dashboard/work-orders-v2', icon: '🆕', permission: 'work_orders:read' },
        {
            name: 'Settings',
            href: '/dashboard/settings',
            icon: '⚙️',
            permission: ['roles:manage', 'users:manage', 'settings:manage']
        },
    ];

    const filterItems = (items: NavItem[]) => {
        if (isLoading) return items; // Show all while loading, middleware will protect
        return items.filter(item => {
            if (!item.permission) return true;
            if (Array.isArray(item.permission)) {
                return hasAnyPermission(item.permission);
            }
            return hasPermission(item.permission);
        });
    };

    const visibleMainItems = filterItems(mainNavItems);

    const renderNavItem = (item: NavItem) => {
        const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
            <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                }}
                className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                    ${isCollapsed ? 'justify-center px-2' : ''}
                `.replace(/\s+/g, ' ').trim()}
            >
                <span className="text-xl" aria-hidden="true">{item.icon}</span>
                {!isCollapsed && <span>{item.name}</span>}
            </Link>
        );
    };

    return (
        <>
            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-20
                    bg-white border-r border-gray-200 
                    transform transition-all duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    mt-16 lg:mt-0
                    ${isCollapsed ? 'w-20' : 'w-64'}
                `.replace(/\s+/g, ' ').trim()}
            >
                <div className="flex flex-col h-full">
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {/* Main Navigation */}
                        {visibleMainItems.map(renderNavItem)}
                    </nav>

                    {/* Collapse Toggle (Desktop only) */}

                    {/* Collapse Toggle (Desktop only) */}
                    <div className="hidden lg:flex p-4 border-t border-gray-200 justify-end">
                        <button
                            onClick={onToggleCollapse}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            <svg
                                className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>
                </div>
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
