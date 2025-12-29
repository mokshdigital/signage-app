'use client';

import { useState, useEffect } from 'react';
import { timesheetsService } from '@/services';
import type { TimesheetDay, TimesheetDayRequest } from '@/types/database';
import { Button, LoadingSpinner, Avatar } from '@/components/ui';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ApprovalsQueueProps {
    currentUserId: string;
    onApprovalComplete?: () => void;
}

type TabType = 'timesheets' | 'requests';

export function ApprovalsQueue({ currentUserId, onApprovalComplete }: ApprovalsQueueProps) {
    const [activeTab, setActiveTab] = useState<TabType>('timesheets');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Data
    const [pendingDays, setPendingDays] = useState<TimesheetDay[]>([]);
    const [pendingRequests, setPendingRequests] = useState<TimesheetDayRequest[]>([]);

    // Action states
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState<string>('');
    const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    // Load data
    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [days, requests] = await Promise.all([
                timesheetsService.getAllDays({ status: 'submitted' }),
                timesheetsService.getPendingRequests(),
            ]);

            setPendingDays(days);
            setPendingRequests(requests);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load approvals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Approve timesheet day
    const handleApproveDay = async (dayId: string) => {
        try {
            setProcessingId(dayId);
            await timesheetsService.approveDay(dayId, currentUserId);
            setPendingDays(prev => prev.filter(d => d.id !== dayId));
            onApprovalComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to approve');
        } finally {
            setProcessingId(null);
        }
    };

    // Reject timesheet day
    const handleRejectDay = async (dayId: string) => {
        if (!rejectReason.trim()) {
            setError('Please provide a rejection reason');
            return;
        }
        try {
            setProcessingId(dayId);
            await timesheetsService.rejectDay(dayId, currentUserId, rejectReason.trim());
            setPendingDays(prev => prev.filter(d => d.id !== dayId));
            setShowRejectModal(null);
            setRejectReason('');
            onApprovalComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reject');
        } finally {
            setProcessingId(null);
        }
    };

    // Approve past-day request
    const handleApproveRequest = async (requestId: string) => {
        try {
            setProcessingId(requestId);
            await timesheetsService.approveRequest(requestId, currentUserId);
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            onApprovalComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to approve request');
        } finally {
            setProcessingId(null);
        }
    };

    // Deny past-day request
    const handleDenyRequest = async (requestId: string) => {
        if (!rejectReason.trim()) {
            setError('Please provide a denial reason');
            return;
        }
        try {
            setProcessingId(requestId);
            await timesheetsService.denyRequest(requestId, currentUserId, rejectReason.trim());
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            setShowRejectModal(null);
            setRejectReason('');
            onApprovalComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to deny request');
        } finally {
            setProcessingId(null);
        }
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('timesheets')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'timesheets'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Timesheets
                    {pendingDays.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                            {pendingDays.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requests'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Past-Day Requests
                    {pendingRequests.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            {pendingRequests.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Timesheet Approvals */}
            {activeTab === 'timesheets' && (
                <div className="space-y-3">
                    {pendingDays.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p className="text-lg">No timesheets pending approval</p>
                            <p className="text-sm mt-1">All caught up! 🎉</p>
                        </div>
                    ) : (
                        pendingDays.map((day) => {
                            const isExpanded = expandedIds.includes(day.id);
                            return (
                                <div key={day.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                    <div className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleExpand(day.id)}>
                                                <Avatar
                                                    src={day.user?.avatar_url}
                                                    fallback={day.user?.display_name || 'Unknown'}
                                                    size="md"
                                                />
                                                <div>
                                                    <p className="font-medium text-slate-800 flex items-center gap-2">
                                                        {day.user?.display_name || 'Unknown User'}
                                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        {formatDate(day.work_date)} • {day.total_hours} hours
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setShowRejectModal(day.id);
                                                        setRejectReason('');
                                                    }}
                                                    disabled={processingId === day.id}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApproveDay(day.id)}
                                                    disabled={processingId === day.id}
                                                >
                                                    {processingId === day.id ? <LoadingSpinner size="sm" /> : 'Approve'}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Entries summary */}
                                        {!isExpanded && day.entries && day.entries.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 cursor-pointer" onClick={() => toggleExpand(day.id)}>
                                                <p className="text-xs text-slate-500 mb-1">{day.entries.length} entries (click to view details)</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && day.entries && (
                                        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3">
                                            <div className="space-y-3">
                                                {day.entries.map((entry) => (
                                                    <div key={entry.id} className="grid grid-cols-12 gap-2 text-sm bg-white p-3 rounded border border-slate-200">
                                                        <div className="col-span-12 sm:col-span-4 font-medium text-slate-700">
                                                            <div className="flex items-center gap-2">
                                                                {entry.location_chip && (
                                                                    <span
                                                                        className="w-2 h-2 rounded-full"
                                                                        style={{ backgroundColor: entry.location_chip.color }}
                                                                    />
                                                                )}
                                                                <span>{entry.activity_type?.name}</span>
                                                            </div>
                                                            <div className="text-xs text-slate-500 ml-4">
                                                                {entry.location_chip?.name}
                                                            </div>
                                                        </div>

                                                        <div className="col-span-12 sm:col-span-4">
                                                            {entry.work_order ? (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {entry.work_order.work_order_number}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 italic">General</span>
                                                            )}
                                                            {entry.notes && (
                                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2" title={entry.notes}>
                                                                    {entry.notes}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="col-span-12 sm:col-span-4 text-right font-semibold text-slate-800">
                                                            {entry.hours} hrs
                                                        </div>
                                                    </div>
                                                ))}

                                                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                                    <span className="text-sm font-medium text-slate-600">Total</span>
                                                    <span className="text-sm font-bold text-slate-900">{day.total_hours} hrs</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Past-Day Request Approvals */}
            {activeTab === 'requests' && (
                <div className="space-y-3">
                    {pendingRequests.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p className="text-lg">No past-day requests pending</p>
                            <p className="text-sm mt-1">All caught up! 🎉</p>
                        </div>
                    ) : (
                        pendingRequests.map((request) => (
                            <div key={request.id} className="bg-white rounded-lg border border-slate-200 p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            src={request.user?.avatar_url}
                                            fallback={request.user?.display_name || 'Unknown'}
                                            size="md"
                                        />
                                        <div>
                                            <p className="font-medium text-slate-800">
                                                {request.user?.display_name || 'Unknown User'}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Requesting access to: {formatDate(request.requested_date)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setShowRejectModal(`req-${request.id}`);
                                                setRejectReason('');
                                            }}
                                            disabled={processingId === request.id}
                                        >
                                            Deny
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApproveRequest(request.id)}
                                            disabled={processingId === request.id}
                                        >
                                            {processingId === request.id ? <LoadingSpinner size="sm" /> : 'Approve'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Reason */}
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">Reason:</p>
                                    <p className="text-sm text-slate-700">{request.reason}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Reject/Deny Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            {showRejectModal.startsWith('req-') ? 'Deny Request' : 'Reject Timesheet'}
                        </h3>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                            placeholder="Provide a reason..."
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none mb-4"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowRejectModal(null);
                                    setRejectReason('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    if (showRejectModal.startsWith('req-')) {
                                        handleDenyRequest(showRejectModal.replace('req-', ''));
                                    } else {
                                        handleRejectDay(showRejectModal);
                                    }
                                }}
                                disabled={!rejectReason.trim()}
                            >
                                {showRejectModal.startsWith('req-') ? 'Deny' : 'Reject'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
