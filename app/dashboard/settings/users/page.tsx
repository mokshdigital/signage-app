'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Modal, LoadingSpinner, Badge, Alert, Avatar } from '@/components/ui';
import { Select } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import {
    getRoles,
    getAllUsersWithRoles,
    assignRoleToUser
} from '@/services/rbac.service';
import type { Role, UserWithRole } from '@/types/rbac';

export default function UsersPage() {
    const { hasPermission } = usePermissions();
    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersData, rolesData] = await Promise.all([
                getAllUsersWithRoles(),
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
    const openAssignModal = (user: UserWithRole) => {
        setSelectedUser(user);
        setSelectedRoleId(user.role_id || '');
        setIsAssignModalOpen(true);
    };

    const handleAssignRole = async () => {
        if (!selectedUser) return;

        try {
            setIsSaving(true);
            await assignRoleToUser(selectedUser.id, selectedRoleId || null);
            await fetchData();
            setIsAssignModalOpen(false);
            setSelectedUser(null);
            setSelectedRoleId('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign role');
        } finally {
            setIsSaving(false);
        }
    };

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
            <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-1">Manage users and assign roles</p>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Users List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact
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
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
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
                                            <div className="text-sm text-gray-500">
                                                {user.role?.display_name || 'No role assigned'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{user.phone || '-'}</div>
                                    <div className="text-sm text-gray-500">{user.alternate_email || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.role ? (
                                        <Badge
                                            variant={user.role.name === 'super_admin' ? 'success' : 'info'}
                                        >
                                            {user.role.display_name}
                                        </Badge>
                                    ) : (
                                        <Badge variant="warning">No Role</Badge>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.onboarding_completed ? (
                                        <Badge variant="success">Active</Badge>
                                    ) : (
                                        <Badge variant="warning">Pending</Badge>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => openAssignModal(user)}
                                    >
                                        Assign Role
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No users found.
                    </div>
                )}
            </div>

            {/* Assign Role Modal */}
            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => { setIsAssignModalOpen(false); setSelectedUser(null); }}
                title={`Assign Role to ${selectedUser?.display_name}`}
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <Avatar
                            src={selectedUser?.avatar_url}
                            alt={selectedUser?.display_name || ''}
                            size="lg"
                        />
                        <div>
                            <p className="font-medium text-gray-900">{selectedUser?.display_name}</p>
                            <p className="text-sm text-gray-500">
                                Current role: {selectedUser?.role?.display_name || 'None'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Role
                        </label>
                        <Select
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            options={[
                                { value: '', label: 'No Role' },
                                ...roles.map((role) => ({
                                    value: role.id,
                                    label: role.display_name + (role.is_system ? ' (System)' : ''),
                                })),
                            ]}
                            placeholder="Select a role"
                        />
                    </div>

                    {selectedRoleId && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> The user will have access based on the permissions assigned to this role.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="secondary"
                            onClick={() => { setIsAssignModalOpen(false); setSelectedUser(null); }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssignRole}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Assign Role'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
