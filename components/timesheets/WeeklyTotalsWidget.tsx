'use client';

import { useState, useEffect } from 'react';
import { timesheetsService } from '@/services';
import type { WeeklySummary, TimesheetStatus } from '@/types/database';
import { LoadingSpinner } from '@/components/ui';

interface WeeklyTotalsWidgetProps {
    userId: string;
    weekStart?: string; // ISO date string, defaults to current week
    onDayClick?: (date: string, dayId: string | null) => void;
}

const STATUS_COLORS: Record<TimesheetStatus, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Draft' },
    submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Submitted' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
    processed: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Processed' },
};

export function WeeklyTotalsWidget({ userId, weekStart, onDayClick }: WeeklyTotalsWidgetProps) {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<WeeklySummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
        if (weekStart) return weekStart;
        // Default to start of current week (Sunday)
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day;
        const sunday = new Date(now.setDate(diff));
        return sunday.toISOString().split('T')[0];
    });

    useEffect(() => {
        async function loadSummary() {
            try {
                setLoading(true);
                setError(null);
                const data = await timesheetsService.getWeeklySummary(userId, currentWeekStart);
                setSummary(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load weekly summary');
            } finally {
                setLoading(false);
            }
        }
        loadSummary();
    }, [userId, currentWeekStart]);

    // Navigate weeks
    const goToPreviousWeek = () => {
        const start = new Date(currentWeekStart);
        start.setDate(start.getDate() - 7);
        setCurrentWeekStart(start.toISOString().split('T')[0]);
    };

    const goToNextWeek = () => {
        const start = new Date(currentWeekStart);
        start.setDate(start.getDate() + 7);
        setCurrentWeekStart(start.toISOString().split('T')[0]);
    };

    const goToCurrentWeek = () => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day;
        const sunday = new Date(now.setDate(diff));
        setCurrentWeekStart(sunday.toISOString().split('T')[0]);
    };

    // Format date for display
    const formatDateRange = () => {
        if (!summary) return '';
        const start = new Date(summary.weekStart);
        const end = new Date(summary.weekEnd);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
                <div className="flex items-center justify-center py-4">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                {error}
            </div>
        );
    }

    if (!summary) return null;

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 sm:p-6 text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold">Weekly Hours</h3>
                    <p className="text-slate-400 text-sm">{formatDateRange()}</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-amber-400">{summary.totalHours}</p>
                    <p className="text-slate-400 text-xs">total hours</p>
                </div>
            </div>

            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={goToPreviousWeek}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Previous Week"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={goToCurrentWeek}
                    className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                    This Week
                </button>
                <button
                    onClick={goToNextWeek}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Next Week"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Daily Breakdown */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {summary.days.map((day) => {
                    const isToday = day.date === today;
                    const statusStyle = day.status ? STATUS_COLORS[day.status] : null;

                    return (
                        <button
                            key={day.date}
                            onClick={() => onDayClick?.(day.date, day.dayId)}
                            className={`p-2 sm:p-3 rounded-lg text-center transition-all hover:scale-105 ${isToday
                                    ? 'bg-amber-500/20 ring-2 ring-amber-400'
                                    : 'bg-slate-700/50 hover:bg-slate-700'
                                }`}
                        >
                            <p className="text-xs text-slate-400">{day.dayOfWeek}</p>
                            <p className={`text-lg font-semibold ${day.hours > 0 ? 'text-white' : 'text-slate-500'}`}>
                                {day.hours || '-'}
                            </p>
                            {statusStyle && (
                                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                    {statusStyle.label[0]}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex flex-wrap gap-3 text-xs">
                    {Object.entries(STATUS_COLORS).map(([status, style]) => (
                        <div key={status} className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${style.bg}`}></span>
                            <span className="text-slate-400">{style.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
