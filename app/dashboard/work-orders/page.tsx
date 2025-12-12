'use client';

import { useState, useCallback } from 'react';
import { WorkOrder, WorkOrderFile } from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { useCrud, useModal, useConfirmDialog } from '@/hooks';
import { Button, Card, Badge, ConfirmDialog, Alert, LoadingOverlay } from '@/components/ui';
import { DataTable, Column } from '@/components/tables';
import {
    WorkOrderUploadForm,
    WorkOrderFilesModal,
    WorkOrderAnalysisModal
} from '@/components/work-orders';
import { toast } from '@/components/providers';

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

    const [workOrderFiles, setWorkOrderFiles] = useState<WorkOrderFile[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // Delete Confirmation Hook
    const { confirm, dialogProps } = useConfirmDialog();

    // Specific states for complex actions
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

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

    // Columns Definition
    const columns: Column<WorkOrder>[] = [
        {
            key: 'id',
            header: 'ID',
            render: (order) => (
                <span className="font-mono text-xs text-gray-500" title={order.id}>
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
                <div className="flex justify-end gap-2">
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
