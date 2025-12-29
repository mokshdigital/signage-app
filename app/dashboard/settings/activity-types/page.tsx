'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Modal, Input, LoadingSpinner, Alert } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { timesheetsService } from '@/services';
import type { ActivityType } from '@/types/database';

// Preset colors for activity types
const PRESET_COLORS = [
    '#3b82f6', // Blue
    '#f59e0b', // Amber
    '#10b981', // Green
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#64748b', // Slate
    '#84cc16', // Lime
];

export default function ActivityTypesPage() {
    const { hasPermission } = usePermissions();
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<ActivityType | null>(null);

    // Form state
    const [formData, setFormData] = useState({ name: '', color: '#3b82f6', requires_wo: false });
    const [isSaving, setIsSaving] = useState(false);

    const loadActivityTypes = useCallback(async () => {
        try {
            setLoading(true);
            const data = await timesheetsService.getActivityTypes(true); // include inactive
            setActivityTypes(data);
            setError(null);
        } catch (err) {
            setError('Failed to load activity types');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadActivityTypes();
    }, [loadActivityTypes]);

    const handleOpenCreate = () => {
        setEditingType(null);
        setFormData({ name: '', color: PRESET_COLORS[0], requires_wo: false });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (type: ActivityType) => {
        setEditingType(type);
        setFormData({ name: type.name, color: type.color, requires_wo: type.requires_wo });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) return;

        try {
            setIsSaving(true);
            if (editingType) {
                await timesheetsService.updateActivityType(editingType.id, formData);
            } else {
                await timesheetsService.createActivityType(formData);
            }
            await loadActivityTypes();
            setIsModalOpen(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save activity type');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (type: ActivityType) => {
        try {
            await timesheetsService.updateActivityType(type.id, { is_active: !type.is_active });
            await loadActivityTypes();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update activity type');
        }
    };

    // Permission check
    const canManage = hasPermission('settings:manage_activity_types') || hasPermission('settings:manage') || hasPermission('roles:manage');

    if (!canManage) {
        return <Alert variant="error">You do not have permission to manage activity types.</Alert>;
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Activity Types</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage activity types for timesheet entries</p>
                </div>
                <Button onClick={handleOpenCreate}>+ New Activity Type</Button>
            </div>

            {error && (
                <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <div className="grid gap-4">
                {activityTypes.map((type) => (
                    <Card key={type.id} className={`p-4 flex justify-between items-center ${!type.is_active ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                                style={{ backgroundColor: type.color }}
                            />
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    {type.name}
                                    {!type.is_active && (
                                        <span className="ml-2 text-xs text-gray-500 font-normal">(hidden)</span>
                                    )}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {type.requires_wo && (
                                        <span className="inline-flex px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                            Requires WO
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(type)}
                            >
                                {type.is_active ? 'Hide' : 'Show'}
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(type)}>
                                Edit
                            </Button>
                        </div>
                    </Card>
                ))}

                {activityTypes.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        No activity types found. Create one to get started.
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingType ? 'Edit Activity Type' : 'New Activity Type'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Installation, Survey, Pickup"
                        />
                    </div>

                    {/* Requires WO Checkbox */}
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="requires_wo"
                            checked={formData.requires_wo}
                            onChange={e => setFormData({ ...formData, requires_wo: e.target.checked })}
                            className="mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="requires_wo" className="flex-1">
                            <span className="block text-sm font-medium text-gray-700">Show WO dropdown</span>
                            <span className="block text-xs text-gray-500 mt-0.5">
                                When checked, users will see a Work Order dropdown when logging this activity type
                            </span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.color === color
                                            ? 'border-gray-900 scale-110 ring-2 ring-offset-2 ring-gray-400'
                                            : 'border-white shadow-md hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <label className="text-sm text-gray-500">Custom:</label>
                            <input
                                type="color"
                                value={formData.color}
                                onChange={e => setFormData({ ...formData, color: e.target.value })}
                                className="w-10 h-8 cursor-pointer"
                            />
                            <span className="text-sm text-gray-500 font-mono">{formData.color}</span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving || !formData.name}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
