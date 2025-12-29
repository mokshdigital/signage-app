'use client';

import { useState, useEffect, useCallback } from 'react';
import { timesheetsService } from '@/services';
import { LoadingSpinner, Button, Avatar } from '@/components/ui';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter, X, Users } from 'lucide-react';
import type { TimesheetDay, TimesheetEntry, ActivityType, LocationChip, TimesheetStatus } from '@/types/database';

// Status configuration
const STATUS_CONFIG: Record<TimesheetStatus, { color: string; bg: string; label: string }> = {
    draft: { color: 'text-slate-600', bg: 'bg-slate-100', label: 'Draft' },
    submitted: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Submitted' },
    approved: { color: 'text-green-600', bg: 'bg-green-100', label: 'Approved' },
    rejected: { color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
    processed: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Processed' },
};

const STATUS_DOT_COLORS: Record<TimesheetStatus, string> = {
    draft: 'bg-slate-400',
    submitted: 'bg-blue-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    processed: 'bg-purple-500',
};

interface Filters {
    dateFrom: string;
    dateTo: string;
    status: string[];
    userId: string;
    activityTypeId: string;
    locationChipId: string;
    workOrderId: string;
}

export function AllTimesheetsTable() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Data
    const [days, setDays] = useState<TimesheetDay[]>([]);
    const [totalDays, setTotalDays] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter options
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
    const [locationChips, setLocationChips] = useState<LocationChip[]>([]);
    const [users, setUsers] = useState<{ id: string; display_name: string }[]>([]);

    // Filters state
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<Filters>(() => {
        // Default: last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 29);
        return {
            dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
            dateTo: today.toISOString().split('T')[0],
            status: [],
            userId: '',
            activityTypeId: '',
            locationChipId: '',
            workOrderId: '',
        };
    });

    // Expanded days
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
    // Expanded notes
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

    // Load filter options
    useEffect(() => {
        async function loadFilterOptions() {
            try {
                const [activities, locations, timesheetUsers] = await Promise.all([
                    timesheetsService.getActivityTypes(),
                    timesheetsService.getLocationChips(),
                    timesheetsService.getTimesheetUsers(),
                ]);
                setActivityTypes(activities);
                setLocationChips(locations);
                setUsers(timesheetUsers);
            } catch (err) {
                console.error('Failed to load filter options:', err);
            }
        }
        loadFilterOptions();
    }, []);

    // Load data
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await timesheetsService.getAllDaysPaginated(
                {
                    dateFrom: filters.dateFrom || undefined,
                    dateTo: filters.dateTo || undefined,
                    status: filters.status.length > 0 ? filters.status : undefined,
                    userId: filters.userId || undefined,
                    activityTypeId: filters.activityTypeId || undefined,
                    locationChipId: filters.locationChipId || undefined,
                    workOrderId: filters.workOrderId || undefined,
                },
                currentPage,
                14
            );

            setDays(result.days);
            setTotalDays(result.totalDays);
            setTotalPages(result.totalPages);

            // Expand the most recent day by default
            if (result.days.length > 0 && expandedDays.size === 0) {
                setExpandedDays(new Set([result.days[0].id]));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load timesheets');
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Toggle day expansion
    const toggleDay = (dayId: string) => {
        setExpandedDays(prev => {
            const next = new Set(prev);
            if (next.has(dayId)) {
                next.delete(dayId);
            } else {
                next.add(dayId);
            }
            return next;
        });
    };

    // Toggle note expansion
    const toggleNote = (entryId: string) => {
        setExpandedNotes(prev => {
            const next = new Set(prev);
            if (next.has(entryId)) {
                next.delete(entryId);
            } else {
                next.add(entryId);
            }
            return next;
        });
    };

    // Clear filters
    const clearFilters = () => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 29);
        setFilters({
            dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
            dateTo: today.toISOString().split('T')[0],
            status: [],
            userId: '',
            activityTypeId: '',
            locationChipId: '',
            workOrderId: '',
        });
        setCurrentPage(1);
    };

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatDateShort = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    // Status toggle
    const toggleStatus = (status: string) => {
        setFilters(prev => ({
            ...prev,
            status: prev.status.includes(status)
                ? prev.status.filter(s => s !== status)
                : [...prev.status, status],
        }));
        setCurrentPage(1);
    };

    // Render entry row (desktop)
    const renderEntryRow = (entry: TimesheetEntry) => {
        const isNoteExpanded = expandedNotes.has(entry.id);
        const hasLongNote = entry.notes && entry.notes.length > 50;

        return (
            <tr key={entry.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: entry.activity_type?.color || '#94a3b8' }}
                        />
                        <span className="text-sm font-medium text-slate-700">
                            {entry.activity_type?.name || 'Unknown'}
                        </span>
                    </div>
                </td>
                <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: entry.location_chip?.color || '#94a3b8' }}
                        />
                        <span className="text-sm text-slate-600">
                            {entry.location_chip?.name || 'Unknown'}
                        </span>
                    </div>
                </td>
                <td className="py-3 px-4">
                    <span className="text-sm text-slate-600">
                        {entry.work_order?.work_order_number || 'General'}
                    </span>
                </td>
                <td className="py-3 px-4">
                    <span className="text-sm font-medium text-slate-700">
                        {entry.hours} hrs
                    </span>
                </td>
                <td className="py-3 px-4">
                    {entry.notes ? (
                        <div>
                            <p className="text-sm text-slate-500">
                                {isNoteExpanded || !hasLongNote
                                    ? entry.notes
                                    : `${entry.notes.substring(0, 50)}...`}
                            </p>
                            {hasLongNote && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleNote(entry.id); }}
                                    className="text-xs text-amber-600 hover:text-amber-700 mt-1"
                                >
                                    {isNoteExpanded ? 'Show less' : 'Show more'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <span className="text-sm text-slate-400">—</span>
                    )}
                </td>
            </tr>
        );
    };

    // Render entry card (mobile)
    const renderEntryCard = (entry: TimesheetEntry) => {
        return (
            <div key={entry.id} className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.activity_type?.color || '#94a3b8' }}
                        />
                        <span className="text-sm font-medium text-slate-700">
                            {entry.activity_type?.name || 'Unknown'}
                        </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                        {entry.hours} hrs
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: entry.location_chip?.color || '#94a3b8' }}
                    />
                    <span>{entry.location_chip?.name || 'Unknown'}</span>
                    <span className="mx-1">•</span>
                    <span>{entry.work_order?.work_order_number || 'General'}</span>
                </div>
                {entry.notes && (
                    <p className="text-xs text-slate-500 mt-1 border-t border-slate-100 pt-2">
                        {entry.notes}
                    </p>
                )}
            </div>
        );
    };

    // Render day header row (desktop) - includes employee name
    const renderDayHeader = (day: TimesheetDay) => {
        const isExpanded = expandedDays.has(day.id);
        const statusConfig = STATUS_CONFIG[day.status];
        const statusDotColor = STATUS_DOT_COLORS[day.status];

        return (
            <tr
                key={`header-${day.id}`}
                className="bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => toggleDay(day.id)}
            >
                <td colSpan={5} className="py-3 px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${statusDotColor}`} />
                            <Avatar
                                src={day.user?.avatar_url}
                                fallback={day.user?.display_name?.substring(0, 2) || '??'}
                                size="sm"
                            />
                            <div>
                                <span className="font-semibold text-slate-800">
                                    {day.user?.display_name || 'Unknown User'}
                                </span>
                                <span className="mx-2 text-slate-400">•</span>
                                <span className="text-slate-600">
                                    {formatDate(day.work_date)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-600">
                                {day.total_hours} hrs
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                {statusConfig.label}
                            </span>
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                        </div>
                    </div>
                </td>
            </tr>
        );
    };

    // Render day card (mobile) - includes employee name
    const renderDayCard = (day: TimesheetDay) => {
        const isExpanded = expandedDays.has(day.id);
        const statusConfig = STATUS_CONFIG[day.status];
        const statusDotColor = STATUS_DOT_COLORS[day.status];

        return (
            <div key={day.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-3">
                {/* Day Header */}
                <div
                    className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer"
                    onClick={() => toggleDay(day.id)}
                >
                    <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${statusDotColor}`} />
                        <Avatar
                            src={day.user?.avatar_url}
                            fallback={day.user?.display_name?.substring(0, 2) || '??'}
                            size="sm"
                        />
                        <div>
                            <p className="font-semibold text-slate-800">
                                {day.user?.display_name || 'Unknown User'}
                            </p>
                            <p className="text-sm text-slate-500">
                                {formatDateShort(day.work_date)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-slate-600">{day.total_hours} hrs</span>
                                <span className="mx-1">•</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                    {statusConfig.label}
                                </span>
                            </div>
                        </div>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                </div>

                {/* Entries */}
                {isExpanded && day.entries && day.entries.length > 0 && (
                    <div className="p-3 space-y-2 bg-slate-25">
                        {day.entries.map(entry => renderEntryCard(entry))}
                    </div>
                )}

                {isExpanded && (!day.entries || day.entries.length === 0) && (
                    <div className="p-4 text-center text-sm text-slate-500">
                        No entries for this day
                    </div>
                )}
            </div>
        );
    };

    if (loading && days.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-slate-600">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Viewing all employees&apos; timesheets</span>
            </div>

            {/* Filter Toggle (Mobile) */}
            <div className="flex items-center justify-between md:hidden">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700"
                >
                    <Filter className="w-4 h-4" />
                    Filters
                    {(filters.status.length > 0 || filters.userId || filters.activityTypeId || filters.locationChipId || filters.workOrderId) && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                </button>
            </div>

            {/* Filter Bar */}
            <div className={`bg-white rounded-xl border border-slate-200 p-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
                <div className="flex flex-wrap gap-3 items-end">
                    {/* Employee Filter */}
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Employee</label>
                        <select
                            value={filters.userId}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, userId: e.target.value }));
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                            <option value="">All Employees</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.display_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="flex gap-2">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">From</label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => {
                                    setFilters(prev => ({ ...prev, dateFrom: e.target.value }));
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">To</label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => {
                                    setFilters(prev => ({ ...prev, dateTo: e.target.value }));
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Status Chips */}
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Status</label>
                        <div className="flex flex-wrap gap-1">
                            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                <button
                                    key={status}
                                    onClick={() => toggleStatus(status)}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${filters.status.includes(status)
                                            ? `${config.bg} ${config.color} ring-2 ring-offset-1 ring-amber-400`
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    {config.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity Type */}
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Activity</label>
                        <select
                            value={filters.activityTypeId}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, activityTypeId: e.target.value }));
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                            <option value="">All</option>
                            {activityTypes.map(at => (
                                <option key={at.id} value={at.id}>{at.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Location</label>
                        <select
                            value={filters.locationChipId}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, locationChipId: e.target.value }));
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                            <option value="">All</option>
                            {locationChips.map(lc => (
                                <option key={lc.id} value={lc.id}>{lc.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Clear Filters */}
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{totalDays} day(s) found</span>
                {loading && <LoadingSpinner size="sm" />}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="sr-only">
                        <tr>
                            <th>Activity</th>
                            <th>Location</th>
                            <th>Work Order</th>
                            <th>Hours</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {days.map(day => (
                            <>
                                {renderDayHeader(day)}
                                {expandedDays.has(day.id) && day.entries && day.entries.length > 0 && (
                                    day.entries.map(entry => renderEntryRow(entry))
                                )}
                                {expandedDays.has(day.id) && (!day.entries || day.entries.length === 0) && (
                                    <tr key={`empty-${day.id}`}>
                                        <td colSpan={5} className="py-4 text-center text-sm text-slate-500">
                                            No entries for this day
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                        {days.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-500">
                                    No timesheet entries found for the selected filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
                {days.map(day => renderDayCard(day))}
                {days.length === 0 && !loading && (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                        No timesheet entries found for the selected filters.
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </Button>
                    <span className="text-sm text-slate-600">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
