'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Client } from '@/types/database';
import { clientsService } from '@/services/clients.service';
import { useModal, useConfirmDialog, usePermissions } from '@/hooks';
import { Button, Modal, Card, Badge, ConfirmDialog, Alert, LoadingSpinner, PlusIcon } from '@/components/ui';
import { DataTable, Column } from '@/components/tables';
import { ClientForm, ClientFormData } from '@/components/forms';
import { toast } from '@/components/providers';
import { safeRender } from '@/lib/utils/helpers';

export default function ClientsPage() {
    // Permissions
    const { hasPermission, isLoading: permissionsLoading } = usePermissions();
    const canCreate = hasPermission('clients:create');
    const canUpdate = hasPermission('clients:update');
    const canDelete = hasPermission('clients:delete');

    // State
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const {
        isOpen: isModalOpen,
        open: openModal,
        close: closeModal,
        data: editingClient
    } = useModal<Client>();

    // Delete Confirmation Hook
    const { confirm, dialogProps } = useConfirmDialog();

    // Fetch clients
    const fetchClients = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await clientsService.getAll();
            setClients(data);
        } catch (err: any) {
            console.error('Error fetching clients:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    // Handlers
    const handleCreateOrUpdate = async (formData: ClientFormData) => {
        setSubmitting(true);
        try {
            if (editingClient) {
                await clientsService.update(editingClient.id, formData);
                toast.success('Client updated successfully');
            } else {
                await clientsService.create(formData);
                toast.success('Client added successfully');
            }
            closeModal();
            await fetchClients();
        } catch (error: any) {
            toast.error('Failed to save client', { description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (item: Client) => {
        const isConfirmed = await confirm({
            title: 'Delete Client',
            message: `Are you sure you want to delete "${item.name}"? This will also remove all associated contacts (Project Managers). This action cannot be undone.`,
            variant: 'danger',
            confirmLabel: 'Delete',
        });

        if (isConfirmed) {
            try {
                await clientsService.delete(item.id);
                toast.success('Client deleted');
                await fetchClients();
            } catch (error: any) {
                toast.error('Failed to delete client', { description: error.message });
            }
        }
    };

    // Filter clients by search query
    const filteredClients = searchQuery
        ? clients.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.address?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : clients;

    // Columns Definition
    const columns: Column<Client>[] = [
        {
            key: 'name',
            header: 'Company Name',
            sortable: true,
            render: (item) => (
                <Link
                    href={`/dashboard/clients/${item.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                    {safeRender(item.name)}
                </Link>
            )
        },
        {
            key: 'address',
            header: 'Registered Office',
            render: (item) => (
                <span className="text-gray-600 text-sm truncate max-w-xs block">
                    {safeRender(item.address) || '—'}
                </span>
            )
        },
        {
            key: 'pm_count',
            header: 'Contacts',
            align: 'center',
            render: (item) => (
                <Badge variant="default" size="sm">
                    {item.pm_count || 0}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (item) => (
                <div className="flex justify-end gap-2">
                    <Link href={`/dashboard/clients/${item.id}`}>
                        <Button size="sm" variant="ghost">
                            View
                        </Button>
                    </Link>
                    {canUpdate && (
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
                    )}
                    {canDelete && (
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
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage corporate clients and their contacts</p>
                </div>
                {canCreate && (
                    <Button onClick={() => openModal()} leftIcon={<PlusIcon />}>
                        Add Client
                    </Button>
                )}
            </div>

            {/* Search */}
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search clients by name or address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {searchQuery && (
                        <Button
                            variant="secondary"
                            onClick={() => setSearchQuery('')}
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </Card>

            {error && (
                <Alert variant="error" title="Error" dismissible>
                    {error.message}
                </Alert>
            )}

            <Card noPadding>
                <DataTable
                    data={filteredClients}
                    columns={columns}
                    keyExtractor={(c) => c.id}
                    loading={loading}
                    emptyMessage="No clients found"
                    emptyDescription={searchQuery
                        ? "Try adjusting your search criteria."
                        : "Get started by adding your first client."
                    }
                    emptyAction={!searchQuery ? {
                        label: 'Add Client',
                        onClick: () => openModal()
                    } : undefined}
                />
            </Card>

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingClient ? 'Edit Client' : 'Add Client'}
                size="md"
                showCloseButton={false}
                footer={null}
            >
                <ClientForm
                    initialData={editingClient || undefined}
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
