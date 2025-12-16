'use client';

import { useState } from 'react';
import { OfficeStaff } from '@/types/database';
import { officeStaffService } from '@/services/office-staff.service';
import { useCrud, useModal, useConfirmDialog } from '@/hooks';
import { Button, Modal, Card, ConfirmDialog, Alert, PlusIcon } from '@/components/ui';
import { DataTable, Column } from '@/components/tables';
import { OfficeStaffForm, OfficeStaffFormData } from '@/components/forms';
import { toast } from '@/components/providers';

export function OfficeStaffTab() {
    // CRUD Hook
    const {
        items: staff,
        loading,
        error: crudError,
        createItem,
        updateItem,
        deleteItem
    } = useCrud<OfficeStaff>(officeStaffService);

    // Modal State
    const {
        isOpen: isModalOpen,
        open: openModal,
        close: closeModal,
        data: editingStaff
    } = useModal<OfficeStaff>();

    // Delete Confirmation Hook
    const { confirm, dialogProps } = useConfirmDialog();

    // Form Loading State
    const [submitting, setSubmitting] = useState(false);

    // Handlers
    const handleCreateOrUpdate = async (formData: OfficeStaffFormData) => {
        setSubmitting(true);
        try {
            if (editingStaff) {
                await updateItem(editingStaff.id, formData);
                toast.success('Staff member updated successfully');
            } else {
                await createItem(formData);
                toast.success('Staff member added successfully');
            }
            closeModal();
        } catch (error: any) {
            toast.error('Failed to save staff member', { description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (item: OfficeStaff) => {
        const isConfirmed = await confirm({
            title: 'Delete Staff Member',
            message: `Are you sure you want to delete ${item.name}? This action cannot be undone.`,
            variant: 'danger',
            confirmLabel: 'Delete',
        });

        if (isConfirmed) {
            try {
                await deleteItem(item.id);
                toast.success('Staff member deleted');
            } catch (error: any) {
                toast.error('Failed to delete staff member', { description: error.message });
            }
        }
    };

    // Columns Definition
    const columns: Column<OfficeStaff>[] = [
        { key: 'name', header: 'Name', sortable: true, width: '25%' },
        {
            key: 'title',
            header: 'Title',
            sortable: true,
            render: (item) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.title || 'Staff'}
                </span>
            )
        },
        {
            key: 'email',
            header: 'Email',
            render: (item) => item.email || <span className="text-gray-400 italic">No email</span>
        },
        {
            key: 'phone',
            header: 'Phone',
            render: (item) => item.phone || <span className="text-gray-400 italic">No phone</span>
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
                <div className="flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-900">Office Staff</h2>
                    <p className="text-sm text-gray-500">Manage office personnel and roles.</p>
                </div>
                <Button onClick={() => openModal()} leftIcon={<PlusIcon />}>
                    Add Staff Member
                </Button>
            </div>

            {crudError && (
                <Alert variant="error" title="Error" dismissible>
                    {crudError.message}
                </Alert>
            )}

            <Card noPadding>
                <DataTable
                    data={staff}
                    columns={columns}
                    keyExtractor={(s) => s.id}
                    loading={loading}
                    emptyMessage="No office staff found"
                    emptyDescription="Get started by adding your first staff member."
                    emptyAction={{
                        label: 'Add Staff',
                        onClick: () => openModal()
                    }}
                />
            </Card>

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                size="md"
                showCloseButton={false}
                footer={null}
            >
                <OfficeStaffForm
                    initialData={editingStaff || undefined}
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
