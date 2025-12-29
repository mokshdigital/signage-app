'use client';

import { useState, useEffect as useEffectReact } from 'react';
import { timesheetsService } from '@/services';
import type { ActivityType, LocationChip, TimesheetEntry, WorkOrder } from '@/types/database';
import { Button, LoadingSpinner } from '@/components/ui';

interface LogTimeFormProps {
    userId: string;
    date: string; // ISO date string (YYYY-MM-DD)
    onEntryCreated?: (entry: TimesheetEntry) => void;
    disabled?: boolean;
}

export function LogTimeForm({ userId, date, onEntryCreated, disabled = false }: LogTimeFormProps) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dropdown data
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
    const [locationChips, setLocationChips] = useState<LocationChip[]>([]);
    const [assignedWOs, setAssignedWOs] = useState<Pick<WorkOrder, 'id' | 'work_order_number' | 'site_address' | 'job_status'>[]>([]);

    // Form state
    const [selectedActivityId, setSelectedActivityId] = useState<string>('');
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');
    const [selectedWOId, setSelectedWOId] = useState<string>(''); // empty = General
    const [hours, setHours] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    // Computed: does selected activity require WO?
    const selectedActivity = activityTypes.find(a => a.id === selectedActivityId);
    const showWODropdown = selectedActivity?.requires_wo ?? false;

    // Load dropdown data
    useEffectReact(() => {
        async function loadData() {
            try {
                setLoading(true);
                const [activities, locations, workOrders] = await Promise.all([
                    timesheetsService.getActivityTypes(),
                    timesheetsService.getLocationChips(),
                    timesheetsService.getMyAssignedWorkOrders(userId),
                ]);
                setActivityTypes(activities);
                setLocationChips(locations);
                setAssignedWOs(workOrders);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load form data');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [userId]);

    // Validate hours (0.25 increments)
    const validateHours = (value: string): boolean => {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0 || num > 24) return false;
        // Check 0.25 increments
        return (num * 100) % 25 === 0;
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (disabled) return;

        // Validation
        if (!selectedActivityId) {
            setError('Please select an activity type');
            return;
        }
        if (!selectedLocationId) {
            setError('Please select a location');
            return;
        }
        if (!validateHours(hours)) {
            setError('Hours must be in 0.25 increments (e.g., 0.25, 0.5, 1.75)');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // Get or create the timesheet day
            const day = await timesheetsService.getOrCreateDay(userId, date);

            // Create entry
            const entry = await timesheetsService.createEntry({
                timesheet_day_id: day.id,
                activity_type_id: selectedActivityId,
                location_chip_id: selectedLocationId,
                work_order_id: selectedWOId || null, // empty = General
                hours: parseFloat(hours),
                notes: notes || undefined,
            });

            // Reset form
            setSelectedActivityId('');
            setSelectedLocationId('');
            setSelectedWOId('');
            setHours('');
            setNotes('');

            onEntryCreated?.(entry);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create entry');
        } finally {
            setSubmitting(false);
        }
    };

    // Hour increment buttons
    const hourOptions = [0.25, 0.5, 1, 2, 4, 8];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Activity Type Dropdown */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Activity Type <span className="text-red-500">*</span>
                </label>
                <select
                    value={selectedActivityId}
                    onChange={(e) => {
                        setSelectedActivityId(e.target.value);
                        // Reset WO selection when activity changes
                        setSelectedWOId('');
                    }}
                    disabled={disabled || submitting}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100"
                >
                    <option value="">Select an activity...</option>
                    {activityTypes.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                            {activity.name}
                            {activity.requires_wo ? ' (requires WO)' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Work Order Dropdown (conditional) */}
            {showWODropdown && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Work Order
                    </label>
                    <select
                        value={selectedWOId}
                        onChange={(e) => setSelectedWOId(e.target.value)}
                        disabled={disabled || submitting}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100"
                    >
                        <option value="">General (not linked to WO)</option>
                        {assignedWOs.map((wo) => (
                            <option key={wo.id} value={wo.id}>
                                {wo.work_order_number || 'No WO#'} - {wo.site_address || 'No address'}
                            </option>
                        ))}
                    </select>
                    {assignedWOs.length === 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                            No work orders assigned to you. Select &quot;General&quot; or contact your supervisor.
                        </p>
                    )}
                </div>
            )}

            {/* Location Chips */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Location <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {locationChips.map((chip) => (
                        <button
                            key={chip.id}
                            type="button"
                            onClick={() => setSelectedLocationId(chip.id)}
                            disabled={disabled || submitting}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedLocationId === chip.id
                                    ? 'ring-2 ring-offset-2 ring-amber-500 scale-105'
                                    : 'hover:scale-105'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            style={{
                                backgroundColor: chip.color,
                                color: isLightColor(chip.color) ? '#1e293b' : '#ffffff',
                            }}
                        >
                            {chip.name}
                        </button>
                    ))}
                </div>
                {locationChips.length === 0 && (
                    <p className="text-sm text-slate-500 mt-2">
                        No locations configured. Please contact an administrator.
                    </p>
                )}
            </div>

            {/* Hours Input */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hours <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {hourOptions.map((h) => (
                        <button
                            key={h}
                            type="button"
                            onClick={() => setHours(h.toString())}
                            disabled={disabled || submitting}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${hours === h.toString()
                                    ? 'bg-amber-500 text-white border-amber-500'
                                    : 'bg-white text-slate-700 border-slate-300 hover:border-amber-400'
                                } disabled:opacity-50`}
                        >
                            {h}h
                        </button>
                    ))}
                </div>
                <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    disabled={disabled || submitting}
                    placeholder="Or enter custom hours..."
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100"
                />
                <p className="mt-1 text-xs text-slate-500">
                    Must be in 0.25 hour increments (e.g., 0.25, 0.5, 0.75, 1, 1.25...)
                </p>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes (optional)
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={disabled || submitting}
                    rows={2}
                    placeholder="Add any notes about this time entry..."
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100 resize-none"
                />
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={disabled || submitting || !selectedActivityId || !selectedLocationId || !hours}
                className="w-full"
            >
                {submitting ? (
                    <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Adding...</span>
                    </>
                ) : (
                    'Add Time Entry'
                )}
            </Button>
        </form>
    );
}

// Helper: determine if color is light (for text contrast)
function isLightColor(hex: string): boolean {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
}
