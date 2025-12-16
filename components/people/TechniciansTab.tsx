'use client';

import { useState } from 'react';
import { Technician } from '@/types/database';
import { techniciansService } from '@/services/technicians.service';
import { useCrud, useModal, useConfirmDialog } from '@/hooks';
import { Button, Modal, Card, Badge, ConfirmDialog, Alert, PlusIcon } from '@/components/ui';
import { DataTable, Column } from '@/components/tables';
import { TechnicianForm, TechnicianFormData } from '@/components/forms';
import { toast } from '@/components/providers';

export function TechniciansTab() {
    // CRUD Hook
    const {
        items: technicians,
        loading,
        error: crudError,
        createItem,
        updateItem,
        deleteItem
    } = useCrud<Technician>(techniciansService);

    // Modal State
    const {
        isOpen: isModalOpen,
        open: openModal,
        close: closeModal,
        data: editingTechnician
    } = useModal<Technician>();

    // Delete Confirmation Hook
    const { confirm, dialogProps } = useConfirmDialog();

    // Form Loading State
    const [submitting, setSubmitting] = useState(false);

    // Handlers
    const handleCreateOrUpdate = async (formData: TechnicianFormData) => {
        setSubmitting(true);
        try {
            if (editingTechnician) {
                await updateItem(editingTechnician.id, formData);
                toast.success('Technician updated successfully');
            } else {
                await createItem(formData);
                toast.success('Technician added successfully');
            }
            closeModal();
        } catch (error: any) {
            toast.error('Failed to save technician', { description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (tech: Technician) => {
        const isConfirmed = await confirm({
            title: 'Delete Technician',
            message: `Are you sure you want to delete ${tech.name}? This action cannot be undone.`,
            variant: 'danger',
            confirmLabel: 'Delete',
        });

        if (isConfirmed) {
            try {
                await deleteItem(tech.id);
                toast.success('Technician deleted');
            } catch (error: any) {
                toast.error('Failed to delete technician', { description: error.message });
            }
        }
    };

    // Columns Definition
    const columns: Column<Technician>[] = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        { key: 'phone', header: 'Phone' },
        {
            key: 'skills',
            header: 'Skills',
            render: (tech) => (
                <div className="flex flex-wrap gap-1">
                    {tech.skills && tech.skills.length > 0 ? (
                        tech.skills.map((skill, idx) => (
                            <Badge key={idx} variant="info" size="sm">
                                {skill}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-gray-400 text-sm">-</span>
                    )}
                </div>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (tech) => (
                <div className="flex justify-end gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            openModal(tech);
                        }}
                    >
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(tech);
                        }}
                    >
                        Delete
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-900">Technicians Directory</h2>
                    <p className="text-sm text-gray-500">Manage field technicians and their skills.</p>
                </div>
                <Button onClick={() => openModal()} leftIcon={<PlusIcon />}>
                    Add Technician
                </Button>
            </div>

            {crudError && (
                <Alert variant="error" title="Error" dismissible>
                    {crudError.message}
                </Alert>
            )}

            <Card noPadding>
                <DataTable
                    data={technicians}
                    columns={columns}
                    keyExtractor={(t) => t.id}
                    loading={loading}
                    emptyMessage="No technicians found"
                    emptyDescription="Get started by adding your first technician."
                    emptyAction={{
                        label: 'Add Technician',
                        onClick: () => openModal()
                    }}
                />
            </Card>

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingTechnician ? 'Edit Technician' : 'Add Technician'}
                size="md"
                showCloseButton={false}
                footer={null}
            >
                <TechnicianForm
                    initialData={editingTechnician || undefined}
                    onSubmit={handleCreateOrUpdate}
                    isLoading={submitting}
                    onCancel={closeModal}
                />
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                {...dialogProps}
                loading={loading}
            />
        </div>
    );
}
