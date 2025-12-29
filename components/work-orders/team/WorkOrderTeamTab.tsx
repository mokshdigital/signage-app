'use client';

import { useState, useEffect } from 'react';
import { LoadingSpinner, Alert } from '@/components/ui';
import { workOrdersService } from '@/services/work-orders.service';
import { TeamRoster } from './TeamRoster';
import { TeamChat } from './TeamChat';
import { Lock } from 'lucide-react';

interface WorkOrderFile {
    id: string;
    filename: string;
    category: string;
    url: string;
    mime_type: string;
}

interface WorkOrderTeamTabProps {
    workOrderId: string;
    currentUserId: string;
    workOrderFiles: WorkOrderFile[];
    onNavigateToTab?: (tabName: string) => void;
    canManage?: boolean;
}

export function WorkOrderTeamTab({
    workOrderId,
    currentUserId,
    workOrderFiles,
    onNavigateToTab,
    canManage = true,
}: WorkOrderTeamTabProps) {
    const [isTeamMember, setIsTeamMember] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAccess();
    }, [workOrderId, currentUserId]);

    const checkAccess = async () => {
        setLoading(true);
        try {
            const isMember = await workOrdersService.isTeamMember(workOrderId);
            setIsTeamMember(isMember);
        } catch (err) {
            console.error('Failed to check team membership', err);
            setIsTeamMember(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (!isTeamMember) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Lock className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">Access Restricted</h3>
                <p className="text-sm text-gray-500 text-center max-w-md">
                    You must be a team member (WO Owner, Office Staff, or assigned Technician) to view this tab.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Roster - Left Column (1/3) */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Roster</h3>
                    <TeamRoster
                        workOrderId={workOrderId}
                        onNavigateToTechnicians={onNavigateToTab ? () => onNavigateToTab('technicians') : undefined}
                    />
                </div>
            </div>

            {/* Team Chat - Right Column (2/3) */}
            <div className="lg:col-span-2">
                <TeamChat
                    workOrderId={workOrderId}
                    currentUserId={currentUserId}
                    workOrderFiles={workOrderFiles}
                />
            </div>
        </div>
    );
}

export default WorkOrderTeamTab;
