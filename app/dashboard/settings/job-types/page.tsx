'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Modal, Input, Textarea, LoadingSpinner, Alert } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { workOrdersService } from '@/services/work-orders.service';
import { JobType } from '@/types/database';

export default function JobTypesPage() {
    const { hasPermission } = usePermissions();
    const [jobTypes, setJobTypes] = useState<JobType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<JobType | null>(null);
    const [deletingType, setDeletingType] = useState<JobType | null>(null);

    // Form state
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);

    const loadJobTypes = useCallback(async () => {
        try {
            setLoading(true);
            const data = await workOrdersService.getJobTypes();
            setJobTypes(data);
            setError(null);
        } catch (err) {
            setError('Failed to load job types');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadJobTypes();
    }, [loadJobTypes]);

    const handleOpenCreate = () => {
        setEditingType(null);
        setFormData({ name: '', description: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (type: JobType) => {
        setEditingType(type);
        setFormData({ name: type.name, description: type.description || '' });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) return;

        try {
            setIsSaving(true);
            if (editingType) {
                await workOrdersService.updateJobType(editingType.id, formData);
            } else {
                await workOrdersService.createJobType(formData);
            }
            await loadJobTypes();
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err.message || 'Failed to save job type');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingType) return;
        try {
            setIsSaving(true);
            await workOrdersService.deleteJobType(deletingType.id);
            await loadJobTypes();
            setIsDeleteModalOpen(false);
        } catch (err: any) {
            setError(err.message || 'Failed to delete job type');
        } finally {
            setIsSaving(false);
        }
    };

    // Permission check (using settings:manage or fallback to roles:manage as admin proxy)
    const canManage = hasPermission('settings:manage') || hasPermission('roles:manage');

    if (!canManage) {
        return <Alert variant="error">You do not have permission to manage job types.</Alert>;
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Job Types</h2>
                <Button onClick={handleOpenCreate}>+ New Job Type</Button>
            </div>

            {error && (
                <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <div className="grid gap-4">
                {jobTypes.map((type) => (
                    <Card key={type.id} className="p-4 flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-gray-900">{type.name}</h3>
                            {type.description && (
                                <p className="text-sm text-gray-500">{type.description}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(type)}>
                                Edit
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                    setDeletingType(type);
                                    setIsDeleteModalOpen(true);
                                }}
                            >
                                Delete
                            </Button>
                        </div>
                    </Card>
                ))}

                {jobTypes.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        No job types found. Create one to get started.
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingType ? 'Edit Job Type' : 'New Job Type'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Installation"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <Textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Description of this job type..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving || !formData.name}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Job Type"
            >
                <div className="space-y-4">
                    <p>Are you sure you want to delete <strong>{deletingType?.name}</strong>?</p>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDelete} disabled={isSaving}>
                            {isSaving ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
