'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WorkOrder, JobStatus } from '@/types/database';
import { Button, Badge, Modal, Textarea } from '@/components/ui';
import {
    ChevronDown,
    ChevronUp,
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

const statusConfig: Record<JobStatus, { bg: string; text: string }> = {
    'Open': { bg: 'bg-blue-500', text: 'text-white' },
    'Active': { bg: 'bg-green-500', text: 'text-white' },
    'On Hold': { bg: 'bg-yellow-500', text: 'text-white' },
    'Completed': { bg: 'bg-purple-500', text: 'text-white' },
    'Submitted': { bg: 'bg-indigo-500', text: 'text-white' },
    'Invoiced': { bg: 'bg-emerald-500', text: 'text-white' },
    'Cancelled': { bg: 'bg-red-500', text: 'text-white' }
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

    // Collapse on scroll logic
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [manuallyExpanded, setManuallyExpanded] = useState(false);
    const lastScrollY = useRef(0);
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Find the actual scroll container (main element in dashboard layout)
        const scrollContainer = document.querySelector('main.overflow-y-auto') as HTMLElement | null;
        if (!scrollContainer) return;

        let ticking = false;
        let lastChangeTime = 0;
        const cooldownMs = 300; // Prevent rapid toggling
        const collapseThreshold = 150; // Scroll down this far to collapse
        const expandThreshold = 50; // Scroll up to this point to expand

        const handleScroll = () => {
            if (ticking) return;

            ticking = true;
            requestAnimationFrame(() => {
                // Don't auto-collapse if user manually expanded
                if (manuallyExpanded) {
                    ticking = false;
                    return;
                }

                const currentScrollY = scrollContainer.scrollTop;
                const now = Date.now();

                // Cooldown check - prevent rapid toggling
                if (now - lastChangeTime < cooldownMs) {
                    ticking = false;
                    return;
                }

                // Use hysteresis: different thresholds for collapse vs expand
                if (!isCollapsed && currentScrollY > collapseThreshold && currentScrollY > lastScrollY.current + 30) {
                    // Scrolling down past threshold - collapse
                    setIsCollapsed(true);
                    lastChangeTime = now;
                } else if (isCollapsed && currentScrollY < expandThreshold) {
                    // Near top - expand
                    setIsCollapsed(false);
                    setManuallyExpanded(false);
                    lastChangeTime = now;
                } else if (isCollapsed && currentScrollY < lastScrollY.current - 50) {
                    // Scrolling up significantly - expand
                    setIsCollapsed(false);
                    lastChangeTime = now;
                }

                lastScrollY.current = currentScrollY;
                ticking = false;
            });
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [manuallyExpanded, isCollapsed]);

    const toggleCollapse = () => {
        if (isCollapsed) {
            setIsCollapsed(false);
            setManuallyExpanded(true);
        } else {
            setIsCollapsed(true);
            setManuallyExpanded(false);
        }
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateShort = (dateStr: string | null | undefined) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short'
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
            <div
                ref={headerRef}
                className="bg-white sticky top-0 z-20 transition-all duration-300 ease-in-out"
            >
                {/* ═══════════════════════════════════════════════════════════════════
                    COLLAPSED VIEW - Single Row
                ═══════════════════════════════════════════════════════════════════ */}
                <div className={`
                    border-b border-gray-200 overflow-hidden transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}
                `}>
                    <div className="max-w-[1600px] mx-auto px-8 lg:px-12 py-4">
                        <div className="flex items-center justify-between gap-4">
                            {/* Left: Back + WO Number + Status */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => router.push(backUrl)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>

                                <h2 className="text-xl font-bold text-gray-900">
                                    {workOrder.work_order_number
                                        ? safeRender(workOrder.work_order_number)
                                        : 'Work Order'
                                    }
                                </h2>

                                <div className="relative">
                                    <select
                                        value={currentStatus}
                                        onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
                                        disabled={savingStatus || saving}
                                        className={`
                                            ${statusStyle.bg} ${statusStyle.text}
                                            px-3 py-1 rounded-md text-xs font-semibold cursor-pointer 
                                            border-0 appearance-none pr-6
                                            focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:outline-none
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                        `}
                                    >
                                        {JOB_STATUSES.map(status => (
                                            <option key={status} value={status} className="bg-white text-gray-900">
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-white/80" />
                                </div>

                                {/* Quick info */}
                                <span className="text-sm text-gray-400 hidden md:inline">
                                    {workOrder.client ? safeRender(workOrder.client.name) : ''}
                                    {workOrder.client && workOrder.planned_date ? ' • ' : ''}
                                    {workOrder.planned_date ? formatDateShort(workOrder.planned_date) : ''}
                                </span>
                            </div>

                            {/* Right: Actions + Expand */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onViewFiles}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="View WO"
                                >
                                    <FileText className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={onViewAISummary}
                                    className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="AI Summary"
                                >
                                    <Sparkles className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={toggleCollapse}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Expand header"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════════
                    EXPANDED VIEW - Full Layout
                ═══════════════════════════════════════════════════════════════════ */}
                <div className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'}
                `}>
                    {/* ROW 1: Navigation + Actions */}
                    <div className="border-b border-gray-100">
                        <div className="max-w-[1600px] mx-auto px-8 lg:px-12 py-5">
                            <div className="flex items-center justify-between">
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

                                    <div className="relative">
                                        <button
                                            onClick={() => setIsActionsOpen(!isActionsOpen)}
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                        {isActionsOpen && (
                                            <>
                                                <div className="fixed inset-0 z-30" onClick={() => setIsActionsOpen(false)} />
                                                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-40">
                                                    <button
                                                        onClick={() => { onEdit(); setIsActionsOpen(false); }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                                    >
                                                        <Edit className="w-4 h-4 text-gray-400" />
                                                        Edit Details
                                                    </button>
                                                    {!workOrder.client_id && onLinkClient && (
                                                        <button
                                                            onClick={() => { onLinkClient(); setIsActionsOpen(false); }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                                        >
                                                            <Link className="w-4 h-4 text-gray-400" />
                                                            Link to Client
                                                        </button>
                                                    )}
                                                    <div className="border-t border-gray-100 my-2" />
                                                    <button
                                                        onClick={() => { onDelete(); setIsActionsOpen(false); }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete Work Order
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Collapse button */}
                                    <button
                                        onClick={toggleCollapse}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Collapse header"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ROW 2: WO Number + Status + Job Type */}
                    <div className="max-w-[1600px] mx-auto px-8 lg:px-12 pt-8 pb-6">
                        <div className="flex items-center gap-5 mb-3">
                            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                                {workOrder.work_order_number
                                    ? safeRender(workOrder.work_order_number)
                                    : 'New Work Order'
                                }
                            </h1>

                            <div className="relative">
                                <select
                                    value={currentStatus}
                                    onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
                                    disabled={savingStatus || saving}
                                    className={`
                                        ${statusStyle.bg} ${statusStyle.text}
                                        px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer 
                                        border-0 appearance-none pr-9
                                        focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:outline-none
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                    `}
                                >
                                    {JOB_STATUSES.map(status => (
                                        <option key={status} value={status} className="bg-white text-gray-900">
                                            {status}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-white/80" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {workOrder.job_type && (
                                <span className="text-base text-gray-600 font-medium">
                                    {safeRender(workOrder.job_type.name)}
                                </span>
                            )}
                            {workOrder.job_type && workOrder.processed !== undefined && (
                                <span className="text-gray-300">•</span>
                            )}
                            {workOrder.processed !== undefined && (
                                <span className={`text-sm ${workOrder.processed ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {workOrder.processed ? '✓ AI Analyzed' : '○ Pending Analysis'}
                                </span>
                            )}
                            {(workOrder.job_status === 'On Hold' || workOrder.job_status === 'Cancelled') && workOrder.job_status_reason && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-sm italic text-gray-400">
                                        {safeRender(workOrder.job_status_reason)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ROW 3: Details - Sectioned Columns */}
                    <div className="border-t border-gray-100">
                        <div className="max-w-[1600px] mx-auto px-8 lg:px-12 py-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">

                                {/* COLUMN 1: Client Information */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <Building2 className="w-4 h-4" />
                                        Client Information
                                    </h3>

                                    <div className="space-y-5">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Client</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {workOrder.client ? safeRender(workOrder.client.name) : <span className="text-gray-300">Not assigned</span>}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Project Manager</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {workOrder.project_manager ? safeRender(workOrder.project_manager.name) : <span className="text-gray-300">—</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMN 2: Schedule & Dates */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Schedule
                                    </h3>

                                    <div className="space-y-5">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Work Order Date</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {formatDate(workOrder.work_order_date)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Planned Date</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {formatDate(workOrder.planned_date)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMN 3: Assignment */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Assignment
                                    </h3>

                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">WO Owner</p>
                                        <div className="flex items-center gap-3">
                                            {workOrder.owner?.avatar_url ? (
                                                <img
                                                    src={workOrder.owner.avatar_url}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : workOrder.owner?.display_name ? (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                                    {workOrder.owner.display_name.charAt(0).toUpperCase()}
                                                </div>
                                            ) : null}
                                            <p className="text-base font-semibold text-gray-900">
                                                {safeRender(workOrder.owner?.display_name) || <span className="text-gray-300">Unassigned</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FULL WIDTH: Site Address */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                    <MapPin className="w-4 h-4" />
                                    Site Location
                                </h3>
                                <p className="text-base font-semibold text-gray-900">
                                    {safeRender(workOrder.site_address) || <span className="text-gray-300">No address provided</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom spacing before tabs */}
                    <div className="h-4 bg-gray-50 border-t border-b border-gray-200" />
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
