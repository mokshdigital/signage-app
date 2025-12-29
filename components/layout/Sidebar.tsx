'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { Avatar, LogoutIcon } from '@/components/ui';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onSignOut: () => void;
}

interface NavItem {
    name: string;
    href: string;
    icon: string;
    permission?: string | string[];
}

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse, onSignOut }: SidebarProps) {
    const pathname = usePathname();
    const { profile, hasPermission, hasAnyPermission, isLoading } = usePermissions();

    const mainNavItems: NavItem[] = [
        { name: 'Dashboard', href: '/dashboard', icon: '📊', permission: 'dashboard:read' },
        { name: 'People', href: '/dashboard/people', icon: '👥', permission: 'technicians:read' },
        { name: 'Equipment', href: '/dashboard/equipment', icon: '🔧', permission: 'equipment:read' },
        { name: 'Vehicles', href: '/dashboard/vehicles', icon: '🚗', permission: 'vehicles:read' },
        { name: 'Clients', href: '/dashboard/clients', icon: '🏢', permission: 'work_orders:read' },
        { name: 'Work Orders', href: '/dashboard/work-orders', icon: '📋', permission: 'work_orders:read' },
        { name: 'Work Orders (Beta)', href: '/dashboard/work-orders-v2', icon: '🆕', permission: 'work_orders:read' },
        { name: 'Timesheets', href: '/dashboard/timesheets', icon: '⏱️', permission: ['timesheets:log_own', 'timesheets:view_all'] },
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

    const displayName = profile?.display_name || 'User';

    return (
        <>
            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-20
                    bg-white border-r border-gray-200 
                    transform transition-all duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    mt-16 lg:mt-0 h-[calc(100vh-4rem)] lg:h-screen
                    ${isCollapsed ? 'w-20' : 'w-64'}
                    flex flex-col
                `.replace(/\s+/g, ' ').trim()}
            >
                {/* Logo Section */}
                <div className={`
                    px-4 py-5 border-b border-gray-100
                    ${isCollapsed ? 'px-2 py-4' : ''}
                `}>
                    <Link href="/dashboard" className={`
                        flex items-center gap-3
                        ${isCollapsed ? 'justify-center' : ''}
                    `}>
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                            TL
                        </div>
                        {!isCollapsed && (
                            <span className="text-lg font-bold text-gray-900 tracking-tight">
                                Tops Lighting
                            </span>
                        )}
                    </Link>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {visibleMainItems.map(renderNavItem)}
                </nav>

                {/* Collapse Toggle */}
                <div className={`
                    hidden lg:flex px-4 py-3 border-t border-gray-100
                    ${isCollapsed ? 'justify-center px-2' : 'justify-end'}
                `}>
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

                {/* User Section */}
                <div className={`
                    border-t border-gray-200 bg-gray-50
                    ${isCollapsed ? 'p-2' : 'p-4'}
                `}>
                    {/* User Info */}
                    <Link
                        href="/dashboard/profile"
                        className={`
                            flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors
                            ${isCollapsed ? 'justify-center' : ''}
                        `}
                        title={isCollapsed ? displayName : undefined}
                    >
                        <Avatar
                            src={profile?.avatar_url}
                            alt={displayName}
                            size="md"
                            className="flex-shrink-0"
                        />
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {displayName}
                                </p>
                            </div>
                        )}
                    </Link>

                    {/* Divider */}
                    <div className={`
                        border-t border-gray-200 my-2
                        ${isCollapsed ? 'mx-1' : 'mx-2'}
                    `} />

                    {/* Logout */}
                    <button
                        onClick={onSignOut}
                        className={`
                            flex items-center gap-3 w-full p-2 rounded-lg
                            text-red-600 hover:bg-red-50 transition-colors
                            ${isCollapsed ? 'justify-center' : ''}
                        `}
                        title={isCollapsed ? "Sign Out" : undefined}
                    >
                        <LogoutIcon className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && (
                            <span className="text-sm font-medium">Sign Out</span>
                        )}
                    </button>
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
