'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { WorkOrder, WorkOrderFile, Client, ProjectManager } from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { clientsService } from '@/services/clients.service';
import { useCrud, useModal, useConfirmDialog } from '@/hooks';
import { Button, Card, Badge, ConfirmDialog, Alert, LoadingOverlay, Modal, LoadingSpinner } from '@/components/ui';
import { DataTable, Column } from '@/components/tables';
import {
    WorkOrderUploadForm,
    WorkOrderFilesModal,
    WorkOrderAnalysisModal
} from '@/components/work-orders';
import { toast } from '@/components/providers';
import { safeRender } from '@/lib/utils/helpers';

export default function WorkOrdersPage() {
    // CRUD Hook
    const {
        items: workOrders,
        loading: loadingOrders,
        error: crudError,
        deleteItem,
        refresh
    } = useCrud<WorkOrder>(workOrdersService);

    // AI Analysis Modal State
    const {
        isOpen: isAnalysisOpen,
        open: openAnalysis,
        close: closeAnalysis,
        data: analysisData
    } = useModal<any>();

    // Files Modal State
    const {
        isOpen: isFilesOpen,
        open: openFilesModal,
        close: closeFilesModal,
        data: selectedWorkOrderId
    } = useModal<string>(); // We store just the ID to fetch files

    // Client Assignment Modal State
    const {
        isOpen: isAssignOpen,
        open: openAssignModal,
        close: closeAssignModal,
        data: assigningWorkOrder
    } = useModal<WorkOrder>();

    const [workOrderFiles, setWorkOrderFiles] = useState<WorkOrderFile[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // Delete Confirmation Hook
    const { confirm, dialogProps } = useConfirmDialog();

    // Specific states for complex actions
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Client Assignment States
    const [clients, setClients] = useState<Client[]>([]);
    const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [selectedPMId, setSelectedPMId] = useState<string>('');
    const [loadingClients, setLoadingClients] = useState(false);
    const [loadingPMs, setLoadingPMs] = useState(false);
    const [assigning, setAssigning] = useState(false);

    // Fetch clients when assign modal opens
    useEffect(() => {
        if (isAssignOpen) {
            fetchClients();
            setSelectedClientId('');
            setSelectedPMId('');
            setProjectManagers([]);
        }
    }, [isAssignOpen]);

    // Fetch PMs when client is selected
    useEffect(() => {
        if (selectedClientId) {
            fetchProjectManagers(selectedClientId);
        } else {
            setProjectManagers([]);
            setSelectedPMId('');
        }
    }, [selectedClientId]);

    const fetchClients = async () => {
        setLoadingClients(true);
        try {
            const data = await clientsService.getAll();
            setClients(data);
        } catch (error: any) {
            toast.error('Failed to load clients');
        } finally {
            setLoadingClients(false);
        }
    };

    const fetchProjectManagers = async (clientId: string) => {
        setLoadingPMs(true);
        try {
            const data = await clientsService.getProjectManagers(clientId);
            setProjectManagers(data);
        } catch (error: any) {
            toast.error('Failed to load contacts');
        } finally {
            setLoadingPMs(false);
        }
    };

    // Fetch files when opening files modal
    const handleViewFiles = useCallback(async (workOrderId: string) => {
        openFilesModal(workOrderId);
        setLoadingFiles(true);
        try {
            const files = await workOrdersService.getFiles(workOrderId);
            setWorkOrderFiles(files);
        } catch (error: any) {
            toast.error('Failed to load files', { description: error.message });
        } finally {
            setLoadingFiles(false);
        }
    }, [openFilesModal]);

    // Handle Upload and Process
    const handleUpload = async (mainFile: File, associatedFiles: File[]) => {
        setIsUploading(true);
        setUploadError(null);
        try {
            // 1. Create work order
            // TODO: Get real user ID from auth context
            const order = await workOrdersService.create({ uploaded_by: null });

            // 2. Upload files
            const allFiles = [mainFile, ...associatedFiles];
            await workOrdersService.uploadFiles(order.id, allFiles);

            // 3. Trigger AI Processing
            // We do this in the background or await it? Let's await it to show immediate result
            setIsProcessing(true); // Show processing overlay
            const processResult = await workOrdersService.processWithAI(order.id);

            if (!processResult.success) {
                toast.warning('Work order uploaded but AI processing failed', {
                    description: processResult.error
                });
            } else {
                toast.success('Work order uploaded and analyzed');
            }

            // Refresh list
            await refresh();
        } catch (error: any) {
            toast.error('Upload failed', { description: error.message });
            setUploadError(error.message || 'Failed to upload work order');
        } finally {
            setIsUploading(false);
            setIsProcessing(false);
        }
    };

    const handleDelete = async (order: WorkOrder) => {
        const isConfirmed = await confirm({
            title: 'Delete Work Order',
            message: `Are you sure you want to delete this work order? This will also remove all associated files.`,
            variant: 'danger',
            confirmLabel: 'Delete',
        });

        if (isConfirmed) {
            try {
                await deleteItem(order.id);
                toast.success('Work order deleted');
            } catch (error: any) {
                toast.error('Failed to delete work order', { description: error.message });
            }
        }
    };

    // Handle client assignment
    const handleAssignClient = async () => {
        if (!assigningWorkOrder || !selectedClientId) return;

        setAssigning(true);
        try {
            await clientsService.assignWorkOrder(
                assigningWorkOrder.id,
                selectedClientId,
                selectedPMId || null
            );
            toast.success('Work order assigned to client');
            closeAssignModal();
            await refresh();
        } catch (error: any) {
            toast.error('Failed to assign work order', { description: error.message });
        } finally {
            setAssigning(false);
        }
    };

    // Handle unassigning a work order
    const handleUnassign = async (order: WorkOrder) => {
        const isConfirmed = await confirm({
            title: 'Unassign Client',
            message: 'Are you sure you want to remove the client assignment from this work order?',
            variant: 'warning',
            confirmLabel: 'Unassign',
        });

        if (isConfirmed) {
            try {
                await clientsService.unassignWorkOrder(order.id);
                toast.success('Client unassigned from work order');
                await refresh();
            } catch (error: any) {
                toast.error('Failed to unassign work order', { description: error.message });
            }
        }
    };

    // Columns Definition
    const columns: Column<WorkOrder>[] = [
        {
            key: 'work_order_number',
            header: 'WO #',
            sortable: true,
            render: (order) => (
                <Link
                    href={`/dashboard/work-orders/${order.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left block"
                >
                    {order.work_order_number || <span className="text-gray-400 italic">No # ({order.id.slice(0, 6)})</span>}
                </Link>
            )
        },
        {
            key: 'site_address',
            header: 'Site Address',
            render: (order) => (
                <span className="truncate max-w-[200px] block" title={order.site_address || ''}>
                    {safeRender(order.site_address) || '-'}
                </span>
            )
        },
        {
            key: 'work_order_date',
            header: 'WO Date',
            sortable: true,
            render: (order) => order.work_order_date
                ? new Date(order.work_order_date).toLocaleDateString()
                : <span className="text-gray-400 text-xs">-</span>
        },
        {
            key: 'created_at',
            header: 'Uploaded',
            sortable: true,
            render: (order) => <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
        },
        {
            key: 'client',
            header: 'Client',
            render: (order) => {
                if (order.client_id) {
                    return (
                        <Badge variant="info" size="sm">
                            Assigned
                        </Badge>
                    );
                }
                return (
                    <span className="text-gray-400 text-sm">Unassigned</span>
                );
            }
        },
        {
            key: 'processed',
            header: 'AI Status',
            sortable: true,
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
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (order) => (
                <div className="flex justify-end gap-2 flex-wrap">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewFiles(order.id);
                        }}
                    >
                        Files
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={!order.processed}
                        onClick={(e) => {
                            e.stopPropagation();
                            openAnalysis(order.analysis);
                        }}
                    >
                        Analysis
                    </Button>
                    {!order.client_id ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                openAssignModal(order);
                            }}
                        >
                            Link Client
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleUnassign(order);
                            }}
                        >
                            Unlink
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(order);
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
            <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>

            {(crudError || uploadError) && (
                <Alert variant="error" title="Error" dismissible onDismiss={() => setUploadError(null)}>
                    {crudError?.message || uploadError}
                </Alert>
            )}

            {/* Upload Form */}
            <WorkOrderUploadForm
                onSubmit={handleUpload}
                isLoading={isUploading}
            />

            {/* Main List */}
            <Card noPadding title={`Recent Orders (${workOrders.length})`}>
                <DataTable
                    data={workOrders}
                    columns={columns}
                    keyExtractor={(o) => o.id}
                    loading={loadingOrders}
                    emptyMessage="No work orders found"
                    emptyDescription="Upload a work order above to see it here."
                />
            </Card>

            {/* Modals */}
            <WorkOrderFilesModal
                isOpen={isFilesOpen}
                onClose={closeFilesModal}
                files={workOrderFiles}
                loading={loadingFiles}
            />

            <WorkOrderAnalysisModal
                isOpen={isAnalysisOpen}
                onClose={closeAnalysis}
                analysis={analysisData}
            />

            {/* Client Assignment Modal */}
            <Modal
                isOpen={isAssignOpen}
                onClose={closeAssignModal}
                title="Link Work Order to Client"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Select a client and optionally assign a contact (Project Manager) to this work order.
                    </p>

                    {/* Client Select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client *
                        </label>
                        {loadingClients ? (
                            <div className="flex items-center gap-2 py-2">
                                <LoadingSpinner />
                                <span className="text-sm text-gray-500">Loading clients...</span>
                            </div>
                        ) : (
                            <select
                                value={selectedClientId}
                                onChange={(e) => setSelectedClientId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select a client...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {safeRender(client.name)}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* PM Select - only shows when client is selected */}
                    {selectedClientId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Client Contact (Optional)
                            </label>
                            {loadingPMs ? (
                                <div className="flex items-center gap-2 py-2">
                                    <LoadingSpinner />
                                    <span className="text-sm text-gray-500">Loading contacts...</span>
                                </div>
                            ) : projectManagers.length === 0 ? (
                                <p className="text-sm text-gray-500 py-2">
                                    No contacts found for this client.
                                </p>
                            ) : (
                                <select
                                    value={selectedPMId}
                                    onChange={(e) => setSelectedPMId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">No specific contact</option>
                                    {projectManagers.map(pm => (
                                        <option key={pm.id} value={pm.id}>
                                            {safeRender(pm.name)} {pm.email ? `(${pm.email})` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button
                            variant="secondary"
                            onClick={closeAssignModal}
                            disabled={assigning}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssignClient}
                            loading={assigning}
                            disabled={!selectedClientId}
                        >
                            Link to Client
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                {...dialogProps}
                loading={loadingOrders}
            />

            {isProcessing && (
                <LoadingOverlay text="Analyzing Work Order with AI..." />
            )}
        </div>
    );
}
