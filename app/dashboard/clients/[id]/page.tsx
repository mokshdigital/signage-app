'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Client, ProjectManager, WorkOrder } from '@/types/database';
import { clientsService } from '@/services/clients.service';
import { useModal, useConfirmDialog, usePermissions } from '@/hooks';
import { Button, Modal, Card, Badge, ConfirmDialog, Alert, LoadingSpinner, PlusIcon } from '@/components/ui';
import { DataTable, Column } from '@/components/tables';
import { ClientForm, ClientFormData, ProjectManagerForm, ProjectManagerFormData } from '@/components/forms';
import { CreatePortalAccountModal } from '@/components/clients';
import { toast } from '@/components/providers';
import { safeRender } from '@/lib/utils/helpers';

type TabType = 'contacts' | 'history';

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id as string;

    // Permissions
    const { hasPermission } = usePermissions();
    const canUpdate = hasPermission('clients:update');
    const canDelete = hasPermission('clients:delete');
    const canManage = hasPermission('clients:manage');

    // State
    const [client, setClient] = useState<Client | null>(null);
    const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('contacts');
    const [submitting, setSubmitting] = useState(false);

    // Edit Client Modal
    const {
        isOpen: isEditClientOpen,
        open: openEditClient,
        close: closeEditClient
    } = useModal<Client>();

    // PM Modal
    const {
        isOpen: isPMModalOpen,
        open: openPMModal,
        close: closePMModal,
        data: editingPM
    } = useModal<ProjectManager>();

    // Portal Account Modal
    const {
        isOpen: isPortalModalOpen,
        open: openPortalModal,
        close: closePortalModal,
        data: portalPM
    } = useModal<ProjectManager>();

    // Delete Confirmation Hook
    const { confirm, dialogProps } = useConfirmDialog();

    // Fetch client data
    const fetchClient = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await clientsService.getById(clientId);
            if (!data) {
                router.push('/dashboard/clients');
                toast.error('Client not found');
                return;
            }
            setClient(data);
            setProjectManagers(data.project_managers || []);
        } catch (err: any) {
            console.error('Error fetching client:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [clientId, router]);

    // Fetch work orders for this client
    const fetchWorkOrders = useCallback(async () => {
        try {
            const data = await clientsService.getClientWorkOrders(clientId);
            setWorkOrders(data);
        } catch (err: any) {
            console.error('Error fetching work orders:', err);
        }
    }, [clientId]);

    useEffect(() => {
        fetchClient();
        fetchWorkOrders();
    }, [fetchClient, fetchWorkOrders]);

    // Client Update Handler
    const handleUpdateClient = async (formData: ClientFormData) => {
        setSubmitting(true);
        try {
            await clientsService.update(clientId, formData);
            toast.success('Client updated successfully');
            closeEditClient();
            await fetchClient();
        } catch (error: any) {
            toast.error('Failed to update client', { description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    // PM CRUD Handlers
    const handleCreateOrUpdatePM = async (formData: ProjectManagerFormData) => {
        setSubmitting(true);
        try {
            if (editingPM) {
                await clientsService.updateProjectManager(editingPM.id, formData);
                toast.success('Contact updated successfully');
            } else {
                await clientsService.createProjectManager(formData);
                toast.success('Contact added successfully');
            }
            closePMModal();
            await fetchClient();
        } catch (error: any) {
            toast.error('Failed to save contact', { description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePM = async (pm: ProjectManager) => {
        const isConfirmed = await confirm({
            title: 'Delete Contact',
            message: `Are you sure you want to delete "${pm.name}"? This action cannot be undone.`,
            variant: 'danger',
            confirmLabel: 'Delete',
        });

        if (isConfirmed) {
            try {
                await clientsService.deleteProjectManager(pm.id);
                toast.success('Contact deleted');
                await fetchClient();
            } catch (error: any) {
                toast.error('Failed to delete contact', { description: error.message });
            }
        }
    };

    // PM Columns
    const pmColumns: Column<ProjectManager>[] = [
        {
            key: 'name',
            header: 'Name',
            sortable: true,
            render: (item) => (
                <span className="font-medium">{safeRender(item.name)}</span>
            )
        },
        {
            key: 'email',
            header: 'Email',
            render: (item) => (
                item.email ? (
                    <a
                        href={`mailto:${item.email}`}
                        className="text-blue-600 hover:underline"
                    >
                        {safeRender(item.email)}
                    </a>
                ) : (
                    <span className="text-gray-400">—</span>
                )
            )
        },
        {
            key: 'phone',
            header: 'Phone',
            render: (item) => (
                item.phone ? (
                    <a
                        href={`tel:${item.phone}`}
                        className="text-blue-600 hover:underline"
                    >
                        {safeRender(item.phone)}
                    </a>
                ) : (
                    <span className="text-gray-400">—</span>
                )
            )
        },
        {
            key: 'portal',
            header: 'Portal Access',
            render: (item: any) => (
                item.user_profile_id ? (
                    <Badge variant="success" size="sm">Has Portal</Badge>
                ) : (
                    <Badge variant="default" size="sm">No Portal</Badge>
                )
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (item: any) => (
                <div className="flex justify-end gap-2">
                    {canManage && !item.user_profile_id && item.email && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                openPortalModal(item);
                            }}
                        >
                            Create Portal
                        </Button>
                    )}
                    {canUpdate && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                openPMModal(item);
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
                                handleDeletePM(item);
                            }}
                        >
                            Delete
                        </Button>
                    )}
                </div>
            )
        }
    ];

    // Work Order Columns
    const workOrderColumns: Column<WorkOrder>[] = [
        {
            key: 'id',
            header: 'Order ID',
            render: (order) => (
                <span className="font-mono text-xs text-gray-500">
                    {order.id.substring(0, 8)}...
                </span>
            )
        },
        {
            key: 'created_at',
            header: 'Date',
            sortable: true,
            render: (order) => new Date(order.created_at).toLocaleDateString()
        },
        {
            key: 'location',
            header: 'Site Address',
            render: (order) => {
                const location = order.analysis?.location;
                return (
                    <span className="text-gray-600 text-sm">
                        {safeRender(location) || 'N/A'}
                    </span>
                );
            }
        },
        {
            key: 'project_manager',
            header: 'Contact',
            render: (order) => (
                <span className="text-gray-600 text-sm">
                    {order.project_manager?.name || '—'}
                </span>
            )
        },
        {
            key: 'processed',
            header: 'Status',
            render: (order) => (
                <Badge
                    variant={order.processed ? 'success' : 'warning'}
                    size="sm"
                    dot
                >
                    {order.processed ? 'Analyzed' : 'Pending'}
                </Badge>
            )
        },
    ];

    // Loading state
    if (loading && !client) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    // Error state
    if (error || !client) {
        return (
            <div className="space-y-4">
                <Alert variant="error" title="Error">
                    {error?.message || 'Client not found'}
                </Alert>
                <Link href="/dashboard/clients">
                    <Button variant="secondary">Back to Clients</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/clients">
                    <Button variant="ghost" size="sm">
                        ← Back
                    </Button>
                </Link>
            </div>

            {/* Client Info Card */}
            <Card>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{safeRender(client.name)}</h1>
                        {client.address && (
                            <p className="text-gray-500 mt-1">
                                📍 {safeRender(client.address)}
                            </p>
                        )}
                        {client.notes && (
                            <p className="text-gray-600 text-sm mt-2 max-w-xl">
                                {safeRender(client.notes)}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2 items-start">
                        {canUpdate && (
                            <Button
                                variant="secondary"
                                onClick={() => openEditClient(client)}
                            >
                                Edit Client
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('contacts')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'contacts'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Client Contacts ({projectManagers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Work History ({workOrders.length})
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'contacts' && (
                <div className="space-y-4">
                    {canUpdate && (
                        <div className="flex justify-end">
                            <Button onClick={() => openPMModal()} leftIcon={<PlusIcon />}>
                                Add Contact
                            </Button>
                        </div>
                    )}
                    <Card noPadding>
                        <DataTable
                            data={projectManagers}
                            columns={pmColumns}
                            keyExtractor={(pm) => pm.id}
                            loading={loading}
                            emptyMessage="No contacts found"
                            emptyDescription="Add a client contact (Project Manager) to get started."
                            emptyAction={{
                                label: 'Add Contact',
                                onClick: () => openPMModal()
                            }}
                        />
                    </Card>
                </div>
            )}

            {activeTab === 'history' && (
                <Card noPadding>
                    <DataTable
                        data={workOrders}
                        columns={workOrderColumns}
                        keyExtractor={(wo) => wo.id}
                        loading={loading}
                        emptyMessage="No work orders found"
                        emptyDescription="Work orders linked to this client will appear here."
                    />
                </Card>
            )}

            {/* Edit Client Modal */}
            <Modal
                isOpen={isEditClientOpen}
                onClose={closeEditClient}
                title="Edit Client"
                size="md"
                showCloseButton={false}
                footer={null}
            >
                <ClientForm
                    initialData={client}
                    onSubmit={handleUpdateClient}
                    isLoading={submitting}
                    onCancel={closeEditClient}
                />
            </Modal>

            {/* PM Form Modal */}
            <Modal
                isOpen={isPMModalOpen}
                onClose={closePMModal}
                title={editingPM ? 'Edit Contact' : 'Add Client Contact'}
                size="md"
                showCloseButton={false}
                footer={null}
            >
                <ProjectManagerForm
                    clientId={clientId}
                    initialData={editingPM || undefined}
                    onSubmit={handleCreateOrUpdatePM}
                    isLoading={submitting}
                    onCancel={closePMModal}
                />
            </Modal>

            {/* Create Portal Account Modal */}
            <CreatePortalAccountModal
                isOpen={isPortalModalOpen}
                onClose={closePortalModal}
                projectManager={portalPM ?? null}
                onSuccess={fetchClient}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                {...dialogProps}
                loading={loading}
            />
        </div>
    );
}
