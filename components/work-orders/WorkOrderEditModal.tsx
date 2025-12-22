'use client';

import { useState, useEffect } from 'react';
import { WorkOrder, Client, ProjectManager, JobType } from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { clientsService } from '@/services/clients.service';
import { createClient } from '@/lib/supabase/client';
import { Button, Modal, Input, LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/providers';
import { Plus, X } from 'lucide-react';

interface UserProfile {
    id: string;
    display_name: string;
    avatar_url?: string | null;
}

interface WorkOrderEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrder: WorkOrder;
    onSave: () => void;
}

export function WorkOrderEditModal({
    isOpen,
    onClose,
    workOrder,
    onSave
}: WorkOrderEditModalProps) {
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form data
    const [formData, setFormData] = useState({
        work_order_number: '',
        site_address: '',
        work_order_date: '',
        job_type_id: '',
        client_id: '',
        pm_id: '',
        owner_id: '',
        estimated_days: '' as number | '',
        scheduling_notes: ''
    });

    // Planned dates as array
    const [plannedDates, setPlannedDates] = useState<string[]>([]);

    // Dropdown options
    const [clients, setClients] = useState<Client[]>([]);
    const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
    const [jobTypes, setJobTypes] = useState<JobType[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loadingPMs, setLoadingPMs] = useState(false);

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen && workOrder) {
            setFormData({
                work_order_number: workOrder.work_order_number || '',
                site_address: workOrder.site_address || '',
                work_order_date: workOrder.work_order_date || '',
                job_type_id: workOrder.job_type_id || '',
                client_id: workOrder.client_id || '',
                pm_id: workOrder.pm_id || '',
                owner_id: workOrder.owner_id || '',
                estimated_days: workOrder.estimated_days || '',
                scheduling_notes: workOrder.scheduling_notes || ''
            });
            setPlannedDates(workOrder.planned_dates || []);
            loadDropdownData();
        }
    }, [isOpen, workOrder]);

    // Load PMs when client changes
    useEffect(() => {
        if (formData.client_id) {
            loadProjectManagers(formData.client_id);
        } else {
            setProjectManagers([]);
            setFormData(prev => ({ ...prev, pm_id: '' }));
        }
    }, [formData.client_id]);

    const loadDropdownData = async () => {
        setLoading(true);
        try {
            const [clientsData, jobTypesData] = await Promise.all([
                clientsService.getAll(),
                workOrdersService.getJobTypes()
            ]);
            setClients(clientsData);
            setJobTypes(jobTypesData);

            // Load users for owner dropdown
            const supabase = createClient();
            const { data: usersData } = await supabase
                .from('user_profiles')
                .select('id, display_name, avatar_url')
                .eq('onboarding_completed', true)
                .order('display_name');

            if (usersData) {
                setUsers(usersData);
            }

            // Load PMs if client is already selected
            if (workOrder.client_id) {
                await loadProjectManagers(workOrder.client_id);
            }
        } catch (error) {
            console.error('Failed to load dropdown data:', error);
            toast.error('Failed to load form data');
        } finally {
            setLoading(false);
        }
    };

    const loadProjectManagers = async (clientId: string) => {
        setLoadingPMs(true);
        try {
            const pms = await clientsService.getProjectManagers(clientId);
            setProjectManagers(pms);
        } catch (error) {
            console.error('Failed to load project managers:', error);
        } finally {
            setLoadingPMs(false);
        }
    };

    // Planned Dates Management
    const addPlannedDate = () => {
        setPlannedDates([...plannedDates, '']);
    };

    const updatePlannedDate = (index: number, value: string) => {
        const updated = [...plannedDates];
        updated[index] = value;
        setPlannedDates(updated);
    };

    const removePlannedDate = (index: number) => {
        setPlannedDates(plannedDates.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const validDates = plannedDates.filter(d => d.trim() !== '');

            await workOrdersService.update(workOrder.id, {
                work_order_number: formData.work_order_number || null,
                site_address: formData.site_address || null,
                work_order_date: formData.work_order_date || null,
                planned_dates: validDates.length > 0 ? validDates : null,
                job_type_id: formData.job_type_id || null,
                client_id: formData.client_id || null,
                pm_id: formData.pm_id || null,
                owner_id: formData.owner_id || null,
                estimated_days: formData.estimated_days === '' ? null : Number(formData.estimated_days),
                scheduling_notes: formData.scheduling_notes || null
            });

            toast.success('Work order updated');
            onSave();
            onClose();
        } catch (error: any) {
            toast.error('Failed to update work order', { description: error.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Work Order Details"
            size="lg"
        >
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* WO Number & Job Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Work Order Number
                            </label>
                            <Input
                                value={formData.work_order_number}
                                onChange={(e) => setFormData(prev => ({ ...prev, work_order_number: e.target.value }))}
                                placeholder="e.g., WO-2024-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Job Type
                            </label>
                            <select
                                value={formData.job_type_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, job_type_id: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select type...</option>
                                {jobTypes.map(jt => (
                                    <option key={jt.id} value={jt.id}>{jt.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Site Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Site Address
                        </label>
                        <Input
                            value={formData.site_address}
                            onChange={(e) => setFormData(prev => ({ ...prev, site_address: e.target.value }))}
                            placeholder="Full job site address"
                        />
                    </div>

                    {/* WO Date & Est. Days */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Work Order Date
                            </label>
                            <Input
                                type="date"
                                value={formData.work_order_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, work_order_date: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Est. Days
                            </label>
                            <Input
                                type="number"
                                min={1}
                                value={formData.estimated_days}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    estimated_days: e.target.value === '' ? '' : parseInt(e.target.value)
                                }))}
                                placeholder="e.g., 3"
                            />
                        </div>
                    </div>

                    {/* Planned Dates */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Planned Dates
                        </label>
                        <div className="space-y-2">
                            {plannedDates.map((date, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => updatePlannedDate(index, e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removePlannedDate(index)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addPlannedDate}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Date
                            </button>
                        </div>
                    </div>

                    {/* Scheduling Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Scheduling Notes
                        </label>
                        <Input
                            value={formData.scheduling_notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, scheduling_notes: e.target.value }))}
                            placeholder="e.g., Weekend only, After hours"
                        />
                    </div>

                    {/* Client & PM */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Client
                            </label>
                            <select
                                value={formData.client_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value, pm_id: '' }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select client...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Project Manager
                            </label>
                            {loadingPMs ? (
                                <div className="flex items-center gap-2 py-2">
                                    <LoadingSpinner />
                                    <span className="text-sm text-gray-500">Loading...</span>
                                </div>
                            ) : (
                                <select
                                    value={formData.pm_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, pm_id: e.target.value }))}
                                    disabled={!formData.client_id}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                    <option value="">{formData.client_id ? 'Select PM...' : 'Select client first'}</option>
                                    {projectManagers.map(pm => (
                                        <option key={pm.id} value={pm.id}>{pm.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* WO Owner */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            WO Owner
                        </label>
                        <select
                            value={formData.owner_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, owner_id: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select owner...</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.display_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={saving}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
