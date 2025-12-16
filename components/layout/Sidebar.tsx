'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavItem {
    name: string;
    href: string;
    icon: string;
    permission?: string | string[];
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { hasPermission, hasAnyPermission, isLoading } = usePermissions();

    const mainNavItems: NavItem[] = [
        { name: 'Dashboard', href: '/dashboard', icon: '📊', permission: 'dashboard:read' },
        { name: 'Technicians', href: '/dashboard/technicians', icon: '👷', permission: 'technicians:read' },
        { name: 'Equipment', href: '/dashboard/equipment', icon: '🔧', permission: 'equipment:read' },
        { name: 'Vehicles', href: '/dashboard/vehicles', icon: '🚗', permission: 'vehicles:read' },
        { name: 'Work Orders', href: '/dashboard/work-orders', icon: '📋', permission: 'work_orders:read' },
    ];

    const adminNavItems: NavItem[] = [
        { name: 'Roles', href: '/dashboard/admin/roles', icon: '🔐', permission: 'roles:manage' },
        { name: 'Users', href: '/dashboard/admin/users', icon: '👥', permission: 'users:manage' },
    ];

    // Check if user has access to any admin items
    const hasAdminAccess = hasAnyPermission(['roles:manage', 'users:manage']);

    // Filter items based on permissions
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
    const visibleAdminItems = filterItems(adminNavItems);

    const renderNavItem = (item: NavItem) => {
        const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
            <Link
                key={item.href}
                href={item.href}
                onClick={() => {
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
    };

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
                    {/* Main Navigation */}
                    {visibleMainItems.map(renderNavItem)}

                    {/* Admin Section */}
                    {hasAdminAccess && visibleAdminItems.length > 0 && (
                        <>
                            <div className="pt-4 mt-4 border-t border-gray-200">
                                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Administration
                                </p>
                            </div>
                            {visibleAdminItems.map(renderNavItem)}
                        </>
                    )}
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

