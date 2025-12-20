'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkOrder, JobStatus } from '@/types/database';
import { Button, Badge, Modal, Textarea } from '@/components/ui';
import { ChevronDown, FileText, Sparkles, MoreHorizontal, Edit, Trash2, Link, ArrowLeft } from 'lucide-react';
import { safeRender } from '@/lib/utils/helpers';

interface WorkOrderDetailHeaderProps {
    workOrder: WorkOrder;
    onStatusChange: (status: JobStatus, reason?: string) => Promise<void>;
    onViewFiles: () => void;
    onViewAISummary: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onLinkClient?: () => void;
    saving?: boolean;
    backUrl?: string;
}

const JOB_STATUSES: JobStatus[] = ['Open', 'Active', 'On Hold', 'Completed', 'Submitted', 'Invoiced', 'Cancelled'];

const statusColors: Record<JobStatus, string> = {
    'Open': 'bg-blue-100 text-blue-800 border-blue-200',
    'Active': 'bg-green-100 text-green-800 border-green-200',
    'On Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Completed': 'bg-purple-100 text-purple-800 border-purple-200',
    'Submitted': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Invoiced': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Cancelled': 'bg-red-100 text-red-800 border-red-200'
};

export function WorkOrderDetailHeader({
    workOrder,
    onStatusChange,
    onViewFiles,
    onViewAISummary,
    onEdit,
    onDelete,
    onLinkClient,
    saving = false,
    backUrl = '/dashboard/work-orders-v2'
}: WorkOrderDetailHeaderProps) {
    const router = useRouter();
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<JobStatus | null>(null);
    const [statusReason, setStatusReason] = useState('');
    const [savingStatus, setSavingStatus] = useState(false);

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleStatusChange = async (newStatus: JobStatus) => {
        if (newStatus === 'On Hold' || newStatus === 'Cancelled') {
            setPendingStatus(newStatus);
            setStatusReason('');
            setIsStatusModalOpen(true);
            return;
        }

        setSavingStatus(true);
        try {
            await onStatusChange(newStatus);
        } finally {
            setSavingStatus(false);
        }
    };

    const handleStatusReasonSubmit = async () => {
        if (!pendingStatus || !statusReason.trim()) return;

        setSavingStatus(true);
        try {
            await onStatusChange(pendingStatus, statusReason.trim());
            setIsStatusModalOpen(false);
            setPendingStatus(null);
            setStatusReason('');
        } finally {
            setSavingStatus(false);
        }
    };

    return (
        <>
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="px-6 py-4">
                    {/* Top Row: Back button + Title + Badges */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(backUrl)}
                                className="p-1"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {workOrder.work_order_number
                                        ? `WO: ${safeRender(workOrder.work_order_number)}`
                                        : 'Work Order Details'
                                    }
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={workOrder.processed ? 'success' : 'warning'} dot>
                                        {workOrder.processed ? 'AI Analyzed' : 'Pending Analysis'}
                                    </Badge>
                                    {workOrder.job_type && (
                                        <Badge variant="default">{safeRender(workOrder.job_type.name)}</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" onClick={onViewFiles}>
                                <FileText className="w-4 h-4 mr-1" />
                                View WO
                            </Button>
                            <Button variant="secondary" size="sm" onClick={onViewAISummary}>
                                <Sparkles className="w-4 h-4 mr-1" />
                                AI Summary
                            </Button>

                            {/* Quick Actions Dropdown */}
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsActionsOpen(!isActionsOpen)}
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                                {isActionsOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setIsActionsOpen(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-40">
                                            <button
                                                onClick={() => { onEdit(); setIsActionsOpen(false); }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Edit Details
                                            </button>
                                            {!workOrder.client_id && onLinkClient && (
                                                <button
                                                    onClick={() => { onLinkClient(); setIsActionsOpen(false); }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Link className="w-4 h-4" />
                                                    Link to Client
                                                </button>
                                            )}
                                            <div className="border-t border-gray-100 my-1" />
                                            <button
                                                onClick={() => { onDelete(); setIsActionsOpen(false); }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Work Order
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Client</p>
                            <p className="font-medium text-gray-900 truncate">
                                {workOrder.client ? safeRender(workOrder.client.name) : <span className="text-gray-400">-</span>}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Project Manager</p>
                            <p className="font-medium text-gray-900 truncate">
                                {workOrder.project_manager ? safeRender(workOrder.project_manager.name) : <span className="text-gray-400">-</span>}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Job Type</p>
                            <p className="font-medium text-gray-900 truncate">
                                {workOrder.job_type ? safeRender(workOrder.job_type.name) : <span className="text-gray-400">-</span>}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide">WO Date</p>
                            <p className="font-medium text-gray-900">{formatDate(workOrder.work_order_date)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Planned Date</p>
                            <p className="font-medium text-gray-900">{formatDate(workOrder.planned_date)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide">WO Owner</p>
                            <div className="flex items-center gap-2">
                                {workOrder.owner?.avatar_url ? (
                                    <img
                                        src={workOrder.owner.avatar_url}
                                        alt=""
                                        className="w-5 h-5 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                                        {workOrder.owner?.display_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                )}
                                <p className="font-medium text-gray-900 truncate">
                                    {safeRender(workOrder.owner?.display_name) || <span className="text-gray-400">-</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Site Address + Status Row */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <div className="flex-1 min-w-0 mr-4">
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Site Address</p>
                            <p className="font-medium text-gray-900 truncate">
                                {safeRender(workOrder.site_address) || <span className="text-gray-400">No address</span>}
                            </p>
                        </div>

                        {/* Job Status Dropdown */}
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 text-xs uppercase tracking-wide">Status:</span>
                            <div className="relative">
                                <select
                                    value={workOrder.job_status || 'Open'}
                                    onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
                                    disabled={savingStatus || saving}
                                    className={`
                    ${statusColors[workOrder.job_status || 'Open']} 
                    px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer 
                    border appearance-none pr-8 
                    focus:ring-2 focus:ring-blue-500 focus:outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                                >
                                    {JOB_STATUSES.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                            </div>

                            {/* Show reason if on hold or cancelled */}
                            {(workOrder.job_status === 'On Hold' || workOrder.job_status === 'Cancelled') && workOrder.job_status_reason && (
                                <span className="text-sm text-gray-500 italic max-w-[200px] truncate" title={workOrder.job_status_reason}>
                                    ({safeRender(workOrder.job_status_reason)})
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Reason Modal */}
            <Modal
                isOpen={isStatusModalOpen}
                onClose={() => { setIsStatusModalOpen(false); setPendingStatus(null); }}
                title={`Change Status to ${pendingStatus}`}
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Please provide a reason for changing the status to <strong>{pendingStatus}</strong>.
                    </p>
                    <Textarea
                        value={statusReason}
                        onChange={(e) => setStatusReason(e.target.value)}
                        placeholder="Enter reason..."
                        rows={3}
                    />
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => { setIsStatusModalOpen(false); setPendingStatus(null); }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStatusReasonSubmit}
                            loading={savingStatus}
                            disabled={!statusReason.trim()}
                        >
                            Confirm
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
