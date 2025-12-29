'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { timesheetsService } from '@/services';
import { usePermissions } from '@/hooks/usePermissions';
import { LogTimeForm, WeeklyTotalsWidget, PastDayRequestForm, ApprovalsQueue } from '@/components/timesheets';
import { LoadingSpinner, Button } from '@/components/ui';
import type { TimesheetEntry, TimesheetDay, TimesheetDayRequest } from '@/types/database';

type TabType = 'log' | 'my-timesheets' | 'request-past' | 'approvals';

export default function TimesheetsPage() {
    const { hasPermission, loading: permLoading } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('log');

    // Today's entries for Log Time tab
    const [todaysEntries, setTodaysEntries] = useState<TimesheetEntry[]>([]);
    const [todaysDay, setTodaysDay] = useState<TimesheetDay | null>(null);

    // My requests for Request Past tab
    const [myRequests, setMyRequests] = useState<TimesheetDayRequest[]>([]);

    const today = new Date().toISOString().split('T')[0];

    // Get current user
    useEffect(() => {
        async function getUser() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            }
            setLoading(false);
        }
        getUser();
    }, []);

    // Load today's entries
    const loadTodaysEntries = useCallback(async () => {
        if (!userId) return;
        try {
            const day = await timesheetsService.getOrCreateDay(userId, today);
            setTodaysDay(day);
            const entries = await timesheetsService.getEntriesForDay(day.id);
            setTodaysEntries(entries);
        } catch (err) {
            console.error('Failed to load today\'s entries:', err);
        }
    }, [userId, today]);

    // Load my past-day requests
    const loadMyRequests = useCallback(async () => {
        if (!userId) return;
        try {
            const requests = await timesheetsService.getMyRequests(userId);
            setMyRequests(requests);
        } catch (err) {
            console.error('Failed to load requests:', err);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            loadTodaysEntries();
            loadMyRequests();
        }
    }, [userId, loadTodaysEntries, loadMyRequests]);

    // Handle entry created
    const handleEntryCreated = (entry: TimesheetEntry) => {
        setTodaysEntries(prev => [...prev, entry]);
        // Update day's total
        if (todaysDay) {
            setTodaysDay({
                ...todaysDay,
                total_hours: todaysDay.total_hours + entry.hours,
            });
        }
    };

    // Handle entry deleted
    const handleDeleteEntry = async (entryId: string) => {
        try {
            await timesheetsService.deleteEntry(entryId);
            const deleted = todaysEntries.find(e => e.id === entryId);
            setTodaysEntries(prev => prev.filter(e => e.id !== entryId));
            if (deleted && todaysDay) {
                setTodaysDay({
                    ...todaysDay,
                    total_hours: todaysDay.total_hours - deleted.hours,
                });
            }
        } catch (err) {
            console.error('Failed to delete entry:', err);
        }
    };

    // Handle submit day
    const handleSubmitDay = async () => {
        if (!todaysDay) return;
        try {
            await timesheetsService.submitDay(todaysDay.id);
            setTodaysDay({ ...todaysDay, status: 'submitted' });
        } catch (err) {
            console.error('Failed to submit day:', err);
        }
    };

    // Calculate permissions
    const canLogTime = hasPermission('timesheets:log_own');
    const canSubmit = hasPermission('timesheets:submit_own');
    const canRequestPast = hasPermission('timesheets:request_past_day');
    const canApprove = hasPermission('timesheets:approve');

    // Filter available tabs based on permissions
    const availableTabs: { id: TabType; label: string; permission?: boolean }[] = [
        { id: 'log', label: 'Log Time', permission: canLogTime },
        { id: 'my-timesheets', label: 'My Timesheets', permission: true },
        { id: 'request-past', label: 'Request Past Day', permission: canRequestPast },
        { id: 'approvals', label: 'Approvals', permission: canApprove },
    ].filter(tab => tab.permission !== false);

    if (loading || permLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="p-6 text-center text-slate-500">
                Please log in to access timesheets.
            </div>
        );
    }

    // Check if day is editable
    const isDayEditable = todaysDay?.status === 'draft' || todaysDay?.status === 'rejected';

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Timesheets</h1>
                <p className="text-slate-500">Track your work hours and submit for approval</p>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200 -mx-4 px-4">
                {availableTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-amber-500 text-amber-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div>
                {/* Log Time Tab */}
                {activeTab === 'log' && (
                    <div className="space-y-6">
                        {/* Today's date header */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-amber-700 font-medium">Logging time for</p>
                                    <p className="text-xl font-bold text-slate-800">
                                        {new Date(today).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-amber-600">{todaysDay?.total_hours || 0}</p>
                                    <p className="text-xs text-amber-700">hours today</p>
                                </div>
                            </div>

                            {/* Status badge */}
                            {todaysDay && todaysDay.status !== 'draft' && (
                                <div className="mt-3 pt-3 border-t border-amber-200">
                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${todaysDay.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                        todaysDay.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            todaysDay.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-purple-100 text-purple-700'
                                        }`}>
                                        {todaysDay.status.charAt(0).toUpperCase() + todaysDay.status.slice(1)}
                                    </span>
                                    {todaysDay.status === 'rejected' && todaysDay.rejection_reason && (
                                        <p className="mt-2 text-sm text-red-600">
                                            Rejection reason: {todaysDay.rejection_reason}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Entry Form */}
                        {isDayEditable ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Add Time Entry</h3>
                                <LogTimeForm
                                    userId={userId}
                                    date={today}
                                    onEntryCreated={handleEntryCreated}
                                    disabled={!isDayEditable}
                                />
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center">
                                <p className="text-slate-500">
                                    This day&apos;s timesheet has been {todaysDay?.status}.
                                    {todaysDay?.status === 'submitted' && ' Waiting for approval.'}
                                </p>
                            </div>
                        )}

                        {/* Today's Entries List */}
                        {todaysEntries.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100">
                                    <h3 className="font-semibold text-slate-800">Today&apos;s Entries</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {todaysEntries.map((entry) => (
                                        <div key={entry.id} className="px-6 py-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: entry.activity_type?.color || '#94a3b8' }}
                                                />
                                                <div>
                                                    <p className="font-medium text-slate-800">
                                                        {entry.activity_type?.name}
                                                        {entry.work_order && (
                                                            <span className="text-slate-500 font-normal ml-2">
                                                                → {entry.work_order.work_order_number || 'WO'}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        {entry.location_chip?.name}
                                                        {entry.notes && ` • ${entry.notes}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-semibold text-slate-700">
                                                    {entry.hours}h
                                                </span>
                                                {isDayEditable && (
                                                    <button
                                                        onClick={() => handleDeleteEntry(entry.id)}
                                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                        title="Delete entry"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Submit Button */}
                                {isDayEditable && canSubmit && todaysEntries.length > 0 && (
                                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                                        <Button onClick={handleSubmitDay} className="w-full">
                                            Submit Day for Approval
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* My Timesheets Tab */}
                {activeTab === 'my-timesheets' && (
                    <div className="space-y-6">
                        <WeeklyTotalsWidget userId={userId} />
                    </div>
                )}

                {/* Request Past Day Tab */}
                {activeTab === 'request-past' && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <PastDayRequestForm userId={userId} onRequestCreated={loadMyRequests} />

                        {/* My Requests List */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">My Requests</h3>
                            {myRequests.length === 0 ? (
                                <p className="text-slate-500 text-sm">No requests submitted yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {myRequests.map((req) => (
                                        <div key={req.id} className="p-3 rounded-lg border border-slate-200">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium text-slate-800">
                                                    {new Date(req.requested_date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 line-clamp-2">{req.reason}</p>
                                            {req.review_notes && (
                                                <p className="mt-2 text-sm text-red-600">
                                                    Note: {req.review_notes}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Approvals Tab */}
                {activeTab === 'approvals' && (
                    <ApprovalsQueue currentUserId={userId} />
                )}
            </div>
        </div>
    );
}
