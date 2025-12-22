'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Modal, LoadingSpinner, Badge, Alert, Avatar, PlusIcon } from '@/components/ui';
import { Select } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { useModal, useConfirmDialog } from '@/hooks';
import { getRoles, assignRoleToUser } from '@/services/rbac.service';
import { usersService, UnifiedUser } from '@/services/users.service';
import { UserFormModal } from '@/components/settings/UserFormModal';
import { ConfirmDialog } from '@/components/ui';
import type { Role } from '@/types/rbac';
import { toast } from '@/components/providers';

export default function UsersPage() {
    const { hasPermission } = usePermissions();
    const [users, setUsers] = useState<UnifiedUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    // Modal states
    const { isOpen: isFormOpen, open: openForm, close: closeForm, data: editingUser } = useModal<UnifiedUser>();
    const { confirm, dialogProps } = useConfirmDialog();

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersData, rolesData] = await Promise.all([
                usersService.getAll(),
                getRoles()
            ]);
            setUsers(usersData);
            setRoles(rolesData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handlers
    const handleArchive = async (user: UnifiedUser) => {
        const confirmed = await confirm({
            title: 'Archive User',
            message: `Are you sure you want to archive ${user.display_name}? They will lose access but their data will be preserved.`,
            variant: 'warning',
            confirmLabel: 'Archive',
        });

        if (confirmed) {
            try {
                await usersService.archive(user.id);
                toast.success(`${user.display_name} has been archived`);
                fetchData();
            } catch (err) {
                toast.error('Failed to archive user');
            }
        }
    };

    const handleRestore = async (user: UnifiedUser) => {
        try {
            await usersService.restore(user.id);
            toast.success(`${user.display_name} has been restored`);
            fetchData();
        } catch (err) {
            toast.error('Failed to restore user');
        }
    };

    // Filter users based on archive toggle
    const displayedUsers = showArchived
        ? users
        : users.filter(u => u.is_active !== false);

    // Check permission
    if (!hasPermission('users:manage')) {
        return (
            <div className="p-8">
                <Alert variant="error">
                    You do not have permission to manage users.
                </Alert>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-1">Create, edit, and manage user accounts</p>
                </div>
                <Button onClick={() => openForm()} leftIcon={<PlusIcon />}>
                    Add User
                </Button>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">Show archived users</span>
                </label>
                <span className="text-sm text-gray-400">
                    {displayedUsers.length} user{displayedUsers.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Types
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {displayedUsers.map((user) => (
                            <tr
                                key={user.id}
                                className={`hover:bg-gray-50 ${!user.is_active ? 'opacity-60' : ''}`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Avatar
                                            src={user.avatar_url}
                                            alt={user.display_name}
                                            size="md"
                                        />
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.display_name}
                                            </div>
                                            {user.nick_name && (
                                                <div className="text-sm text-gray-500">
                                                    "{user.nick_name}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{user.email || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-1">
                                        {user.technician && (
                                            <Badge variant="info" size="sm">Tech</Badge>
                                        )}
                                        {user.office_staff && (
                                            <Badge variant="success" size="sm">Office</Badge>
                                        )}
                                        {!user.technician && !user.office_staff && (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.role ? (
                                        <Badge
                                            variant={user.role.name === 'super_admin' ? 'warning' : 'info'}
                                        >
                                            {user.role.display_name}
                                        </Badge>
                                    ) : (
                                        <span className="text-gray-400 text-sm">No Role</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.is_active === false ? (
                                        <Badge variant="danger">Archived</Badge>
                                    ) : user.onboarding_completed ? (
                                        <Badge variant="success">Active</Badge>
                                    ) : (
                                        <Badge variant="warning">Pending</Badge>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openForm(user)}
                                        >
                                            Edit
                                        </Button>
                                        {user.is_active === false ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-green-600 hover:text-green-700"
                                                onClick={() => handleRestore(user)}
                                            >
                                                Restore
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-orange-600 hover:text-orange-700"
                                                onClick={() => handleArchive(user)}
                                            >
                                                Archive
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {displayedUsers.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        {showArchived ? 'No users found.' : 'No active users found.'}
                    </div>
                )}
            </div>

            {/* User Form Modal */}
            <UserFormModal
                isOpen={isFormOpen}
                onClose={closeForm}
                user={editingUser}
                onSuccess={fetchData}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogProps} />
        </div>
    );
}
