'use client';

import { useState } from 'react';
import { Vehicle } from '@/types/database';
import { vehiclesService } from '@/services/vehicles.service';
import { useCrud, useModal, useConfirmDialog } from '@/hooks';
import { Button, Modal, Card, Badge, ConfirmDialog, Alert, getStatusVariant, PlusIcon } from '@/components/ui';
import { DataTable, Column } from '@/components/tables';
import { VehicleForm, VehicleFormData } from '@/components/forms';
import { toast } from '@/components/providers';

// Tag component for vehicle details
function VehicleTag({ label, value, variant = 'default' }: {
    label: string;
    value: string | null;
    variant?: 'default' | 'info' | 'purple' | 'warning'
}) {
    if (!value) return null;

    const variants = {
        default: 'bg-gray-50 text-gray-600 border-gray-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${variants[variant]}`}>
            <span className="text-gray-400">{label}:</span>
            <span>{value}</span>
        </span>
    );
}

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

    // Custom cell renderer for vehicle info with tags
    const VehicleInfoCell = ({ item }: { item: Vehicle }) => (
        <div className="py-2">
            {/* Main Info Row */}
            <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{item.name}</span>
                        {item.make && (
                            <span className="text-sm text-gray-500">• {item.make}</span>
                        )}
                    </div>
                    {item.type && (
                        <span className="text-sm text-gray-500">{item.type}</span>
                    )}
                </div>
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap gap-1.5">
                <VehicleTag label="Plate" value={item.license_plate} variant="info" />
                <VehicleTag label="VIN" value={item.vin} variant="purple" />
                <VehicleTag label="GVW" value={item.gross_weight} variant="warning" />
                <VehicleTag label="Reg" value={item.registration} variant="default" />
            </div>
        </div>
    );

    // Columns Definition
    const columns: Column<Vehicle>[] = [
        {
            key: 'name',
            header: 'Vehicle',
            sortable: true,
            render: (item) => <VehicleInfoCell item={item} />
        },
        {
            key: 'driver',
            header: 'Driver',
            sortable: true,
            render: (item) => (
                <div className="flex items-center gap-2">
                    {item.driver ? (
                        <>
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {item.driver.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <span className="text-gray-900">{item.driver}</span>
                        </>
                    ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                    )}
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (item) => (
                <Badge variant={getStatusVariant(item.status)}>
                    {item.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage your fleet vehicles, assignments, and registrations
                    </p>
                </div>
                <Button onClick={() => openModal()} leftIcon={<PlusIcon />}>
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
                size="lg"
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
