'use client';

import { useState, useMemo, useEffect } from 'react';
import { UnifiedUser, usersService } from '@/services/users.service';
import * as rbacService from '@/services/rbac.service';
import { Role } from '@/types/rbac';
import { useAsync } from '@/hooks/useAsync';
import {
    Input, Badge, Button, Card, Avatar
} from '@/components/ui';
import { Search, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export function PeopleTable() {
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Users
    const { data: usersData, loading: usersLoading, execute: fetchUsers } = useAsync<{ users: UnifiedUser[], roles: Role[] }>();

    useEffect(() => {
        fetchUsers(async () => {
            const [allUsers, allRoles] = await Promise.all([
                usersService.getAll(),
                rbacService.getRoles()
            ]);

            // Filter only internal users for this view
            const internalUsers = allUsers.filter(u => u.user_type === 'internal');

            // Filter only internal roles for the chips
            const internalRoles = allRoles.filter(r => r.user_type === 'internal');

            return { users: internalUsers, roles: internalRoles };
        });
    }, [fetchUsers]);

    const users = usersData?.users || [];
    const roles = usersData?.roles || [];

    // Filter Logic
    const filteredUsers = useMemo(() => {
        let result = users;

        // 1. Role Filter
        if (selectedRole !== 'all') {
            result = result.filter(user => user.role?.name === selectedRole);
        }

        // 2. Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(user =>
                user.display_name.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.nick_name?.toLowerCase().includes(query) ||
                user.role?.display_name.toLowerCase().includes(query)
            );
        }

        return result;
    }, [users, selectedRole, searchQuery]);

    const isLoading = usersLoading;

    // Ordered roles for chips
    const roleChips = useMemo(() => {
        // You can customize the order here if needed, or stick to DB order
        // Current requirement: "All, Technicians, Admin, Project Coordinators (in relevant order)"
        // We'll try to match exact names if they exist, then append the rest
        const priorityOrder = ['technician', 'admin', 'project_coordinator'];

        const sortedRoles = [...roles].sort((a, b) => {
            const indexA = priorityOrder.indexOf(a.name);
            const indexB = priorityOrder.indexOf(b.name);

            // If both are priority, sort by index
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // If only A is priority, A comes first
            if (indexA !== -1) return -1;
            // If only B is priority, B comes first
            if (indexB !== -1) return 1;
            // Otherwise sort alphabetically
            return a.display_name.localeCompare(b.display_name);
        });

        return sortedRoles;
    }, [roles]);


    return (
        <Card className="p-6">
            <div className="flex flex-col space-y-6">

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Role Chips */}
                    <div className="flex flex-wrap gap-2 flex-1">
                        <Button
                            variant={selectedRole === 'all' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setSelectedRole('all')}
                            className="rounded-full"
                        >
                            All
                        </Button>
                        {roleChips.map(role => (
                            <Button
                                key={role.id}
                                variant={selectedRole === role.name ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setSelectedRole(role.name)}
                                className="rounded-full"
                            >
                                {role.display_name}
                            </Button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="w-full md:w-72 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search people..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    // Loading Skeletons
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-10 w-40 bg-gray-100 animate-pulse rounded" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 w-24 bg-gray-100 animate-pulse rounded" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-10 w-48 bg-gray-100 animate-pulse rounded" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 w-16 bg-gray-100 animate-pulse rounded" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right"><div className="h-8 w-8 bg-gray-100 animate-pulse rounded inline-block" /></td>
                                        </tr>
                                    ))
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 h-32">
                                            No people found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={user.avatar_url || undefined}
                                                        fallback={user.display_name.substring(0, 2).toUpperCase()}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900">{user.display_name}</span>
                                                        {user.nick_name && (
                                                            <span className="text-xs text-gray-500">@{user.nick_name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.role ? (
                                                    <Badge
                                                        variant={
                                                            user.role.name === 'admin' ? 'purple' :
                                                                user.role.name === 'technician' ? 'success' : 'info'
                                                        }
                                                    >
                                                        {user.role.display_name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">No Role</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1 text-sm text-gray-600">
                                                    {user.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-3 w-3" />
                                                            {user.email}
                                                        </div>
                                                    )}
                                                    {user.phone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-3 w-3" />
                                                            {user.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant={user.is_active ? 'success' : 'default'}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link href={`/dashboard/settings/users?edit=${user.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        Edit
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Card>
    );
}
