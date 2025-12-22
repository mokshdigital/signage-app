'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkOrder, JobStatus } from '@/types/database';
import { Button, Badge, Modal, Textarea } from '@/components/ui';
import {
    ChevronDown,
    FileText,
    Sparkles,
    MoreHorizontal,
    Edit,
    Trash2,
    Link,
    ArrowLeft,
    MapPin,
    Calendar,
    User,
    Building2
} from 'lucide-react';
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

const statusConfig: Record<JobStatus, { bg: string; text: string; border: string }> = {
    'Open': { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-500' },
    'Active': { bg: 'bg-green-500', text: 'text-white', border: 'border-green-500' },
    'On Hold': { bg: 'bg-yellow-500', text: 'text-white', border: 'border-yellow-500' },
    'Completed': { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-500' },
    'Submitted': { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-500' },
    'Invoiced': { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-500' },
    'Cancelled': { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500' }
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
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: 'numeric',
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

    const currentStatus = workOrder.job_status || 'Open';
    const statusStyle = statusConfig[currentStatus];

    return (
        <>
            <div className="bg-white sticky top-0 z-20 border-b border-gray-200">
                <div className="max-w-[1600px] mx-auto px-8 lg:px-12">

                    {/* Row 1: Back + Actions */}
                    <div className="flex items-center justify-between py-6">
                        <button
                            onClick={() => router.push(backUrl)}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back to Work Orders</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onViewFiles}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                View WO
                            </button>
                            <button
                                onClick={onViewAISummary}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                                <Sparkles className="w-4 h-4" />
                                AI Summary
                            </button>

                            {/* More Actions */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsActionsOpen(!isActionsOpen)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                {isActionsOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setIsActionsOpen(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-40">
                                            <button
                                                onClick={() => { onEdit(); setIsActionsOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <Edit className="w-4 h-4 text-gray-400" />
                                                Edit Details
                                            </button>
                                            {!workOrder.client_id && onLinkClient && (
                                                <button
                                                    onClick={() => { onLinkClient(); setIsActionsOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Link className="w-4 h-4 text-gray-400" />
                                                    Link to Client
                                                </button>
                                            )}
                                            <div className="border-t border-gray-100 my-2" />
                                            <button
                                                onClick={() => { onDelete(); setIsActionsOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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

                    {/* Row 2: WO Number + Status */}
                    <div className="pb-5">
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                {workOrder.work_order_number
                                    ? safeRender(workOrder.work_order_number)
                                    : 'Work Order'
                                }
                            </h1>

                            {/* Status Dropdown Button */}
                            <div className="relative">
                                <select
                                    value={currentStatus}
                                    onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
                                    disabled={savingStatus || saving}
                                    className={`
                                        ${statusStyle.bg} ${statusStyle.text}
                                        px-4 py-1.5 rounded-lg text-sm font-semibold cursor-pointer 
                                        border-0 appearance-none pr-8
                                        focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:outline-none
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        transition-colors
                                    `}
                                >
                                    {JOB_STATUSES.map(status => (
                                        <option key={status} value={status} className="bg-white text-gray-900">
                                            {status}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-white/80" />
                            </div>
                        </div>

                        {/* Job Type + AI Status */}
                        <div className="flex items-center gap-3">
                            <Badge
                                variant={workOrder.processed ? 'success' : 'warning'}
                                dot
                            >
                                {workOrder.processed ? 'AI Analyzed' : 'Pending Analysis'}
                            </Badge>
                            {workOrder.job_type && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-sm text-gray-600">{safeRender(workOrder.job_type.name)}</span>
                                </>
                            )}
                            {(workOrder.job_status === 'On Hold' || workOrder.job_status === 'Cancelled') && workOrder.job_status_reason && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-sm italic text-gray-400" title={workOrder.job_status_reason}>
                                        {safeRender(workOrder.job_status_reason)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Row 3: Details Grid - 6 Columns */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-5 py-6 border-t border-gray-100">
                        {/* Client */}
                        <div className="pr-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Client</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                                {workOrder.client ? safeRender(workOrder.client.name) : <span className="text-gray-400 font-normal">—</span>}
                            </p>
                        </div>

                        {/* Project Manager */}
                        <div className="pr-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Project Manager</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                                {workOrder.project_manager ? safeRender(workOrder.project_manager.name) : <span className="text-gray-400 font-normal">—</span>}
                            </p>
                        </div>

                        {/* WO Date */}
                        <div className="pr-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">WO Date</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatDate(workOrder.work_order_date)}
                            </p>
                        </div>

                        {/* Planned Date */}
                        <div className="pr-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Planned Date</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatDate(workOrder.planned_date)}
                            </p>
                        </div>

                        {/* Owner */}
                        <div className="pr-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Owner</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {workOrder.owner?.avatar_url ? (
                                    <img
                                        src={workOrder.owner.avatar_url}
                                        alt=""
                                        className="w-6 h-6 rounded-full object-cover"
                                    />
                                ) : workOrder.owner?.display_name ? (
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                        {workOrder.owner.display_name.charAt(0).toUpperCase()}
                                    </div>
                                ) : null}
                                <p className="text-sm font-semibold text-gray-900">
                                    {safeRender(workOrder.owner?.display_name) || <span className="text-gray-400 font-normal">—</span>}
                                </p>
                            </div>
                        </div>

                        {/* Site Address */}
                        <div>
                            <div className="flex items-center gap-1.5 mb-2">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Site Address</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 truncate" title={workOrder.site_address || ''}>
                                {safeRender(workOrder.site_address) || <span className="text-gray-400 font-normal">—</span>}
                            </p>
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
