'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
    Building2,
    AlertTriangle,
    X
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

const STORAGE_KEY = 'wo-header-collapsed';

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

    // Review needed popover
    const [isReviewPopoverOpen, setIsReviewPopoverOpen] = useState(false);

    // Collapse state - initialized from localStorage
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load preference from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
            setIsCollapsed(saved === 'true');
        }
        setIsInitialized(true);
    }, []);

    // Save preference to localStorage when changed
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem(STORAGE_KEY, String(isCollapsed));
        }
    }, [isCollapsed, isInitialized]);

    // Keyboard shortcut: Cmd/Ctrl + Shift + H
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
                e.preventDefault();
                setIsCollapsed(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

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

    // Review needed logic: show if client, PM, or owner is missing
    const missingItems: string[] = [];
    if (!workOrder.client_id) missingItems.push('Client not assigned');
    if (!workOrder.pm_id) missingItems.push('Contact/PM not selected');
    if (!workOrder.owner_id) missingItems.push('WO Owner not assigned');
    const needsReview = missingItems.length > 0;

    // Review Needed Badge with Popover
    const ReviewBadge = () => {
        if (!needsReview) return null;

        return (
            <div className="relative">
                <button
                    onClick={() => setIsReviewPopoverOpen(!isReviewPopoverOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                    <AlertTriangle className="w-4 h-4" />
                    Review Needed
                </button>

                {isReviewPopoverOpen && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsReviewPopoverOpen(false)} />
                        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-40">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-900">Missing Information</h4>
                                <button
                                    onClick={() => setIsReviewPopoverOpen(false)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <ul className="space-y-2">
                                {missingItems.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-red-600">
                                        <span className="mt-0.5">❌</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => { setIsReviewPopoverOpen(false); onEdit(); }}
                                className="w-full mt-3 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Edit Details
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    // Collapse Toggle Pill Button Component
    const CollapsePill = () => (
        <div className="flex justify-center py-3 border-t border-gray-100 bg-gray-50/50">
            <button
                onClick={toggleCollapse}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all shadow-sm"
                title="Toggle header (Ctrl+Shift+H)"
            >
                {isCollapsed ? (
                    <>
                        <ChevronDown className="w-4 h-4" />
                        Show Details
                    </>
                ) : (
                    <>
                        <ChevronUp className="w-4 h-4" />
                        Hide Details
                    </>
                )}
            </button>
        </div>
    );

    return (
        <>
            <div className="bg-white sticky top-0 z-20 border-b border-gray-200 transition-all duration-300 ease-in-out">

                {/* ═══════════════════════════════════════════════════════════════════
                    MOBILE HEADER - Always visible on small screens
                ═══════════════════════════════════════════════════════════════════ */}
                <div className="md:hidden">
                    <div className="px-4 py-3">
                        {/* Row 1: Back, WO#, Status, Menu */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                    onClick={() => router.push(backUrl)}
                                    className="p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-400 font-medium">#WO</p>
                                    <h1 className="text-lg font-bold text-gray-900 truncate">
                                        {workOrder.work_order_number
                                            ? safeRender(workOrder.work_order_number)
                                            : 'Work Order'
                                        }
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Status Dropdown */}
                                <div className="relative">
                                    <select
                                        value={currentStatus}
                                        onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
                                        disabled={savingStatus || saving}
                                        className={`
                                            ${statusStyle.bg} ${statusStyle.text}
                                            px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer 
                                            border-0 appearance-none pr-6
                                            focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:outline-none
                                            disabled:opacity-50
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

                                {/* Actions Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsActionsOpen(!isActionsOpen)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                    {isActionsOpen && (
                                        <>
                                            <div className="fixed inset-0 z-30" onClick={() => setIsActionsOpen(false)} />
                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-40">
                                                <button
                                                    onClick={() => { onViewFiles(); setIsActionsOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <FileText className="w-4 h-4 text-gray-400" />
                                                    View Work Order
                                                </button>
                                                <button
                                                    onClick={() => { onViewAISummary(); setIsActionsOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-purple-600 hover:bg-purple-50"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    AI Summary
                                                </button>
                                                <div className="border-t border-gray-100 my-2" />
                                                <button
                                                    onClick={() => { onEdit(); setIsActionsOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Edit className="w-4 h-4 text-gray-400" />
                                                    Edit Details
                                                </button>
                                                {!workOrder.client_id && onLinkClient && (
                                                    <button
                                                        onClick={() => { onLinkClient(); setIsActionsOpen(false); }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                                                    >
                                                        <Link className="w-4 h-4 text-gray-400" />
                                                        Link to Client
                                                    </button>
                                                )}
                                                <div className="border-t border-gray-100 my-2" />
                                                <button
                                                    onClick={() => { onDelete(); setIsActionsOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
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

                        {/* Row 2: Quick Info (expandable) */}
                        <button
                            onClick={toggleCollapse}
                            className="w-full mt-3 flex items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-4 text-sm text-gray-600 overflow-hidden">
                                {workOrder.client && (
                                    <span className="flex items-center gap-1.5 truncate">
                                        <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{safeRender(workOrder.client.name)}</span>
                                    </span>
                                )}
                                {workOrder.job_type && (
                                    <span className="hidden xs:inline text-gray-400">•</span>
                                )}
                                {workOrder.job_type && (
                                    <span className="hidden xs:inline truncate">{safeRender(workOrder.job_type.name)}</span>
                                )}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${!isCollapsed ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Expanded Details */}
                        {!isCollapsed && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                {/* Review Badge */}
                                {needsReview && (
                                    <div className="mb-3">
                                        <ReviewBadge />
                                    </div>
                                )}

                                {/* Site Address */}
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-gray-700">
                                        {safeRender(workOrder.site_address) || <span className="text-gray-400">No address</span>}
                                    </p>
                                </div>

                                {/* Dates */}
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <p className="text-sm text-gray-700">
                                        {workOrder.planned_dates && workOrder.planned_dates.length > 0
                                            ? formatDateShort(workOrder.planned_dates[0])
                                            : <span className="text-gray-400">No date</span>
                                        }
                                    </p>
                                </div>

                                {/* Owner */}
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <p className="text-sm text-gray-700">
                                        {safeRender(workOrder.owner?.display_name) || <span className="text-gray-400">No owner</span>}
                                    </p>
                                </div>

                                {/* PM */}
                                {workOrder.project_manager && (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <p className="text-sm text-gray-700">
                                            PM: {safeRender(workOrder.project_manager.name)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════════
                    DESKTOP: COLLAPSED VIEW - Compact Single Row (hidden on mobile)
                ═══════════════════════════════════════════════════════════════════ */}
                {isCollapsed && (
                    <div className="hidden md:block max-w-[1600px] mx-auto px-8 lg:px-12">
                        <div className="flex items-center justify-between gap-4 py-4">
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

                                {/* Quick info separator */}
                                <div className="hidden md:flex items-center gap-3 text-sm text-gray-400">
                                    <span className="w-px h-4 bg-gray-200" />
                                    {workOrder.client && (
                                        <span>{safeRender(workOrder.client.name)}</span>
                                    )}
                                    {workOrder.planned_dates && workOrder.planned_dates.length > 0 && (
                                        <>
                                            <span>•</span>
                                            <span>{formatDateShort(workOrder.planned_dates[0])}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right: Actions */}
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
                            </div>
                        </div>

                        {/* Expand Pill */}
                        <CollapsePill />
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                    DESKTOP: EXPANDED VIEW - Full Layout (hidden on mobile)
                ═══════════════════════════════════════════════════════════════════ */}
                {!isCollapsed && (
                    <div className="hidden md:block">
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
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: WO Number + Status + Job Type */}
                        <div className="max-w-[1600px] mx-auto px-8 lg:px-12 pt-8 pb-6">
                            <div className="flex items-start justify-between">
                                {/* Left: WO # and Label */}
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-400 mb-1">#WO</span>
                                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-none">
                                        {workOrder.work_order_number
                                            ? safeRender(workOrder.work_order_number)
                                            : 'New Work Order'
                                        }
                                    </h1>

                                    {/* Review Badge - Under WO Number */}
                                    <div className="mt-2 text-left">
                                        <ReviewBadge />
                                    </div>
                                </div>

                                {/* Center: Job Type */}
                                <div className="flex-1 flex justify-center pt-5">
                                    {workOrder.job_type && (
                                        <span className="text-base text-gray-600 font-medium">
                                            {safeRender(workOrder.job_type.name)}
                                        </span>
                                    )}
                                </div>

                                {/* Right: Job Status */}
                                <div className="pt-2">
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
                            </div>
                        </div>

                        {/* ROW 3: Details - Sectioned Columns */}
                        <div className="border-t border-gray-100">
                            <div className="max-w-[1600px] mx-auto px-8 lg:px-12 py-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">

                                    {/* COLUMN 1: Client Information */}
                                    <div className="space-y-6">

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

                                        <div className="space-y-5">
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1">Work Order Date</p>
                                                <p className="text-base font-semibold text-gray-900">
                                                    {formatDate(workOrder.work_order_date)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-400 mb-1">Planned Dates</p>
                                                {workOrder.planned_dates && workOrder.planned_dates.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {workOrder.planned_dates.map((date, i) => (
                                                            <p key={i} className="text-base font-semibold text-gray-900">
                                                                {formatDate(date)}
                                                            </p>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-base font-semibold text-gray-300">—</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLUMN 3: Assignment */}
                                    <div className="space-y-6">

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

                        {/* Collapse Pill at bottom */}
                        <CollapsePill />
                    </div>
                )}
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
