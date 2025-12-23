'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    WorkOrder,
    WorkOrderFile,
    JobType,
    WorkOrderAssignment,
    WorkOrderShipment,
    TechnicianUser,
    JobStatus
} from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import {
    Button,
    Card,
    Badge,
    Input,
    LoadingSpinner,
    Alert,
    TagInput,
    Modal,
    Textarea
} from '@/components/ui';
import {
    WorkOrderFilesModal,
    WorkOrderAnalysisModal,
    ShipmentManager,
    WorkOrderTasks,
    FileViewerModal,
    ShippingComments,
    WorkOrderFilesCard,
    WorkOrderTeamTab
} from '@/components/work-orders';
import { toast } from '@/components/providers';
import { safeRender } from '@/lib/utils/helpers';
import { createClient } from '@/lib/supabase/client';

export default function WorkOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const workOrderId = params.id as string;

    // Main work order state
    const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        work_order_number: '',
        site_address: '',
        planned_date: '',
        work_order_date: '',
        job_type_id: '',
        skills_required: [] as string[],
        permits_required: [] as string[],
        equipment_required: [] as string[],
        materials_required: [] as string[],
        recommended_techs: null as number | null
    });
    const [saving, setSaving] = useState(false);

    // Job Types
    const [jobTypes, setJobTypes] = useState<JobType[]>([]);

    // Technicians for assignment (from user_profiles)
    const [technicians, setTechnicians] = useState<TechnicianUser[]>([]);
    const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
    const [savingAssignments, setSavingAssignments] = useState(false);
    const [isEditingAssignments, setIsEditingAssignments] = useState(false);
    const [techSearchQuery, setTechSearchQuery] = useState('');

    // Files modal
    const [isFilesOpen, setIsFilesOpen] = useState(false);
    const [files, setFiles] = useState<WorkOrderFile[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // Analysis modal
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

    // File viewer modal
    const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);

    // Job Status modal
    const [isJobStatusModalOpen, setIsJobStatusModalOpen] = useState(false);
    const [pendingJobStatus, setPendingJobStatus] = useState<JobStatus | null>(null);
    const [jobStatusReason, setJobStatusReason] = useState('');
    const [savingJobStatus, setSavingJobStatus] = useState(false);

    // Team Tab state
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [teamFiles, setTeamFiles] = useState<{ id: string; filename: string; category: string; url: string; mime_type: string }[]>([]);

    // Job Status helper
    const JOB_STATUSES: JobStatus[] = ['Open', 'Active', 'On Hold', 'Completed', 'Submitted', 'Invoiced', 'Cancelled'];
    const statusColors: Record<JobStatus, string> = {
        'Open': 'bg-blue-100 text-blue-800',
        'Active': 'bg-green-100 text-green-800',
        'On Hold': 'bg-yellow-100 text-yellow-800',
        'Completed': 'bg-purple-100 text-purple-800',
        'Submitted': 'bg-indigo-100 text-indigo-800',
        'Invoiced': 'bg-emerald-100 text-emerald-800',
        'Cancelled': 'bg-red-100 text-red-800'
    };

    // Fetch work order on mount
    useEffect(() => {
        fetchWorkOrder();
        fetchJobTypes();
        fetchTechnicians();
        fetchCurrentUser();
    }, [workOrderId]);

    const fetchCurrentUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
    };

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

            // Initialize edit data
            setEditData({
                work_order_number: data.work_order_number || '',
                site_address: data.site_address || '',
                planned_date: data.planned_dates?.[0] || '',
                work_order_date: data.work_order_date || '',
                job_type_id: data.job_type_id || '',
                skills_required: data.skills_required || [],
                permits_required: data.permits_required || [],
                equipment_required: data.equipment_required || [],
                materials_required: data.materials_required || [],
                recommended_techs: data.recommended_techs || null
            });

            // Initialize selected technicians
            if (data.assignments) {
                setSelectedTechIds(data.assignments.map(a => a.user_profile_id));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load work order');
        } finally {
            setLoading(false);
        }
    };

    const fetchJobTypes = async () => {
        try {
            const data = await workOrdersService.getJobTypes();
            setJobTypes(data);
        } catch (err) {
            console.error('Failed to fetch job types:', err);
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

    const handleViewFiles = async () => {
        setIsFilesOpen(true);
        setLoadingFiles(true);
        try {
            const data = await workOrdersService.getFiles(workOrderId);
            setFiles(data);
        } catch (err: any) {
            toast.error('Failed to load files');
        } finally {
            setLoadingFiles(false);
        }
    };

    const fetchTeamFiles = async () => {
        try {
            const data = await workOrdersService.getFiles(workOrderId);
            setTeamFiles(data.map(f => ({
                id: f.id,
                filename: f.file_name || 'Unnamed file',
                category: f.category?.name || 'Uncategorized',
                url: f.file_url,
                mime_type: f.mime_type || 'application/octet-stream'
            })));
        } catch (err) {
            console.error('Failed to load team files', err);
        }
    };

    // Fetch team files when work order loads
    useEffect(() => {
        if (workOrderId) {
            fetchTeamFiles();
        }
    }, [workOrderId]);

    const handleSaveDetails = async () => {
        if (!workOrder) return;

        setSaving(true);
        try {
            await workOrdersService.update(workOrderId, {
                work_order_number: editData.work_order_number || null,
                site_address: editData.site_address || null,
                planned_dates: editData.planned_date ? [editData.planned_date] : null,
                work_order_date: editData.work_order_date || null,
                job_type_id: editData.job_type_id || null,
                skills_required: editData.skills_required,
                permits_required: editData.permits_required,
                equipment_required: editData.equipment_required,
                materials_required: editData.materials_required,
                recommended_techs: editData.recommended_techs
            });
            toast.success('Work order updated');
            setIsEditing(false);
            await fetchWorkOrder();
        } catch (err: any) {
            toast.error('Failed to update work order', { description: err.message });
        } finally {
            setSaving(false);
        }
    };

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

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString();
    };

    const handleJobStatusChange = async (newStatus: JobStatus) => {
        // If status requires reason, open modal
        if (newStatus === 'On Hold' || newStatus === 'Cancelled') {
            setPendingJobStatus(newStatus);
            setJobStatusReason('');
            setIsJobStatusModalOpen(true);
            return;
        }

        // Otherwise update directly
        setSavingJobStatus(true);
        try {
            await workOrdersService.updateJobStatus(workOrderId, newStatus);
            toast.success(`Status changed to ${newStatus}`);
            await fetchWorkOrder();
        } catch (err: any) {
            toast.error('Failed to update status', { description: err.message });
        } finally {
            setSavingJobStatus(false);
        }
    };

    const handleJobStatusReasonSubmit = async () => {
        if (!pendingJobStatus || !jobStatusReason.trim()) {
            toast.error('Please provide a reason');
            return;
        }

        setSavingJobStatus(true);
        try {
            await workOrdersService.updateJobStatus(workOrderId, pendingJobStatus, jobStatusReason.trim());
            toast.success(`Status changed to ${pendingJobStatus}`);
            setIsJobStatusModalOpen(false);
            setPendingJobStatus(null);
            setJobStatusReason('');
            await fetchWorkOrder();
        } catch (err: any) {
            toast.error('Failed to update status', { description: err.message });
        } finally {
            setSavingJobStatus(false);
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
                <Button onClick={() => router.push('/dashboard/work-orders')}>
                    ← Back to Work Orders
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard/work-orders')}
                        className="mb-2"
                    >
                        ← Back
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {workOrder.work_order_number
                            ? `WO: ${safeRender(workOrder.work_order_number)}`
                            : 'Work Order Details'
                        }
                    </h1>
                    <p className="text-sm text-gray-500">
                        Created {new Date(workOrder.created_at).toLocaleString()}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="primary" onClick={() => { handleViewFiles(); setIsFileViewerOpen(true); }}>
                        View WO
                    </Button>
                </div>
            </div>

            {/* Quick Status */}
            <div className="flex gap-3 flex-wrap items-center">
                <Badge variant={workOrder.processed ? 'success' : 'warning'} dot>
                    {workOrder.processed ? 'AI Analyzed' : 'Pending Analysis'}
                </Badge>
                {workOrder.client_id && (
                    <Badge variant="info">Client Assigned</Badge>
                )}
                {workOrder.job_type && (
                    <Badge variant="default">{safeRender(workOrder.job_type.name)}</Badge>
                )}

                {/* Job Status Dropdown */}
                <div className="relative">
                    <select
                        value={workOrder.job_status || 'Open'}
                        onChange={(e) => handleJobStatusChange(e.target.value as JobStatus)}
                        disabled={savingJobStatus}
                        className={`${statusColors[workOrder.job_status || 'Open']} px-3 py-1 rounded-full text-sm font-medium cursor-pointer border-0 appearance-none pr-6 focus:ring-2 focus:ring-blue-500`}
                    >
                        {JOB_STATUSES.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs">▼</span>
                </div>

                {/* Show reason if on hold or cancelled */}
                {(workOrder.job_status === 'On Hold' || workOrder.job_status === 'Cancelled') && workOrder.job_status_reason && (
                    <span className="text-sm text-gray-500 italic">
                        Reason: {safeRender(workOrder.job_status_reason)}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details - 2 columns on large screens */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Work Order Details Card */}
                    <Card
                        title="Work Order Details"
                        headerActions={
                            !isEditing ? (
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                                    Edit
                                </Button>
                            ) : null
                        }
                    >
                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Work Order Number
                                        </label>
                                        <Input
                                            value={editData.work_order_number}
                                            onChange={(e) => setEditData(prev => ({ ...prev, work_order_number: e.target.value }))}
                                            placeholder="e.g., WO-2024-001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Job Type
                                        </label>
                                        <select
                                            value={editData.job_type_id}
                                            onChange={(e) => setEditData(prev => ({ ...prev, job_type_id: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select type...</option>
                                            {jobTypes.map(jt => (
                                                <option key={jt.id} value={jt.id}>{jt.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Site Address
                                    </label>
                                    <Input
                                        value={editData.site_address}
                                        onChange={(e) => setEditData(prev => ({ ...prev, site_address: e.target.value }))}
                                        placeholder="Full job site address"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Work Order Date
                                        </label>
                                        <Input
                                            type="date"
                                            value={editData.work_order_date}
                                            onChange={(e) => setEditData(prev => ({ ...prev, work_order_date: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Planned Date
                                        </label>
                                        <Input
                                            type="date"
                                            value={editData.planned_date}
                                            onChange={(e) => setEditData(prev => ({ ...prev, planned_date: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSaveDetails} loading={saving}>
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">WO Number</p>
                                    <p className="font-medium">{safeRender(workOrder.work_order_number) || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Job Type</p>
                                    <p className="font-medium">
                                        {workOrder.job_type ? safeRender(workOrder.job_type.name) : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Client</p>
                                    <p className="font-medium text-blue-600">
                                        {workOrder.client ? safeRender(workOrder.client.name) : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Project Manager</p>
                                    <p className="font-medium">
                                        {workOrder.project_manager ? safeRender(workOrder.project_manager.name) : '-'}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Site Address</p>
                                    <p className="font-medium">{safeRender(workOrder.site_address) || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">WO Date</p>
                                    <p className="font-medium">{formatDate(workOrder.work_order_date)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Planned Date</p>
                                    <p className="font-medium">{workOrder.planned_dates && workOrder.planned_dates.length > 0 ? formatDate(workOrder.planned_dates[0]) : '-'}</p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Requirements Section */}
                    <Card
                        title="Work Constraints & Requirements"
                        headerActions={
                            !isEditing ? (
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                                    Edit
                                </Button>
                            ) : null
                        }
                    >
                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Skills Required
                                    </label>
                                    <TagInput
                                        value={editData.skills_required}
                                        onChange={(tags) => setEditData(prev => ({ ...prev, skills_required: tags }))}
                                        placeholder="Add skill..."
                                        suggestions={['Electrical', 'Welding', 'High Reach', 'Programming', 'Vinyl Application']}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Permits Required
                                    </label>
                                    <TagInput
                                        value={editData.permits_required}
                                        onChange={(tags) => setEditData(prev => ({ ...prev, permits_required: tags }))}
                                        placeholder="Add permit..."
                                        suggestions={['City Permit', 'Electrical Permit', 'Building Permit', 'Lane Closure']}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Equipment Required
                                    </label>
                                    <TagInput
                                        value={editData.equipment_required}
                                        onChange={(tags) => setEditData(prev => ({ ...prev, equipment_required: tags }))}
                                        placeholder="Add equipment..."
                                        suggestions={['Scissor Lift', 'Bucket Truck', 'Ladder', 'Boom Lift', 'Crane']}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Materials Required
                                    </label>
                                    <TagInput
                                        value={editData.materials_required}
                                        onChange={(tags) => setEditData(prev => ({ ...prev, materials_required: tags }))}
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
                                        value={editData.recommended_techs || ''}
                                        onChange={(e) => setEditData(prev => ({
                                            ...prev,
                                            recommended_techs: e.target.value ? parseInt(e.target.value) : null
                                        }))}
                                        placeholder="e.g. 2"
                                        className="w-32"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSaveDetails} loading={saving}>
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

                    {/* Files Section */}
                    <WorkOrderFilesCard workOrderId={workOrderId} />

                    {/* Tasks Section */}
                    <WorkOrderTasks
                        workOrderId={workOrderId}
                        availableTechnicians={technicians}
                    />

                    {/* Shipments Section */}
                    <Card title="Shipments & Tracking">
                        {/* Shipping Comments */}
                        <ShippingComments workOrderId={workOrderId} />

                        {/* Divider */}
                        <div className="border-t border-gray-200 my-4" />

                        {/* Shipment Tracking */}
                        <ShipmentManager
                            workOrderId={workOrderId}
                            shipments={workOrder.shipments || []}
                            onShipmentsChange={fetchWorkOrder}
                        />
                    </Card>
                </div>

                {/* Sidebar - 1 column */}
                <div className="space-y-6">
                    {/* WO Owner */}
                    <Card title="WO Owner">
                        <div className="flex items-center gap-3">
                            {workOrder.owner?.avatar_url ? (
                                <img
                                    src={workOrder.owner.avatar_url}
                                    alt={workOrder.owner.display_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                    {workOrder.owner?.display_name?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                            <p className="font-medium text-gray-900">
                                {safeRender(workOrder.owner?.display_name) || 'Not assigned'}
                            </p>
                        </div>
                    </Card>

                    {/* Technician Assignments */}
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
                                <div className="space-y-2">
                                    {technicians
                                        .filter(t => selectedTechIds.includes(t.id))
                                        .map(tech => {
                                            const skills = tech.technician?.[0]?.skills || [];
                                            return (
                                                <div key={tech.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm">
                                                            {safeRender(tech.display_name)}
                                                        </p>
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
                                    <div className="max-h-[250px] overflow-y-auto space-y-2">
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
                                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedTechIds.includes(tech.id)
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
                                    <div className="flex gap-2">
                                        {selectedTechIds.length > 0 && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => {
                                                    // Reset selection to saved state
                                                    if (workOrder?.assignments) {
                                                        setSelectedTechIds(workOrder.assignments.map(a => a.user_profile_id));
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
                                                JSON.stringify((workOrder?.assignments || []).map(a => a.user_profile_id).sort())}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>

                    {/* AI Analysis Summary (if processed) */}
                    {workOrder.processed && workOrder.analysis && (
                        <Card title="AI Analysis Summary">
                            <div className="space-y-3 text-sm">
                                {workOrder.analysis.jobType && (
                                    <div>
                                        <p className="text-gray-500">Job Type</p>
                                        <p className="font-medium">{safeRender(workOrder.analysis.jobType)}</p>
                                    </div>
                                )}
                                {workOrder.analysis.numberOfTechs && (
                                    <div>
                                        <p className="text-gray-500">Recommended Techs</p>
                                        <p className="font-medium">{safeRender(workOrder.analysis.numberOfTechs)}</p>
                                    </div>
                                )}
                                {workOrder.analysis.estimatedHours && (
                                    <div>
                                        <p className="text-gray-500">Estimated Hours</p>
                                        <p className="font-medium">{workOrder.analysis.estimatedHours}h</p>
                                    </div>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="w-full mt-2"
                                    onClick={() => setIsAnalysisOpen(true)}
                                >
                                    View Full Analysis
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Team & Chat Section - Full Width */}
            {currentUserId && (
                <Card title="Team & Chat">
                    <WorkOrderTeamTab
                        workOrderId={workOrderId}
                        currentUserId={currentUserId}
                        workOrderFiles={teamFiles}
                    />
                </Card>
            )}

            {/* Modals */}
            < WorkOrderFilesModal
                isOpen={isFilesOpen}
                onClose={() => setIsFilesOpen(false)
                }
                files={files}
                loading={loadingFiles}
            />

            <WorkOrderAnalysisModal
                isOpen={isAnalysisOpen}
                onClose={() => setIsAnalysisOpen(false)}
                analysis={workOrder?.analysis}
            />

            <FileViewerModal
                isOpen={isFileViewerOpen}
                onClose={() => setIsFileViewerOpen(false)}
                files={files}
            />

            {/* Job Status Reason Modal */}
            <Modal
                isOpen={isJobStatusModalOpen}
                onClose={() => {
                    setIsJobStatusModalOpen(false);
                    setPendingJobStatus(null);
                    setJobStatusReason('');
                }}
                title={`${pendingJobStatus} - Provide Reason`}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Please provide a reason for setting the status to <strong>{pendingJobStatus}</strong>.
                    </p>
                    <Textarea
                        value={jobStatusReason}
                        onChange={(e) => setJobStatusReason(e.target.value)}
                        placeholder="Enter the reason..."
                        rows={3}
                        className="w-full"
                    />
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsJobStatusModalOpen(false);
                                setPendingJobStatus(null);
                                setJobStatusReason('');
                            }}
                            disabled={savingJobStatus}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleJobStatusReasonSubmit}
                            loading={savingJobStatus}
                            disabled={!jobStatusReason.trim()}
                        >
                            Update Status
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
