'use client';

import { useState } from 'react';
import { Vehicle } from '@/types/database';
import { vehiclesService } from '@/services/vehicles.service';
import { useCrud, useModal, useConfirmDialog } from '@/hooks';
import { Button, Modal, Card, Badge, ConfirmDialog, Alert, getStatusVariant } from '@/components/ui';
import { DataTable, Column } from '@/components/tables';
import { VehicleForm, VehicleFormData } from '@/components/forms';
import { toast } from '@/components/providers';

export default function VehiclesPage() {
    // CRUD Hook
    const {
        items: vehicles,
        loading,
        error: crudError,
        createItem,
        updateItem,
        deleteItem
    } = useCrud<Vehicle>(vehiclesService);

    // Modal State
    const {
        isOpen: isModalOpen,
        open: openModal,
        close: closeModal,
        data: editingVehicle
    } = useModal<Vehicle>();

    // Delete Confirmation Hook
    const { confirm, dialogProps } = useConfirmDialog();

    // Form Loading State
    const [submitting, setSubmitting] = useState(false);

    // Handlers
    const handleCreateOrUpdate = async (formData: VehicleFormData) => {
        setSubmitting(true);
        try {
            if (editingVehicle) {
                await updateItem(editingVehicle.id, formData);
                toast.success('Vehicle updated successfully');
            } else {
                await createItem(formData);
                toast.success('Vehicle added successfully');
            }
            closeModal();
        } catch (error: any) {
            toast.error('Failed to save vehicle', { description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (item: Vehicle) => {
        const isConfirmed = await confirm({
            title: 'Delete Vehicle',
            message: `Are you sure you want to delete ${item.name}? This action cannot be undone.`,
            variant: 'danger',
            confirmLabel: 'Delete',
        });

        if (isConfirmed) {
            try {
                await deleteItem(item.id);
                toast.success('Vehicle deleted');
            } catch (error: any) {
                toast.error('Failed to delete vehicle', { description: error.message });
            }
        }
    };

    // Columns Definition
    const columns: Column<Vehicle>[] = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'license_plate', header: 'License Plate', sortable: true },
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
                <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
                <Button onClick={() => openModal()} leftIcon="➕">
                    Add Vehicle
                </Button>
            </div>

            {crudError && (
                <Alert variant="error" title="Error" dismissible>
                    {crudError.message}
                </Alert>
            )}

            <Card noPadding>
                <DataTable
                    data={vehicles}
                    columns={columns}
                    keyExtractor={(v) => v.id}
                    loading={loading}
                    emptyMessage="No vehicles found"
                    emptyDescription="Get started by adding your first vehicle."
                    emptyAction={{
                        label: 'Add Vehicle',
                        onClick: () => openModal()
                    }}
                />
            </Card>

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                size="md"
                showCloseButton={false}
                footer={null}
            >
                <VehicleForm
                    initialData={editingVehicle || undefined}
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
