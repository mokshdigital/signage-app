'use client';

import { useState, useEffect } from 'react';
import { Button, LoadingSpinner, Alert } from '@/components/ui';
import { workOrdersService } from '@/services/work-orders.service';
import { X, User, Check } from 'lucide-react';

interface TeamMemberOption {
    id: string;
    display_name: string;
    avatar_url: string | null;
}

interface TeamSelectionStepProps {
    workOrderId: string;
    ownerId: string | null;
    ownerName: string | null;
    onComplete: () => void;
    onSkip: () => void;
}

/**
 * Step 3 of WO upload wizard: Select office staff team members
 */
export function TeamSelectionStep({
    workOrderId,
    ownerId,
    ownerName,
    onComplete,
    onSkip
}: TeamSelectionStepProps) {
    const [availableStaff, setAvailableStaff] = useState<TeamMemberOption[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch available office staff (excluding WO owner)
    useEffect(() => {
        const fetchStaff = async () => {
            setLoading(true);
            try {
                const staff = await workOrdersService.getOfficeStaffUsers();
                // Filter out the WO owner
                const filteredStaff = staff.filter(s => s.id !== ownerId);
                setAvailableStaff(filteredStaff);
            } catch (err: any) {
                setError(err.message || 'Failed to load team members');
            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, [ownerId]);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const handleFinish = async () => {
        setSaving(true);
        try {
            if (selectedIds.length > 0) {
                await workOrdersService.addTeamMembers(workOrderId, selectedIds);
            }
            onComplete();
        } catch (err: any) {
            setError(err.message || 'Failed to save team members');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner />
                <span className="mt-3 text-gray-500 text-sm">Loading team members...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="error" title="Error" dismissible onDismiss={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* WO Owner Display */}
            {ownerName && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-800">{ownerName}</p>
                            <p className="text-xs text-blue-600">WO Owner (auto-assigned)</p>
                        </div>
                        <Check className="ml-auto w-5 h-5 text-blue-600" />
                    </div>
                </div>
            )}

            {/* Team Selection */}
            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Add additional team members (optional)
                </h3>

                {availableStaff.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">
                        No additional office staff available.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {availableStaff.map(staff => {
                            const isSelected = selectedIds.includes(staff.id);
                            return (
                                <button
                                    key={staff.id}
                                    type="button"
                                    onClick={() => toggleSelection(staff.id)}
                                    className={`
                                        inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-all
                                        ${isSelected
                                            ? 'bg-blue-100 border-blue-400 text-blue-800'
                                            : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                                        }
                                    `}
                                >
                                    {staff.avatar_url ? (
                                        <img
                                            src={staff.avatar_url}
                                            alt=""
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className={`
                                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                            ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                                        `}>
                                            {staff.display_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span>{staff.display_name}</span>
                                    {isSelected && (
                                        <X className="w-4 h-4 text-blue-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Summary */}
            {selectedIds.length > 0 && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <strong>{selectedIds.length}</strong> team member{selectedIds.length > 1 ? 's' : ''} selected
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-gray-100">
                <Button variant="ghost" onClick={onSkip} disabled={saving}>
                    Skip for now
                </Button>
                <Button onClick={handleFinish} loading={saving}>
                    {selectedIds.length > 0 ? 'Add Team & Finish' : 'Finish'}
                </Button>
            </div>
        </div>
    );
}

export default TeamSelectionStep;
