'use client';

import { useState } from 'react';
import { timesheetsService } from '@/services';
import { Button, LoadingSpinner } from '@/components/ui';

interface PastDayRequestFormProps {
    userId: string;
    onRequestCreated?: () => void;
}

export function PastDayRequestForm({ userId, onRequestCreated }: PastDayRequestFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [selectedDate, setSelectedDate] = useState<string>('');
    const [reason, setReason] = useState<string>('');

    // Get max date (yesterday)
    const getMaxDate = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    };

    // Get min date (30 days ago - reasonable limit)
    const getMinDate = () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return thirtyDaysAgo.toISOString().split('T')[0];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedDate) {
            setError('Please select a date');
            return;
        }
        if (!reason.trim()) {
            setError('Please provide a reason for accessing this past day');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(false);

            await timesheetsService.createPastDayRequest(userId, selectedDate, reason.trim());

            setSuccess(true);
            setSelectedDate('');
            setReason('');
            onRequestCreated?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Request Past Day Edit</h3>
            <p className="text-sm text-slate-500 mb-4">
                Need to log time for a previous day? Submit a request and wait for supervisor approval.
            </p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                    ✓ Request submitted! You&apos;ll be notified when it&apos;s reviewed.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Date <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={getMinDate()}
                        max={getMaxDate()}
                        disabled={loading}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                        You can request dates from the past 30 days.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={loading}
                        rows={3}
                        placeholder="Explain why you need to edit this past day..."
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100 resize-none"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={loading || !selectedDate || !reason.trim()}
                    className="w-full"
                >
                    {loading ? (
                        <>
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Submitting...</span>
                        </>
                    ) : (
                        'Submit Request'
                    )}
                </Button>
            </form>
        </div>
    );
}
