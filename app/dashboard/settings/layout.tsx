'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { hasPermission } = usePermissions();

    const tabs = [
        { name: 'Roles', href: '/dashboard/settings/roles', permission: 'roles:manage' },
        { name: 'Users', href: '/dashboard/settings/users', permission: 'users:manage' },
        { name: 'Job Types', href: '/dashboard/settings/job-types', permission: 'settings:manage' },
        { name: 'Checklist Templates', href: '/dashboard/settings/checklist-templates', permission: 'settings:manage' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Manage system configurations and access control.</p>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        // Show tab if user has permission (or if no permission required)
                        if (tab.permission && !hasPermission(tab.permission)) return null;

                        const isActive = pathname.startsWith(tab.href);
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                    ${isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="min-h-[400px]">
                {children}
            </div>
        </div>
    );
}
