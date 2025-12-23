'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Modal, Input, Textarea, LoadingSpinner, Badge, Alert } from '@/components/ui';
import { usePermissions, RequirePermission } from '@/hooks/usePermissions';
import {
    getRoles,
    getRoleWithPermissions,
    createRole,
    updateRole,
    deleteRole,
    getPermissionsGrouped,
    updateRolePermissions
} from '@/services/rbac.service';
import type { Role, RoleWithPermissions, Permission, PermissionGroup, RoleInput } from '@/types/rbac';

export default function RolesPage() {
    const { hasPermission } = usePermissions();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);

    // Form states
    const [formData, setFormData] = useState<RoleInput>({
        name: '',
        display_name: '',
        description: '',
        user_type: 'internal',
    });
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [rolesData, permissionsData] = await Promise.all([
                getRoles(),
                getPermissionsGrouped()
            ]);
            setRoles(rolesData);
            setPermissionGroups(permissionsData);
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
    const handleCreateRole = async () => {
        if (!formData.name || !formData.display_name) return;

        try {
            setIsSaving(true);
            const newRole = await createRole(formData);

            // Assign permissions to the new role
            if (selectedPermissions.size > 0) {
                await updateRolePermissions(newRole.id, Array.from(selectedPermissions));
            }

            await fetchData();
            setIsCreateModalOpen(false);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create role');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditRole = async (roleId: string) => {
        try {
            const roleWithPerms = await getRoleWithPermissions(roleId);
            if (roleWithPerms) {
                setSelectedRole(roleWithPerms);
                setFormData({
                    name: roleWithPerms.name,
                    display_name: roleWithPerms.display_name,
                    description: roleWithPerms.description || '',
                    user_type: roleWithPerms.user_type,
                });
                setSelectedPermissions(new Set(roleWithPerms.permissions.map(p => p.id)));
                setIsEditModalOpen(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load role');
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedRole || !formData.display_name) return;

        try {
            setIsSaving(true);

            // Update role info (only non-system roles can change name)
            const updates: Partial<RoleInput> = {
                display_name: formData.display_name,
                description: formData.description,
                user_type: formData.user_type,
            };
            if (!selectedRole.is_system) {
                updates.name = formData.name;
            }

            await updateRole(selectedRole.id, updates);
            await updateRolePermissions(selectedRole.id, Array.from(selectedPermissions));

            await fetchData();
            setIsEditModalOpen(false);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update role');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRole = async () => {
        if (!selectedRole) return;

        try {
            setIsSaving(true);
            await deleteRole(selectedRole.id);
            await fetchData();
            setIsDeleteModalOpen(false);
            setSelectedRole(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete role');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = (role: Role) => {
        setSelectedRole(role as RoleWithPermissions);
        setIsDeleteModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ name: '', display_name: '', description: '', user_type: 'internal' });
        setSelectedPermissions(new Set());
        setSelectedRole(null);
    };

    const togglePermission = (permissionId: string) => {
        const newSet = new Set(selectedPermissions);
        if (newSet.has(permissionId)) {
            newSet.delete(permissionId);
        } else {
            newSet.add(permissionId);
        }
        setSelectedPermissions(newSet);
    };

    const toggleAllInGroup = (permissions: Permission[]) => {
        const newSet = new Set(selectedPermissions);
        const allSelected = permissions.every(p => newSet.has(p.id));

        permissions.forEach(p => {
            if (allSelected) {
                newSet.delete(p.id);
            } else {
                newSet.add(p.id);
            }
        });

        setSelectedPermissions(newSet);
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    };

    // Check permission
    if (!hasPermission('roles:manage')) {
        return (
            <div className="p-8">
                <Alert variant="error">
                    You do not have permission to manage roles.
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
                    <p className="text-gray-600 mt-1">Create and manage user roles and permissions</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    + Create Role
                </Button>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Roles List */}
            <div className="grid gap-4">
                {roles.map((role) => (
                    <Card key={role.id} className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-xl">🔐</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900">{role.display_name}</h3>
                                        {role.is_system && (
                                            <Badge variant="info">System</Badge>
                                        )}
                                        <Badge variant={role.user_type === 'internal' ? 'success' : 'warning'}>
                                            {role.user_type === 'internal' ? 'Internal' : 'External'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {role.description || `Slug: ${role.name}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleEditRole(role.id)}
                                >
                                    Edit
                                </Button>
                                {!role.is_system && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => confirmDelete(role)}
                                    >
                                        Delete
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}

                {roles.length === 0 && (
                    <Card className="p-8 text-center">
                        <p className="text-gray-500">No roles found. Create your first role to get started.</p>
                    </Card>
                )}
            </div>

            {/* Create Role Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); resetForm(); }}
                title="Create New Role"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Display Name *
                        </label>
                        <Input
                            value={formData.display_name}
                            onChange={(e) => {
                                setFormData({
                                    ...formData,
                                    display_name: e.target.value,
                                    name: generateSlug(e.target.value),
                                });
                            }}
                            placeholder="e.g., Project Manager"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slug (auto-generated)
                        </label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: generateSlug(e.target.value) })}
                            placeholder="e.g., project_manager"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <Textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe what this role can do..."
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            User Type *
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="user_type_create"
                                    value="internal"
                                    checked={formData.user_type === 'internal'}
                                    onChange={() => setFormData({ ...formData, user_type: 'internal' })}
                                    className="w-4 h-4 text-blue-600 border-gray-300"
                                />
                                <span className="text-sm text-gray-700">Internal</span>
                                <span className="text-xs text-gray-400">(Employees)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="user_type_create"
                                    value="external"
                                    checked={formData.user_type === 'external'}
                                    onChange={() => setFormData({ ...formData, user_type: 'external' })}
                                    className="w-4 h-4 text-blue-600 border-gray-300"
                                />
                                <span className="text-sm text-gray-700">External</span>
                                <span className="text-xs text-gray-400">(Clients, Vendors)</span>
                            </label>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Permissions
                        </label>
                        <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-4">
                            {permissionGroups.map((group) => (
                                <div key={group.resource}>
                                    <div
                                        className="flex items-center gap-2 cursor-pointer mb-2"
                                        onClick={() => toggleAllInGroup(group.permissions)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={group.permissions.every(p => selectedPermissions.has(p.id))}
                                            onChange={() => toggleAllInGroup(group.permissions)}
                                            className="rounded"
                                        />
                                        <span className="font-medium text-gray-800">{group.displayName}</span>
                                    </div>
                                    <div className="ml-6 grid grid-cols-2 gap-1">
                                        {group.permissions.map((perm) => (
                                            <label
                                                key={perm.id}
                                                className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPermissions.has(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                    className="rounded"
                                                />
                                                {perm.action}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => { setIsCreateModalOpen(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateRole}
                            disabled={!formData.name || !formData.display_name || isSaving}
                        >
                            {isSaving ? 'Creating...' : 'Create Role'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Role Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); resetForm(); }}
                title={`Edit Role: ${selectedRole?.display_name}`}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Display Name *
                        </label>
                        <Input
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            placeholder="e.g., Project Manager"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slug {selectedRole?.is_system && '(locked for system roles)'}
                        </label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: generateSlug(e.target.value) })}
                            placeholder="e.g., project_manager"
                            disabled={selectedRole?.is_system}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <Textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe what this role can do..."
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            User Type *
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="user_type_edit"
                                    value="internal"
                                    checked={formData.user_type === 'internal'}
                                    onChange={() => setFormData({ ...formData, user_type: 'internal' })}
                                    className="w-4 h-4 text-blue-600 border-gray-300"
                                />
                                <span className="text-sm text-gray-700">Internal</span>
                                <span className="text-xs text-gray-400">(Employees)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="user_type_edit"
                                    value="external"
                                    checked={formData.user_type === 'external'}
                                    onChange={() => setFormData({ ...formData, user_type: 'external' })}
                                    className="w-4 h-4 text-blue-600 border-gray-300"
                                />
                                <span className="text-sm text-gray-700">External</span>
                                <span className="text-xs text-gray-400">(Clients, Vendors)</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Permissions ({selectedPermissions.size} selected)
                        </label>
                        <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-4">
                            {permissionGroups.map((group) => (
                                <div key={group.resource}>
                                    <div
                                        className="flex items-center gap-2 cursor-pointer mb-2"
                                        onClick={() => toggleAllInGroup(group.permissions)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={group.permissions.every(p => selectedPermissions.has(p.id))}
                                            onChange={() => toggleAllInGroup(group.permissions)}
                                            className="rounded"
                                        />
                                        <span className="font-medium text-gray-800">{group.displayName}</span>
                                    </div>
                                    <div className="ml-6 grid grid-cols-2 gap-1">
                                        {group.permissions.map((perm) => (
                                            <label
                                                key={perm.id}
                                                className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPermissions.has(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                    className="rounded"
                                                />
                                                {perm.action}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => { setIsEditModalOpen(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateRole}
                            disabled={!formData.display_name || isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setSelectedRole(null); }}
                title="Delete Role"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to delete the role <strong>{selectedRole?.display_name}</strong>?
                        Users assigned to this role will lose their permissions.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => { setIsDeleteModalOpen(false); setSelectedRole(null); }}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDeleteRole} disabled={isSaving}>
                            {isSaving ? 'Deleting...' : 'Delete Role'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
