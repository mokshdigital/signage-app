'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    WorkOrder,
    WorkOrderFile,
    JobType,
    TechnicianUser,
    JobStatus
} from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import {
    Card,
    Badge,
    Input,
    LoadingSpinner,
    Alert,
    TagInput,
    Modal,
    ComingSoon
} from '@/components/ui';
import {
    WorkOrderFilesModal,
    ShipmentManager,
    WorkOrderTasks,
    FileViewerModal,
    ShippingComments,
    WorkOrderFilesCard,
    TabNavigation,
    WorkOrderDetailHeader,
    AISummaryPanel,
    WorkOrderEditModal
} from '@/components/work-orders';
import { toast } from '@/components/providers';
import { useConfirmDialog } from '@/hooks';
import { Button, ConfirmDialog } from '@/components/ui';
import { safeRender } from '@/lib/utils/helpers';

export default function WorkOrderDetailV2Page() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const workOrderId = params.id as string;

    // Get active tab from URL, default to 'tasks'
    const activeTab = searchParams.get('tab') || 'tasks';

    // Main work order state
    const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Files for view WO modal
    const [files, setFiles] = useState<WorkOrderFile[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);

    // AI Summary Panel
    const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);

    // Edit Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Technicians for assignment (from user_profiles)
    const [technicians, setTechnicians] = useState<TechnicianUser[]>([]);
    const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
    const [savingAssignments, setSavingAssignments] = useState(false);
    const [isEditingAssignments, setIsEditingAssignments] = useState(false);
    const [techSearchQuery, setTechSearchQuery] = useState('');

    // Requirements editing state
    const [isEditingRequirements, setIsEditingRequirements] = useState(false);
    const [requirementsData, setRequirementsData] = useState({
        skills_required: [] as string[],
        permits_required: [] as string[],
        equipment_required: [] as string[],
        materials_required: [] as string[],
        recommended_techs: null as number | null
    });
    const [savingRequirements, setSavingRequirements] = useState(false);

    // For delete confirmation
    const { confirm, dialogProps } = useConfirmDialog();

    // Tab configuration with badge counts
    const tabs = useMemo(() => {
        if (!workOrder) return [];

        return [
            { id: 'requirements', label: 'Requirements' },
            { id: 'tasks', label: 'Tasks', badge: workOrder.tasks?.length || 0 },
            { id: 'technicians', label: 'Technicians', badge: workOrder.assignments?.length || 0 },
            { id: 'files', label: 'Files', badge: workOrder.files?.length || 0 },
            { id: 'shipments', label: 'Shipments', badge: workOrder.shipments?.length || 0 },
            { id: 'schedule', label: 'Schedule', disabled: true },
            { id: 'post-completion', label: 'Post-completion', disabled: true }
        ];
    }, [workOrder]);

    // Fetch work order on mount
    useEffect(() => {
        fetchWorkOrder();
        fetchTechnicians();
    }, [workOrderId]);

    const fetchWorkOrder = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await workOrdersService.getById(workOrderId);
            if (!data) {
                setError('Work order not found');
                return;
            }
            setWorkOrder(data);

            // Initialize requirements data
            setRequirementsData({
                skills_required: data.skills_required || [],
                permits_required: data.permits_required || [],
                equipment_required: data.equipment_required || [],
                materials_required: data.materials_required || [],
                recommended_techs: data.recommended_techs || null
            });

            // Initialize selected technicians
            if (data.assignments) {
                setSelectedTechIds(data.assignments.map(a => a.technician_id));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load work order');
        } finally {
            setLoading(false);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const data = await workOrdersService.getTechnicianUsers();
            setTechnicians(data);
        } catch (err) {
            console.error('Failed to fetch technicians:', err);
        }
    };

    // Handle tab change - update URL
    const handleTabChange = useCallback((tabId: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tabId);
        router.push(url.pathname + url.search, { scroll: false });
    }, [router]);

    // View WO files handler
    const handleViewFiles = async () => {
        setLoadingFiles(true);
        setIsFileViewerOpen(true);
        try {
            const data = await workOrdersService.getFiles(workOrderId);
            setFiles(data);
        } catch (err: any) {
            toast.error('Failed to load files');
        } finally {
            setLoadingFiles(false);
        }
    };

    // Status change handler
    const handleStatusChange = async (newStatus: JobStatus, reason?: string) => {
        try {
            await workOrdersService.updateJobStatus(workOrderId, newStatus, reason);
            toast.success(`Status changed to ${newStatus}`);
            await fetchWorkOrder();
        } catch (err: any) {
            toast.error('Failed to update status', { description: err.message });
        }
    };

    // Delete handler
    const handleDelete = async () => {
        const isConfirmed = await confirm({
            title: 'Delete Work Order',
            message: 'Are you sure you want to delete this work order? This will also remove all associated files, tasks, and shipments.',
            variant: 'danger',
            confirmLabel: 'Delete'
        });

        if (isConfirmed) {
            try {
                await workOrdersService.delete(workOrderId);
                toast.success('Work order deleted');
                router.push('/dashboard/work-orders-v2');
            } catch (err: any) {
                toast.error('Failed to delete work order', { description: err.message });
            }
        }
    };

    // Save requirements
    const handleSaveRequirements = async () => {
        if (!workOrder) return;
        setSavingRequirements(true);
        try {
            await workOrdersService.update(workOrderId, requirementsData);
            toast.success('Requirements updated');
            setIsEditingRequirements(false);
            await fetchWorkOrder();
        } catch (err: any) {
            toast.error('Failed to update requirements', { description: err.message });
        } finally {
            setSavingRequirements(false);
        }
    };

    // Save technician assignments
    const handleSaveAssignments = async () => {
        setSavingAssignments(true);
        try {
            await workOrdersService.assignTechnicians(workOrderId, selectedTechIds);
            toast.success('Technicians assigned');
            setIsEditingAssignments(false);
            await fetchWorkOrder();
        } catch (err: any) {
            toast.error('Failed to assign technicians', { description: err.message });
        } finally {
            setSavingAssignments(false);
        }
    };

    const handleTechToggle = (techId: string) => {
        setSelectedTechIds(prev =>
            prev.includes(techId)
                ? prev.filter(id => id !== techId)
                : [...prev, techId]
        );
    };

    // Render tab content based on active tab
    const renderTabContent = (tabId: string) => {
        if (!workOrder) return null;

        switch (tabId) {
            case 'requirements':
                return (
                    <Card
                        title="Work Constraints & Requirements"
                        headerActions={
                            !isEditingRequirements ? (
                                <Button size="sm" variant="ghost" onClick={() => setIsEditingRequirements(true)}>
                                    Edit
                                </Button>
                            ) : null
                        }
                    >
                        {isEditingRequirements ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Skills Required
                                    </label>
                                    <TagInput
                                        value={requirementsData.skills_required}
                                        onChange={(tags) => setRequirementsData(prev => ({ ...prev, skills_required: tags }))}
                                        placeholder="Add skill..."
                                        suggestions={['Electrical', 'Welding', 'High Reach', 'Programming', 'Vinyl Application']}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Permits Required
                                    </label>
                                    <TagInput
                                        value={requirementsData.permits_required}
                                        onChange={(tags) => setRequirementsData(prev => ({ ...prev, permits_required: tags }))}
                                        placeholder="Add permit..."
                                        suggestions={['City Permit', 'Electrical Permit', 'Building Permit', 'Lane Closure']}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Equipment Required
                                    </label>
                                    <TagInput
                                        value={requirementsData.equipment_required}
                                        onChange={(tags) => setRequirementsData(prev => ({ ...prev, equipment_required: tags }))}
                                        placeholder="Add equipment..."
                                        suggestions={['Scissor Lift', 'Bucket Truck', 'Ladder', 'Boom Lift', 'Crane']}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Materials Required
                                    </label>
                                    <TagInput
                                        value={requirementsData.materials_required}
                                        onChange={(tags) => setRequirementsData(prev => ({ ...prev, materials_required: tags }))}
                                        placeholder="Add material..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Recommended No of Technicians
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={requirementsData.recommended_techs || ''}
                                        onChange={(e) => setRequirementsData(prev => ({
                                            ...prev,
                                            recommended_techs: e.target.value ? parseInt(e.target.value) : null
                                        }))}
                                        placeholder="e.g. 2"
                                        className="w-32"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="secondary" onClick={() => setIsEditingRequirements(false)} disabled={savingRequirements}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSaveRequirements} loading={savingRequirements}>
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Skills Required</p>
                                    <div className="flex flex-wrap gap-2">
                                        {workOrder.skills_required && workOrder.skills_required.length > 0 ? (
                                            workOrder.skills_required.map((skill, i) => (
                                                <Badge key={i} variant="default">{skill}</Badge>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">None specified</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Permits Required</p>
                                    <ul className="list-disc list-inside text-sm text-gray-800">
                                        {workOrder.permits_required && workOrder.permits_required.length > 0 ? (
                                            workOrder.permits_required.map((permit, i) => (
                                                <li key={i}>{permit}</li>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">None specified</span>
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Equipment Required</p>
                                    <div className="flex flex-wrap gap-2">
                                        {workOrder.equipment_required && workOrder.equipment_required.length > 0 ? (
                                            workOrder.equipment_required.map((eq, i) => (
                                                <Badge key={i} variant="info">{eq}</Badge>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">None specified</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Materials Required</p>
                                    <ul className="list-disc list-inside text-sm text-gray-800">
                                        {workOrder.materials_required && workOrder.materials_required.length > 0 ? (
                                            workOrder.materials_required.map((mat, i) => (
                                                <li key={i}>{mat}</li>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">None specified</span>
                                        )}
                                    </ul>
                                </div>
                                {workOrder.recommended_techs && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">Recommended Techs</p>
                                        <p className="font-medium text-gray-900">{workOrder.recommended_techs} technicians</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                );

            case 'tasks':
                return (
                    <WorkOrderTasks
                        workOrderId={workOrderId}
                        availableTechnicians={technicians}
                    />
                );

            case 'technicians':
                return (
                    <Card
                        title="Assigned Technicians"
                        headerActions={
                            !isEditingAssignments && selectedTechIds.length > 0 ? (
                                <Button size="sm" variant="ghost" onClick={() => setIsEditingAssignments(true)}>
                                    Edit
                                </Button>
                            ) : null
                        }
                    >
                        <div className="space-y-3">
                            {technicians.length === 0 ? (
                                <p className="text-sm text-gray-500">No technicians available</p>
                            ) : !isEditingAssignments && selectedTechIds.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {technicians
                                        .filter(t => selectedTechIds.includes(t.id))
                                        .map(tech => {
                                            const skills = tech.technician?.[0]?.skills || [];
                                            return (
                                                <div key={tech.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                    {tech.avatar_url ? (
                                                        <img src={tech.avatar_url} alt={tech.display_name} className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                                            {tech.display_name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm">{safeRender(tech.display_name)}</p>
                                                        {skills.length > 0 && (
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {skills.slice(0, 2).join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            ) : (
                                <>
                                    <Input
                                        placeholder="Search technicians..."
                                        value={techSearchQuery}
                                        onChange={(e) => setTechSearchQuery(e.target.value)}
                                        className="mb-2"
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                                        {technicians
                                            .filter(tech => {
                                                const skills = tech.technician?.[0]?.skills || [];
                                                return tech.display_name.toLowerCase().includes(techSearchQuery.toLowerCase()) ||
                                                    skills.some((skill: string) => skill.toLowerCase().includes(techSearchQuery.toLowerCase()));
                                            })
                                            .map(tech => {
                                                const skills = tech.technician?.[0]?.skills || [];
                                                return (
                                                    <label
                                                        key={tech.id}
                                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedTechIds.includes(tech.id)
                                                            ? 'bg-blue-50 border border-blue-200'
                                                            : 'hover:bg-gray-50 border border-transparent'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTechIds.includes(tech.id)}
                                                            onChange={() => handleTechToggle(tech.id)}
                                                            className="w-4 h-4 text-blue-600 rounded"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">
                                                                {safeRender(tech.display_name)}
                                                            </p>
                                                            {skills.length > 0 && (
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    {skills.slice(0, 2).join(', ')}
                                                                    {skills.length > 2 && ` +${skills.length - 2}`}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                    </div>
                                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                                        {selectedTechIds.length > 0 && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => {
                                                    if (workOrder?.assignments) {
                                                        setSelectedTechIds(workOrder.assignments.map(a => a.technician_id));
                                                    } else {
                                                        setSelectedTechIds([]);
                                                    }
                                                    setIsEditingAssignments(false);
                                                }}
                                                disabled={savingAssignments}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            className="flex-1"
                                            onClick={handleSaveAssignments}
                                            loading={savingAssignments}
                                            disabled={JSON.stringify(selectedTechIds.sort()) ===
                                                JSON.stringify((workOrder?.assignments || []).map(a => a.technician_id).sort())}
                                        >
                                            Save Assignments
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                );

            case 'files':
                return <WorkOrderFilesCard workOrderId={workOrderId} />;

            case 'shipments':
                return (
                    <Card title="Shipments & Tracking">
                        <ShippingComments workOrderId={workOrderId} />
                        <div className="border-t border-gray-200 my-4" />
                        <ShipmentManager
                            workOrderId={workOrderId}
                            shipments={workOrder.shipments || []}
                            onShipmentsChange={fetchWorkOrder}
                        />
                    </Card>
                );

            case 'schedule':
                return <ComingSoon title="Schedule" description="Scheduling features coming soon" />;

            case 'post-completion':
                return <ComingSoon title="Post-completion" description="Post-completion workflows coming soon" />;

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !workOrder) {
        return (
            <div className="space-y-4">
                <Alert variant="error" title="Error">
                    {error || 'Work order not found'}
                </Alert>
                <Button onClick={() => router.push('/dashboard/work-orders-v2')}>
                    ← Back to Work Orders
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sticky Header */}
            <WorkOrderDetailHeader
                workOrder={workOrder}
                onStatusChange={handleStatusChange}
                onViewFiles={handleViewFiles}
                onViewAISummary={() => setIsAISummaryOpen(true)}
                onEdit={() => setIsEditModalOpen(true)}
                onDelete={handleDelete}
            />

            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200">
                <TabNavigation
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    renderTabContent={renderTabContent}
                >
                    {/* Desktop tab content */}
                    <div className="p-6">
                        {renderTabContent(activeTab)}
                    </div>
                </TabNavigation>
            </div>

            {/* Modals */}
            <FileViewerModal
                isOpen={isFileViewerOpen}
                onClose={() => setIsFileViewerOpen(false)}
                files={files}
            />

            <AISummaryPanel
                isOpen={isAISummaryOpen}
                onClose={() => setIsAISummaryOpen(false)}
                analysis={workOrder.analysis}
                workOrderNumber={workOrder.work_order_number || undefined}
            />

            <WorkOrderEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                workOrder={workOrder}
                onSave={fetchWorkOrder}
            />

            <ConfirmDialog
                {...dialogProps}
                loading={loading}
            />
        </div>
    );
}
