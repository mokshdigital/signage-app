'use client';

import { useState, useEffect } from 'react';
import { Button, LoadingSpinner, Avatar, Alert } from '@/components/ui';
import { workOrdersService } from '@/services/work-orders.service';
import { X, Plus, User, Users, Wrench } from 'lucide-react';

interface TeamRosterProps {
    workOrderId: string;
    onNavigateToTechnicians?: () => void;
}

interface TeamMember {
    id: string;
    display_name: string;
    avatar_url: string | null;
}

export function TeamRoster({ workOrderId, onNavigateToTechnicians }: TeamRosterProps) {
    const [owner, setOwner] = useState<TeamMember | null>(null);
    const [officeStaff, setOfficeStaff] = useState<{ recordId: string; member: TeamMember }[]>([]);
    const [technicians, setTechnicians] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add staff state
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [availableStaff, setAvailableStaff] = useState<TeamMember[]>([]);
    const [loadingAvailable, setLoadingAvailable] = useState(false);
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);

    useEffect(() => {
        fetchRoster();
    }, [workOrderId]);

    const fetchRoster = async () => {
        setLoading(true);
        setError(null);
        try {
            const roster = await workOrdersService.getFullTeamRoster(workOrderId);
            setOwner(roster.owner);
            setOfficeStaff(roster.officeStaff.map(s => ({
                recordId: s.id,
                member: s.user_profile
            })));
            setTechnicians(roster.technicians.map(t => t.user_profile));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleShowAddStaff = async () => {
        setShowAddStaff(true);
        setLoadingAvailable(true);
        try {
            const allStaff = await workOrdersService.getOfficeStaffUsers();
            // Filter out already assigned and owner
            const existingIds = new Set([
                owner?.id,
                ...officeStaff.map(s => s.member.id)
            ].filter(Boolean));
            setAvailableStaff(allStaff.filter(s => !existingIds.has(s.id)));
        } catch (err) {
            console.error('Failed to load available staff', err);
        } finally {
            setLoadingAvailable(false);
        }
    };

    const handleAddStaff = async (staffId: string) => {
        setAdding(true);
        try {
            await workOrdersService.addTeamMembers(workOrderId, [staffId]);
            await fetchRoster();
            setShowAddStaff(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveStaff = async (recordId: string, memberName: string) => {
        if (!confirm(`Remove ${memberName} from the team?`)) return;

        setRemoving(recordId);
        try {
            const staff = officeStaff.find(s => s.recordId === recordId);
            if (staff) {
                await workOrdersService.removeTeamMember(workOrderId, staff.member.id);
                await fetchRoster();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setRemoving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
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

            {/* WO Owner */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">WO Owner</h4>
                </div>
                {owner ? (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 border border-blue-100">
                        <Avatar src={owner.avatar_url} alt={owner.display_name} size="sm" />
                        <span className="text-sm font-medium text-gray-900">{owner.display_name}</span>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No owner assigned</p>
                )}
            </div>

            {/* Office Staff */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Office Staff</h4>
                    </div>
                </div>

                {officeStaff.length === 0 ? (
                    <p className="text-sm text-gray-500 italic mb-2">No office staff assigned</p>
                ) : (
                    <div className="space-y-2 mb-3">
                        {officeStaff.map(({ recordId, member }) => (
                            <div
                                key={recordId}
                                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 group"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar src={member.avatar_url} alt={member.display_name} size="sm" />
                                    <span className="text-sm font-medium text-gray-900">{member.display_name}</span>
                                </div>
                                <button
                                    onClick={() => handleRemoveStaff(recordId, member.display_name)}
                                    disabled={removing === recordId}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                    title="Remove from team"
                                >
                                    {removing === recordId ? (
                                        <LoadingSpinner />
                                    ) : (
                                        <X className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Staff Button / Selector */}
                {showAddStaff ? (
                    <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                        <p className="text-sm font-medium text-gray-700 mb-2">Select team member to add:</p>
                        {loadingAvailable ? (
                            <div className="flex items-center gap-2 py-2">
                                <LoadingSpinner />
                                <span className="text-sm text-gray-500">Loading...</span>
                            </div>
                        ) : availableStaff.length === 0 ? (
                            <p className="text-sm text-gray-500">No available staff to add</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {availableStaff.map(staff => (
                                    <button
                                        key={staff.id}
                                        onClick={() => handleAddStaff(staff.id)}
                                        disabled={adding}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50"
                                    >
                                        <Avatar src={staff.avatar_url} alt={staff.display_name} size="xs" />
                                        {staff.display_name}
                                    </button>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={() => setShowAddStaff(false)}
                            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleShowAddStaff}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Staff
                    </button>
                )}
            </div>

            {/* Technicians */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-4 h-4 text-gray-500" />
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Technicians</h4>
                </div>

                {technicians.length === 0 ? (
                    <div className="text-sm text-gray-500">
                        <p className="italic mb-2">No technicians assigned yet.</p>
                        {onNavigateToTechnicians && (
                            <button
                                onClick={onNavigateToTechnicians}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                Go to Technicians tab to assign →
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {technicians.map(tech => (
                            <div
                                key={tech.id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-100"
                            >
                                <Avatar src={tech.avatar_url} alt={tech.display_name} size="sm" />
                                <span className="text-sm font-medium text-gray-900">{tech.display_name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeamRoster;
