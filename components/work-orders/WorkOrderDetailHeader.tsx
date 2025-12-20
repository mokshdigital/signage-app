'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkOrder, JobStatus } from '@/types/database';
import { Button, Badge, Modal, Textarea } from '@/components/ui';
import { ChevronDown, FileText, Sparkles, MoreHorizontal, Edit, Trash2, Link, ArrowLeft, MapPin, Calendar, User, Building2 } from 'lucide-react';
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
                {/* Top Section: Back + Title + Actions */}
                <div className="px-8 py-6 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-6">
                        {/* Left: Back + Title */}
                        <div className="flex items-start gap-4">
                            <button
                                onClick={() => router.push(backUrl)}
                                className="mt-1 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {workOrder.work_order_number
                                            ? safeRender(workOrder.work_order_number)
                                            : 'Work Order'
                                        }
                                    </h1>
                                    {/* Status Dropdown - Inline with title */}
                                    <div className="relative">
                                        <select
                                            value={workOrder.job_status || 'Open'}
                                            onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
                                            disabled={savingStatus || saving}
                                            className={`
                                                ${statusColors[workOrder.job_status || 'Open']} 
                                                px-3 py-1 rounded-full text-sm font-semibold cursor-pointer 
                                                border appearance-none pr-7
                                                focus:ring-2 focus:ring-blue-500 focus:outline-none
                                                disabled:opacity-50 disabled:cursor-not-allowed
                                                transition-colors
                                            `}
                                        >
                                            {JOB_STATUSES.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-60" />
                                    </div>
                                </div>

                                {/* Badges Row */}
                                <div className="flex items-center gap-3">
                                    <Badge
                                        variant={workOrder.processed ? 'success' : 'warning'}
                                        dot
                                        className="text-xs"
                                    >
                                        {workOrder.processed ? 'AI Analyzed' : 'Pending Analysis'}
                                    </Badge>
                                    {workOrder.job_type && (
                                        <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                            {safeRender(workOrder.job_type.name)}
                                        </span>
                                    )}
                                    {/* Show reason if on hold or cancelled */}
                                    {(workOrder.job_status === 'On Hold' || workOrder.job_status === 'Cancelled') && workOrder.job_status_reason && (
                                        <span className="text-sm text-gray-400 italic" title={workOrder.job_status_reason}>
                                            — {safeRender(workOrder.job_status_reason)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onViewFiles}
                                className="shadow-sm"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                View WO
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onViewAISummary}
                                className="shadow-sm bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-blue-100"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                AI Summary
                            </Button>

                            {/* Quick Actions Dropdown */}
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsActionsOpen(!isActionsOpen)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
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
                </div>

                {/* Details Cards Section */}
                <div className="px-8 py-5 bg-gray-50/50">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {/* Client */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Building2 className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium uppercase tracking-wider">Client</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {workOrder.client ? safeRender(workOrder.client.name) : <span className="text-gray-300 font-normal">Not assigned</span>}
                            </p>
                        </div>

                        {/* Project Manager */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <User className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium uppercase tracking-wider">PM</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {workOrder.project_manager ? safeRender(workOrder.project_manager.name) : <span className="text-gray-300 font-normal">—</span>}
                            </p>
                        </div>

                        {/* WO Date */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium uppercase tracking-wider">WO Date</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatDate(workOrder.work_order_date)}
                            </p>
                        </div>

                        {/* Planned Date */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium uppercase tracking-wider">Planned</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatDate(workOrder.planned_date)}
                            </p>
                        </div>

                        {/* WO Owner */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <User className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium uppercase tracking-wider">Owner</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {workOrder.owner?.avatar_url ? (
                                    <img
                                        src={workOrder.owner.avatar_url}
                                        alt=""
                                        className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                                    />
                                ) : workOrder.owner?.display_name ? (
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">
                                        {workOrder.owner.display_name.charAt(0).toUpperCase()}
                                    </div>
                                ) : null}
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {safeRender(workOrder.owner?.display_name) || <span className="text-gray-300 font-normal">—</span>}
                                </p>
                            </div>
                        </div>

                        {/* Site Address - Spans remaining space on larger screens */}
                        <div className="space-y-1.5 col-span-2 md:col-span-3 lg:col-span-1">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium uppercase tracking-wider">Site</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 truncate" title={workOrder.site_address || ''}>
                                {safeRender(workOrder.site_address) || <span className="text-gray-300 font-normal">No address</span>}
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
