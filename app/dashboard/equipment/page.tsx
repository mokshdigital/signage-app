'use client';

import { useState } from 'react';
import { Equipment } from '@/types/database';
import { equipmentService } from '@/services/equipment.service';
import { useCrud, useModal, useConfirmDialog } from '@/hooks';
import { Button, Modal, Card, Badge, ConfirmDialog, Alert, getStatusVariant } from '@/components/ui';
import { DataTable, Column } from '@/components/tables';
import { EquipmentForm, EquipmentFormData } from '@/components/forms';
import { toast } from '@/components/providers';

export default function EquipmentPage() {
    // CRUD Hook
    const {
        items: equipment,
        loading,
        error: crudError,
        createItem,
        updateItem,
        deleteItem
    } = useCrud<Equipment>(equipmentService);

    // Modal State
    const {
        isOpen: isModalOpen,
        open: openModal,
        close: closeModal,
        data: editingEquipment
    } = useModal<Equipment>();

    // Delete Confirmation Hook
    const { confirm, dialogProps } = useConfirmDialog();

    // Form Loading State
    const [submitting, setSubmitting] = useState(false);

    // Handlers
    const handleCreateOrUpdate = async (formData: EquipmentFormData) => {
        setSubmitting(true);
        try {
            if (editingEquipment) {
                await updateItem(editingEquipment.id, formData);
                toast.success('Equipment updated successfully');
            } else {
                await createItem(formData);
                toast.success('Equipment added successfully');
            }
            closeModal();
        } catch (error: any) {
            toast.error('Failed to save equipment', { description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (item: Equipment) => {
        const isConfirmed = await confirm({
            title: 'Delete Equipment',
            message: `Are you sure you want to delete ${item.name}? This action cannot be undone.`,
            variant: 'danger',
            confirmLabel: 'Delete',
        });

        if (isConfirmed) {
            try {
                await deleteItem(item.id);
                toast.success('Equipment deleted');
            } catch (error: any) {
                toast.error('Failed to delete equipment', { description: error.message });
            }
        }
    };

    // Columns Definition
    const columns: Column<Equipment>[] = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'type', header: 'Type', sortable: true },
        {
            key: 'status',
            header: 'Status',
            render: (item) => (
                <Badge variant={getStatusVariant(item.status)}>
                    {item.status}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (item) => (
                <div className="flex justify-end gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            openModal(item);
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
                            handleDelete(item);
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
                <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
                <Button onClick={() => openModal()} leftIcon="➕">
                    Add Equipment
                </Button>
            </div>

            {crudError && (
                <Alert variant="error" title="Error" dismissible>
                    {crudError.message}
                </Alert>
            )}

            <Card noPadding>
                <DataTable
                    data={equipment}
                    columns={columns}
                    keyExtractor={(e) => e.id}
                    loading={loading}
                    emptyMessage="No equipment found"
                    emptyDescription="Get started by adding your first piece of equipment."
                    emptyAction={{
                        label: 'Add Equipment',
                        onClick: () => openModal()
                    }}
                />
            </Card>

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
                size="md"
                showCloseButton={false}
                footer={null}
            >
                <EquipmentForm
                    initialData={editingEquipment || undefined}
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
