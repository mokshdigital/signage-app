'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Modal, Input, LoadingSpinner, Alert } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { timesheetsService } from '@/services';
import type { LocationChip } from '@/types/database';

// Preset colors for location chips
const PRESET_COLORS = [
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#10b981', // Green
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#64748b', // Slate
    '#84cc16', // Lime
];

export default function LocationsPage() {
    const { hasPermission } = usePermissions();
    const [locations, setLocations] = useState<LocationChip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<LocationChip | null>(null);

    // Form state
    const [formData, setFormData] = useState({ name: '', color: '#f59e0b' });
    const [isSaving, setIsSaving] = useState(false);

    const loadLocations = useCallback(async () => {
        try {
            setLoading(true);
            const data = await timesheetsService.getLocationChips(true); // include inactive
            setLocations(data);
            setError(null);
        } catch (err) {
            setError('Failed to load locations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLocations();
    }, [loadLocations]);

    const handleOpenCreate = () => {
        setEditingLocation(null);
        setFormData({ name: '', color: PRESET_COLORS[0] });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (location: LocationChip) => {
        setEditingLocation(location);
        setFormData({ name: location.name, color: location.color });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) return;

        try {
            setIsSaving(true);
            if (editingLocation) {
                await timesheetsService.updateLocationChip(editingLocation.id, formData);
            } else {
                await timesheetsService.createLocationChip(formData.name, formData.color);
            }
            await loadLocations();
            setIsModalOpen(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save location');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (location: LocationChip) => {
        try {
            await timesheetsService.updateLocationChip(location.id, { is_active: !location.is_active });
            await loadLocations();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update location');
        }
    };

    // Permission check
    const canManage = hasPermission('settings:manage_locations') || hasPermission('settings:manage') || hasPermission('roles:manage');

    if (!canManage) {
        return <Alert variant="error">You do not have permission to manage locations.</Alert>;
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Location Chips</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage locations for timesheet entries</p>
                </div>
                <Button onClick={handleOpenCreate}>+ New Location</Button>
            </div>

            {error && (
                <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <div className="grid gap-4">
                {locations.map((location) => (
                    <Card key={location.id} className={`p-4 flex justify-between items-center ${!location.is_active ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                                style={{ backgroundColor: location.color }}
                            />
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    {location.name}
                                    {!location.is_active && (
                                        <span className="ml-2 text-xs text-gray-500 font-normal">(hidden)</span>
                                    )}
                                </h3>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(location)}
                            >
                                {location.is_active ? 'Hide' : 'Show'}
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(location)}>
                                Edit
                            </Button>
                        </div>
                    </Card>
                ))}

                {locations.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        No locations found. Create one to get started.
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingLocation ? 'Edit Location' : 'New Location'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Shop, Site, Warehouse"
                        />
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
