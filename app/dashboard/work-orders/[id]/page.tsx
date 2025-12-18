'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    WorkOrder,
    WorkOrderFile,
    JobType,
    WorkOrderAssignment,
    WorkOrderShipment,
    Technician
} from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { createClient } from '@/lib/supabase/client';
import {
    Button,
    Card,
    Badge,
    Input,
    LoadingSpinner,
    Alert,
    TagInput
} from '@/components/ui';
import {
    WorkOrderFilesModal,
    WorkOrderAnalysisModal,
    ShipmentManager
} from '@/components/work-orders';
import { toast } from '@/components/providers';
import { safeRender } from '@/lib/utils/helpers';

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
        materials_required: [] as string[]
    });
    const [saving, setSaving] = useState(false);

    // Job Types
    const [jobTypes, setJobTypes] = useState<JobType[]>([]);

    // Technicians for assignment
    const [technicians, setTechnicians] = useState<Technician[]>([]);
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

    // Fetch work order on mount
    useEffect(() => {
        fetchWorkOrder();
        fetchJobTypes();
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

            // Initialize edit data
            setEditData({
                work_order_number: data.work_order_number || '',
                site_address: data.site_address || '',
                planned_date: data.planned_date || '',
                work_order_date: data.work_order_date || '',
                job_type_id: data.job_type_id || '',
                skills_required: data.skills_required || [],
                permits_required: data.permits_required || [],
                equipment_required: data.equipment_required || [],
                materials_required: data.materials_required || []
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
            const supabase = createClient();
            const { data, error } = await supabase
                .from('technicians')
                .select('*')
                .order('name', { ascending: true });

            if (!error && data) {
                setTechnicians(data as Technician[]);
            }
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

    const handleSaveDetails = async () => {
        if (!workOrder) return;

        setSaving(true);
        try {
            await workOrdersService.update(workOrderId, {
                work_order_number: editData.work_order_number || null,
                site_address: editData.site_address || null,
                planned_date: editData.planned_date || null,
                work_order_date: editData.work_order_date || null,
                job_type_id: editData.job_type_id || null,
                skills_required: editData.skills_required,
                permits_required: editData.permits_required,
                equipment_required: editData.equipment_required,
                materials_required: editData.materials_required
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
                    <Button variant="secondary" onClick={handleViewFiles}>
                        View Files
                    </Button>
                    {workOrder.processed && (
                        <Button variant="secondary" onClick={() => setIsAnalysisOpen(true)}>
                            View Analysis
                        </Button>
                    )}
                </div>
            </div>

            {/* Quick Status */}
            <div className="flex gap-3 flex-wrap">
                <Badge variant={workOrder.processed ? 'success' : 'warning'} dot>
                    {workOrder.processed ? 'AI Analyzed' : 'Pending Analysis'}
                </Badge>
                {workOrder.client_id && (
                    <Badge variant="info">Client Assigned</Badge>
                )}
                {workOrder.job_type && (
                    <Badge variant="default">{safeRender(workOrder.job_type.name)}</Badge>
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
                                    <p className="font-medium">{formatDate(workOrder.planned_date)}</p>
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
                            </div>
                        )}
                    </Card>

                    {/* Shipments Section */}
                    <Card noPadding>
                        <div className="p-4">
                            <ShipmentManager
                                workOrderId={workOrderId}
                                shipments={workOrder.shipments || []}
                                onShipmentsChange={fetchWorkOrder}
                            />
                        </div>
                    </Card>
                </div>

                {/* Sidebar - 1 column */}
                <div className="space-y-6">
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
                                        .map(tech => (
                                            <div key={tech.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">
                                                        {safeRender(tech.name)}
                                                    </p>
                                                    {tech.skills && tech.skills.length > 0 && (
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {tech.skills.slice(0, 2).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
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
                                            .filter(tech =>
                                                tech.name.toLowerCase().includes(techSearchQuery.toLowerCase()) ||
                                                (tech.skills || []).some(skill => skill.toLowerCase().includes(techSearchQuery.toLowerCase()))
                                            )
                                            .map(tech => (
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
                                                            {safeRender(tech.name)}
                                                        </p>
                                                        {tech.skills && tech.skills.length > 0 && (
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {tech.skills.slice(0, 2).join(', ')}
                                                                {tech.skills.length > 2 && ` +${tech.skills.length - 2}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            ))}
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

            {/* Modals */}
            <WorkOrderFilesModal
                isOpen={isFilesOpen}
                onClose={() => setIsFilesOpen(false)}
                files={files}
                loading={loadingFiles}
            />

            <WorkOrderAnalysisModal
                isOpen={isAnalysisOpen}
                onClose={() => setIsAnalysisOpen(false)}
                analysis={workOrder?.analysis}
            />
        </div>
    );
}
