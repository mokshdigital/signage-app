'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Select, Input, Textarea, LoadingSpinner, Alert } from '@/components/ui';
import { WorkOrder, Client, ProjectManager, JobType } from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { clientsService } from '@/services/clients.service';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/providers';
import { safeRender } from '@/lib/utils/helpers';

interface WorkOrderReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrder: WorkOrder | null;
    onSave: () => void;
}

export function WorkOrderReviewModal({
    isOpen,
    onClose,
    workOrder,
    onSave
}: WorkOrderReviewModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [ownerId, setOwnerId] = useState('');
    const [jobTypeId, setJobTypeId] = useState('');
    const [clientId, setClientId] = useState('');
    const [pmId, setPmId] = useState('');
    const [siteAddress, setSiteAddress] = useState('');
    const [shippingComment, setShippingComment] = useState('');

    // Options State
    const [users, setUsers] = useState<{ id: string; display_name: string }[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [jobTypes, setJobTypes] = useState<JobType[]>([]);
    const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
    const [loadingPMs, setLoadingPMs] = useState(false);

    // AI Suggestions
    const [suggestions, setSuggestions] = useState<{ client?: string; jobType?: string }>({});

    // Initialize Form Data
    useEffect(() => {
        if (isOpen && workOrder) {
            initializeData();
        }
    }, [isOpen, workOrder]);

    const initializeData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Options
            const [usersData, clientsData, jobTypesData] = await Promise.all([
                fetchAllUsers(),
                clientsService.getAll(),
                workOrdersService.getJobTypes()
            ]);

            setUsers(usersData);
            setClients(clientsData);
            setJobTypes(jobTypesData);

            // 2. Set Initial Values from Work Order / AI
            setOwnerId(workOrder?.owner_id || workOrder?.uploaded_by || '');
            setSiteAddress(workOrder?.site_address || '');
            setJobTypeId(workOrder?.job_type_id || '');

            // 3. AI Recommendations Logic
            const analysis = workOrder?.analysis || {};
            const suggestedClientName = analysis.orderedBy || '';
            const suggestedJobTypeName = analysis.jobType || '';

            const newSuggestions: { client?: string; jobType?: string } = {};

            // Find matching Client
            if (suggestedClientName) {
                const match = clientsData.find(c =>
                    c.name.toLowerCase().includes(suggestedClientName.toLowerCase()) ||
                    suggestedClientName.toLowerCase().includes(c.name.toLowerCase())
                );
                if (match) {
                    setClientId(match.id);
                    newSuggestions.client = `AI suggested "${suggestedClientName}" - matched to ${match.name}`;
                    // Fetch PMs for this client
                    fetchProjectManagers(match.id);
                } else {
                    newSuggestions.client = `AI found "${suggestedClientName}" (no direct match)`;
                }
            }

            // Find matching Job Type
            if (suggestedJobTypeName) {
                const match = jobTypesData.find(jt =>
                    jt.name.toLowerCase().includes(suggestedJobTypeName.toLowerCase()) ||
                    suggestedJobTypeName.toLowerCase().includes(jt.name.toLowerCase())
                );
                if (match) {
                    setJobTypeId(match.id);
                    newSuggestions.jobType = `AI suggested "${suggestedJobTypeName}" - matched to ${match.name}`;
                } else {
                    newSuggestions.jobType = `AI found "${suggestedJobTypeName}" (no direct match)`;
                }
            }

            setSuggestions(newSuggestions);

        } catch (error) {
            console.error('Failed to initialize review modal:', error);
            toast.error('Failed to load options');
        } finally {
            setLoading(false);
        }
    };

    // Helper to fetch all users
    const fetchAllUsers = async () => {
        const supabase = createClient();
        const { data } = await supabase.from('user_profiles').select('id, display_name').order('display_name');
        return data || [];
    };

    const fetchProjectManagers = async (cId: string) => {
        if (!cId) {
            setProjectManagers([]);
            return;
        }
        setLoadingPMs(true);
        try {
            const data = await clientsService.getProjectManagers(cId);
            setProjectManagers(data);
        } catch (error) {
            console.error('Failed to fetch PMs', error);
        } finally {
            setLoadingPMs(false);
        }
    };

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newClientId = e.target.value;
        setClientId(newClientId);
        setPmId(''); // Reset PM
        if (newClientId) {
            fetchProjectManagers(newClientId);
        } else {
            setProjectManagers([]);
        }
    };

    const handleSave = async () => {
        if (!workOrder) return;

        setSaving(true);
        try {
            // 1. Update Work Order
            await workOrdersService.update(workOrder.id, {
                owner_id: ownerId || null,
                job_type_id: jobTypeId || null,
                client_id: clientId || null,
                pm_id: pmId || null,
                site_address: siteAddress,
                // Note: job_status is already Open, shipment_status is ignored (we use comment)
            });

            // 2. Add Shipping Comment if provided
            if (shippingComment.trim()) {
                await workOrdersService.addShippingComment(workOrder.id, shippingComment.trim());
            }

            toast.success('Work Order Review Complete');
            onSave();
            onClose();
        } catch (error: any) {
            toast.error('Failed to save changes', { description: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Review & Finalize Work Order"
            size="lg"
        >
            {loading ? (
                <div className="flex justify-center p-8">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="space-y-6">
                    <Alert variant="info" title="AI Extraction Complete">
                        Please review the extracted details and fill in any missing information below.
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* WO Owner */}
                        <div>
                            <Select
                                label="Work Order Owner"
                                value={ownerId}
                                onChange={(e) => setOwnerId(e.target.value)}
                                placeholder="Select Owner..."
                                options={users.map(u => ({ value: u.id, label: u.display_name }))}
                            />
                        </div>

                        {/* Job Type */}
                        <div>
                            <Select
                                label="Job Type"
                                value={jobTypeId}
                                onChange={(e) => setJobTypeId(e.target.value)}
                                placeholder="Select Job Type..."
                                options={jobTypes.map(jt => ({ value: jt.id, label: jt.name }))}
                                helperText={suggestions.jobType && !jobTypeId ? suggestions.jobType : undefined}
                            />
                        </div>

                        {/* Client */}
                        <div>
                            <Select
                                label="Client"
                                value={clientId}
                                onChange={handleClientChange}
                                placeholder="Select Client..."
                                options={clients.map(c => ({ value: c.id, label: c.name }))}
                                helperText={suggestions.client && !clientId ? suggestions.client : undefined}
                            />
                        </div>

                        {/* Project Manager */}
                        <div>
                            <Select
                                label="Client Contact / PM"
                                value={pmId}
                                onChange={(e) => setPmId(e.target.value)}
                                disabled={!clientId || loadingPMs}
                                placeholder="Select Contact..."
                                options={projectManagers.map(pm => ({ value: pm.id, label: pm.name }))}
                            />
                        </div>

                        {/* Site Address (Full Width) */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Site Address
                            </label>
                            <Input
                                value={siteAddress}
                                onChange={(e) => setSiteAddress(e.target.value)}
                                placeholder="Enter site address..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Pre-filled from AI analysis. Please verify.
                            </p>
                        </div>

                        {/* Initial Shipping Comment (Full Width) */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Initial Shipping Comment (Optional)
                            </label>
                            <Textarea
                                value={shippingComment}
                                onChange={(e) => setShippingComment(e.target.value)}
                                placeholder="Enter initial notes about materials or shipment..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        {/* We don't have a 'Cancel' button that goes back to nothing, usually just Close or Submit */}
                        {/* If they close the modal (X or outside click), onSave is NOT called, so the list doesn't update yet (or updates but shows unverified info) */}
                        <Button
                            onClick={handleSave}
                            loading={saving}
                        >
                            Confirm & Save
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
