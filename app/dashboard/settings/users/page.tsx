'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, LoadingSpinner, Badge, Alert, Avatar, PlusIcon, Tabs } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { useConfirmDialog } from '@/hooks';
import { usersService, UnifiedUser, Invitation } from '@/services/users.service';
import { InviteUserModal } from '@/components/settings/UserFormModal';
import { EditUserModal } from '@/components/settings/EditUserModal';
import { ConfirmDialog } from '@/components/ui';
import { toast } from '@/components/providers';

export default function UsersPage() {
    const { hasPermission } = usePermissions();
    const [users, setUsers] = useState<UnifiedUser[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UnifiedUser | null>(null);

    const { confirm, dialogProps } = useConfirmDialog();

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersData, invitationsData] = await Promise.all([
                usersService.getAll(),
                usersService.getInvitations()
            ]);
            setUsers(usersData);
            setInvitations(invitationsData);
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
                await usersService.archiveUser(user.id);
                toast.success(`${user.display_name} has been archived`);
                fetchData();
            } catch (err) {
                toast.error('Failed to archive user');
            }
        }
    };

    const handleRestore = async (user: UnifiedUser) => {
        try {
            await usersService.restoreUser(user.id);
            toast.success(`${user.display_name} has been restored`);
            fetchData();
        } catch (err) {
            toast.error('Failed to restore user');
        }
    };

    const handleDeleteInvitation = async (invitation: Invitation) => {
        const confirmed = await confirm({
            title: 'Delete Invitation',
            message: `Are you sure you want to revoke the invitation for ${invitation.email}?`,
            variant: 'danger',
            confirmLabel: 'Delete',
        });

        if (confirmed) {
            try {
                await usersService.deleteInvitation(invitation.id);
                toast.success('Invitation revoked');
                fetchData();
            } catch (err) {
                toast.error('Failed to delete invitation');
            }
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

    const tabs = [
        {
            id: 'users',
            label: `Active Users (${displayedUsers.length})`,
            content: (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showArchived}
                                onChange={(e) => setShowArchived(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-600">Show archived</span>
                        </label>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {displayedUsers.map((user) => (
                                    <tr key={user.id} className={`hover:bg-gray-50 ${!user.is_active ? 'opacity-60' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Avatar src={user.avatar_url} alt={user.display_name} size="md" />
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.display_name}</div>
                                                    {user.nick_name && <div className="text-sm text-gray-500">"{user.nick_name}"</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.role ? (
                                                <Badge variant={user.role.name === 'super_admin' ? 'warning' : 'info'}>{user.role.display_name}</Badge>
                                            ) : (
                                                <span className="text-gray-400 text-sm">No Role</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.is_active === false ? (
                                                <Badge variant="danger">Archived</Badge>
                                            ) : (
                                                <Badge variant="success">Active</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => setEditingUser(user)}>Edit</Button>
                                                {user.is_active === false ? (
                                                    <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleRestore(user)}>Restore</Button>
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="text-orange-600" onClick={() => handleArchive(user)}>Archive</Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {displayedUsers.length === 0 && (
                            <div className="p-8 text-center text-gray-500">No users found.</div>
                        )}
                    </div>
                </div>
            )
        },
        {
            id: 'invitations',
            label: `Pending Invitations (${invitations.length})`,
            content: (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Types</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invited</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invitations.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{inv.display_name}</div>
                                        {inv.nick_name && <div className="text-sm text-gray-500">"{inv.nick_name}"</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex gap-1">
                                            {inv.is_technician && <Badge variant="info" size="sm">Tech</Badge>}
                                            {inv.is_office_staff && <Badge variant="success" size="sm">Office</Badge>}
                                            {!inv.is_technician && !inv.is_office_staff && <span className="text-gray-400 text-sm">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {inv.role ? (
                                            <Badge variant="info">{inv.role.display_name}</Badge>
                                        ) : (
                                            <span className="text-gray-400 text-sm">No Role</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(inv.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteInvitation(inv)}>
                                            Revoke
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {invitations.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No pending invitations.</div>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-1">Invite users and manage access</p>
                </div>
                <Button onClick={() => setIsInviteModalOpen(true)} leftIcon={<PlusIcon />}>
                    Invite User
                </Button>
            </div>

            {error && (
                <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Tabs tabs={tabs} defaultTab="users" />

            {/* Invite Modal */}
            <InviteUserModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={fetchData}
            />

            {/* Edit Modal */}
            <EditUserModal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                user={editingUser}
                onSuccess={fetchData}
            />

            <ConfirmDialog {...dialogProps} />
        </div>
    );
}
