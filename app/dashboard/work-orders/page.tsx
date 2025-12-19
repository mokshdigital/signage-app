'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { WorkOrder, WorkOrderFile, Client, ProjectManager, JobType, JobStatus } from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { clientsService } from '@/services/clients.service';
import { useCrud, useModal, useConfirmDialog } from '@/hooks';
import { Button, Card, Badge, ConfirmDialog, Alert, LoadingOverlay, Modal, LoadingSpinner, Input } from '@/components/ui';
import { DataTable, Column } from '@/components/tables';
import { Search, Filter, X } from 'lucide-react';
import {
    WorkOrderUploadForm,
    WorkOrderFilesModal,
    WorkOrderAnalysisModal
} from '@/components/work-orders';
import { toast } from '@/components/providers';
import { safeRender } from '@/lib/utils/helpers';
import { formatTableDate } from '@/lib/utils/formatters';

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

    // Upload Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Map of user IDs to profiles for "Uploaded By" column
    const [uploaders, setUploaders] = useState<Record<string, { name: string }>>({});

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'all' as 'all' | 'analyzed' | 'pending',
        jobType: 'all',
        client: 'all',
        jobStatus: 'all' as 'all' | JobStatus,
        date: ''
    });
    const [jobTypes, setJobTypes] = useState<JobType[]>([]);

    // Fetch initial data (clients, job types)
    useEffect(() => {
        const loadFilterData = async () => {
            // Load Clients if not already loaded
            if (clients.length === 0) {
                try {
                    const data = await clientsService.getAll();
                    setClients(data);
                } catch (error) {
                    console.error('Failed to load clients', error);
                }
            }
            // Load Job Types
            try {
                const types = await workOrdersService.getJobTypes();
                setJobTypes(types);
            } catch (error) {
                console.error('Failed to load job types', error);
            }
        };
        loadFilterData();
    }, []);

    // Filter Logic
    const filteredOrders = useMemo(() => {
        return workOrders.filter(order => {
            // Text Search
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                (order.work_order_number?.toLowerCase().includes(searchLower)) ||
                (order.site_address?.toLowerCase().includes(searchLower)) ||
                (order.client?.name?.toLowerCase().includes(searchLower)) ||
                (order.uploaded_by && uploaders[order.uploaded_by]?.name?.toLowerCase().includes(searchLower));

            // Status Filter
            const matchesStatus = filters.status === 'all' ||
                (filters.status === 'analyzed' && order.processed) ||
                (filters.status === 'pending' && !order.processed);

            // Job Type Filter
            const matchesJobType = filters.jobType === 'all' || order.job_type_id === filters.jobType;

            // Client Filter
            const matchesClient = filters.client === 'all' || order.client_id === filters.client;

            // Date Filter
            let matchesDate = true;
            if (filters.date) {
                const orderDate = new Date(order.created_at).toISOString().split('T')[0];
                matchesDate = orderDate === filters.date;
            }

            // Job Status Filter
            const matchesJobStatus = filters.jobStatus === 'all' || order.job_status === filters.jobStatus;

            return matchesSearch && matchesStatus && matchesJobType && matchesClient && matchesDate && matchesJobStatus;
        });
    }, [workOrders, searchTerm, filters, uploaders]);

    const clearFilters = () => {
        setSearchTerm('');
        setFilters({
            status: 'all',
            jobType: 'all',
            client: 'all',
            jobStatus: 'all',
            date: ''
        });
    };

    // Fetch uploaders when work orders change
    useEffect(() => {
        if (workOrders.length > 0) {
            const userIds = Array.from(new Set(workOrders.map(o => o.uploaded_by).filter(Boolean))) as string[];
            if (userIds.length > 0) {
                workOrdersService.getUserProfiles(userIds).then(setUploaders);
            }
        }
    }, [workOrders]);

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
    const handleUpload = async (mainFile: File, associatedFiles: File[], shipmentStatus?: string) => {
        setIsUploading(true);
        setUploadError(null);
        try {
            // 1. Create work order with owner and shipment status
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const order = await workOrdersService.create({
                uploaded_by: user?.id || null,
                owner_id: user?.id || null,
                shipment_status: shipmentStatus || null,
                job_status: 'Open'
            });

            // 2. Upload files
            const allFiles = [mainFile, ...associatedFiles];
            await workOrdersService.uploadFiles(order.id, allFiles);

            // 3. Trigger AI Processing
            setIsProcessing(true);
            const processResult = await workOrdersService.processWithAI(order.id);

            if (!processResult.success) {
                toast.warning('Work order uploaded but AI processing failed', {
                    description: processResult.error
                });
            } else {
                toast.success('Work order uploaded and analyzed');
            }

            setIsUploadModalOpen(false);
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
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline block"
                >
                    {order.work_order_number || <span className="text-gray-400 italic">No #</span>}
                </Link>
            )
        },
        {
            key: 'job_type',
            header: 'Job Type',
            render: (order) => (
                <span className="text-sm text-gray-700">
                    {order.job_type?.name || '-'}
                </span>
            )
        },
        {
            key: 'site_address',
            header: 'Site Address',
            render: (order) => (
                <span className="truncate max-w-[200px] block text-sm" title={order.site_address || ''}>
                    {safeRender(order.site_address) || '-'}
                </span>
            )
        },
        {
            key: 'client',
            header: 'Client Name',
            render: (order) => {
                if (order.client) {
                    return <span className="font-medium text-gray-900">{order.client.name}</span>;
                }
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openAssignModal(order);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                    >
                        Assign Client
                    </button>
                );
            }
        },
        {
            key: 'job_status',
            header: 'Status',
            render: (order) => {
                const statusColors: Record<string, string> = {
                    'Open': 'bg-blue-100 text-blue-800',
                    'Active': 'bg-green-100 text-green-800',
                    'On Hold': 'bg-yellow-100 text-yellow-800',
                    'Completed': 'bg-purple-100 text-purple-800',
                    'Submitted': 'bg-indigo-100 text-indigo-800',
                    'Invoiced': 'bg-emerald-100 text-emerald-800',
                    'Cancelled': 'bg-red-100 text-red-800'
                };
                const colorClass = statusColors[order.job_status] || 'bg-gray-100 text-gray-800';
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                        {order.job_status || 'Open'}
                    </span>
                );
            }
        },
        {
            key: 'uploaded_by',
            header: 'Uploaded By',
            render: (order) => {
                const uploaderName = order.uploaded_by ? uploaders[order.uploaded_by]?.name : null;
                return (
                    <span className="text-sm text-gray-600">
                        {uploaderName || (order.uploaded_by ? 'User' : '-')}
                    </span>
                );
            }
        },
        {
            key: 'created_at',
            header: 'Uploaded Date',
            sortable: true,
            render: (order) => <span className="text-sm text-gray-600">{formatTableDate(order.created_at)}</span>
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
                <Button onClick={() => setIsUploadModalOpen(true)}>+ Work Order</Button>
            </div>

            {(crudError || uploadError) && (
                <Alert variant="error" title="Error" dismissible onDismiss={() => setUploadError(null)}>
                    {crudError?.message || uploadError}
                </Alert>
            )}

            {/* Filters Toolbar */}
            <Card noPadding className="mb-6 p-4">
                <div className="space-y-4">
                    {/* Search Row */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search by WO #, Address, Client, or Uploader..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filters:</span>
                        </div>

                        {/* Status Filter */}
                        <select
                            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                        >
                            <option value="all">All Status</option>
                            <option value="analyzed">Analyzed</option>
                            <option value="pending">Pending</option>
                        </select>

                        {/* Job Type Filter */}
                        <select
                            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                            value={filters.jobType}
                            onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                        >
                            <option value="all">All Job Types</option>
                            {jobTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>

                        {/* Client Filter */}
                        <select
                            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                            value={filters.client}
                            onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                        >
                            <option value="all">All Clients</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>

                        {/* Job Status Filter */}
                        <select
                            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                            value={filters.jobStatus}
                            onChange={(e) => setFilters({ ...filters, jobStatus: e.target.value as any })}
                        >
                            <option value="all">All Job Status</option>
                            <option value="Open">Open</option>
                            <option value="Active">Active</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Completed">Completed</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Invoiced">Invoiced</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>

                        {/* Date Filter */}
                        <input
                            type="date"
                            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                            value={filters.date}
                            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                        />

                        {/* Clear Filters Button */}
                        {(searchTerm || filters.status !== 'all' || filters.jobType !== 'all' || filters.client !== 'all' || filters.jobStatus !== 'all' || filters.date) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="ml-auto text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Main List */}
            <Card noPadding>
                <DataTable
                    data={filteredOrders}
                    columns={columns}
                    keyExtractor={(o) => o.id}
                    loading={loadingOrders}
                    emptyMessage="No matching work orders found"
                    emptyDescription="Try adjusting your filters or search terms."
                />
            </Card>

            {/* Modals */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Upload Work Order"
                size="xl"
            >
                <WorkOrderUploadForm
                    onSubmit={handleUpload}
                    isLoading={isUploading}
                />
            </Modal>

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
