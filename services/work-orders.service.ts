import { createClient } from '@/lib/supabase/client';
import {
    WorkOrder,
    WorkOrderFile,
    JobType,
    WorkOrderAssignment,
    WorkOrderShipment,
    ReceiverOption,
    Technician,
    OfficeStaff,
    WorkOrderTask,
    TaskAssignment,
    TaskChecklist,
    ChecklistTemplate,
    ChecklistTemplateItem
} from '@/types/database';

/**
 * Service for work order operations
 * Work orders have special handling due to file associations and AI processing
 * 
 * @example
 * import { workOrdersService } from '@/services';
 * 
 * // Create a new work order
 * const order = await workOrdersService.create({ uploaded_by: userId });
 * 
 * // Upload files for the work order
 * await workOrdersService.uploadFiles(order.id, files);
 * 
 * // Process with AI
 * await workOrdersService.processWithAI(order.id);
 */
export const workOrdersService = {
    // =============================================
    // WORK ORDER CRUD
    // =============================================

    /**
     * Fetch all work orders with optional includes
     */
    async getAll(): Promise<WorkOrder[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_orders')
            .select('*, client:clients(*), job_type:job_types(*), owner:user_profiles!owner_id(id, display_name, avatar_url)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching work orders:', error);
            throw new Error(`Failed to fetch work orders: ${error.message}`);
        }

        return (data || []) as WorkOrder[];
    },

    /**
     * Get a single work order by ID with all related data
     */
    async getById(id: string): Promise<WorkOrder | null> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_orders')
            .select(`
                *,
                job_type:job_types(*),
                assignments:work_order_assignments(*, technician:technicians(*)),
                shipments:work_order_shipments(*),
                client:clients(*),
                project_manager:project_managers(*),
                owner:user_profiles!owner_id(id, display_name, avatar_url)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch work order: ${error.message}`);
        }

        // Enrich shipments with receiver names
        if (data && data.shipments && data.shipments.length > 0) {
            data.shipments = await this.enrichShipmentsWithReceiverNames(data.shipments as any);
        }

        return data as WorkOrder;
    },

    /**
     * Create a new work order
     */
    async create(workOrder: Partial<Omit<WorkOrder, 'id' | 'created_at'>>): Promise<WorkOrder> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_orders')
            .insert([{
                uploaded_by: workOrder.uploaded_by || null,
                owner_id: workOrder.owner_id || workOrder.uploaded_by || null,
                processed: false,
                analysis: null,
                work_order_number: workOrder.work_order_number || null,
                job_type_id: workOrder.job_type_id || null,
                site_address: workOrder.site_address || null,
                planned_date: workOrder.planned_date || null,
                work_order_date: workOrder.work_order_date || null,
                shipment_status: workOrder.shipment_status || null,
                job_status: workOrder.job_status || 'Open',
            }])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create work order: ${error.message}`);
        }

        return data as WorkOrder;
    },

    /**
     * Update a work order's core fields
     */
    async update(id: string, updates: Partial<Omit<WorkOrder, 'id' | 'created_at'>>): Promise<WorkOrder> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_orders')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update work order: ${error.message}`);
        }

        return data as WorkOrder;
    },

    /**
     * Delete a work order and its associated files
     */
    async delete(id: string): Promise<void> {
        const supabase = createClient();

        // First, get all files for this work order
        const files = await this.getFiles(id);

        // Delete files from storage
        if (files.length > 0) {
            const filePaths = files.map(file => {
                const urlParts = file.file_url.split('/');
                return urlParts[urlParts.length - 1];
            });

            const { error: storageError } = await supabase.storage
                .from('work-orders')
                .remove(filePaths);

            if (storageError) {
                console.warn('Error deleting files from storage:', storageError);
            }
        }

        // Delete work order (CASCADE will delete file records, assignments, shipments)
        const { error } = await supabase
            .from('work_orders')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete work order: ${error.message}`);
        }
    },

    // =============================================
    // WORK ORDER FILES
    // =============================================

    /**
     * Get all files associated with a work order
     */
    async getFiles(workOrderId: string): Promise<WorkOrderFile[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_files')
            .select('*')
            .eq('work_order_id', workOrderId);

        if (error) {
            console.error('Error fetching work order files:', error);
            return [];
        }

        return (data || []) as WorkOrderFile[];
    },

    /**
     * Upload files for a work order
     */
    async uploadFiles(workOrderId: string, files: File[]): Promise<WorkOrderFile[]> {
        const supabase = createClient();
        const uploadedFiles: WorkOrderFile[] = [];

        for (const file of files) {
            // Generate unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Upload file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('work-orders')
                .upload(fileName, file);

            if (uploadError) {
                console.error(`Failed to upload file: ${file.name}`, uploadError);
                throw new Error(`Failed to upload file: ${file.name}`);
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('work-orders')
                .getPublicUrl(fileName);

            // Create file record in database
            const { data: fileRecord, error: fileError } = await supabase
                .from('work_order_files')
                .insert([{
                    work_order_id: workOrderId,
                    file_url: urlData.publicUrl,
                    file_name: file.name,
                    file_size: file.size,
                    mime_type: file.type,
                }])
                .select()
                .single();

            if (fileError) {
                console.error('Error creating file record:', fileError);
                throw new Error(`Failed to create file record: ${fileError.message}`);
            }

            uploadedFiles.push(fileRecord as WorkOrderFile);
        }

        return uploadedFiles;
    },

    // =============================================
    // AI PROCESSING
    // =============================================

    /**
     * Process work order with AI
     */
    async processWithAI(workOrderId: string): Promise<{ success: boolean; analysis?: unknown; error?: string }> {
        const response = await fetch('/api/process-work-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ workOrderId }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || 'Failed to process work order' };
        }

        return { success: true, analysis: data.analysis };
    },

    /**
     * Get unprocessed work orders count
     */
    async getPendingCount(): Promise<number> {
        const supabase = createClient();
        const { count, error } = await supabase
            .from('work_orders')
            .select('*', { count: 'exact', head: true })
            .eq('processed', false);

        if (error) {
            console.error('Error counting pending work orders:', error);
            return 0;
        }

        return count || 0;
    },

    // =============================================
    // JOB TYPES
    // =============================================

    /**
     * Get all job types
     */
    async getJobTypes(): Promise<JobType[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('job_types')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching job types:', error);
            throw new Error(`Failed to fetch job types: ${error.message}`);
        }

        return (data || []) as JobType[];
    },

    /**
     * Update a job type
     */
    async updateJobType(id: string, updates: { name?: string; description?: string }): Promise<JobType> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('job_types')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update job type: ${error.message}`);
        }

        return data as JobType;
    },

    /**
     * Create a new job type
     */
    async createJobType(jobType: { name: string; description?: string }): Promise<JobType> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('job_types')
            .insert([jobType])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create job type: ${error.message}`);
        }

        return data as JobType;
    },

    /**
     * Delete a job type
     */
    async deleteJobType(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('job_types')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete job type: ${error.message}`);
        }
    },

    // =============================================
    // TECHNICIAN ASSIGNMENTS
    // =============================================

    /**
     * Get assignments for a work order
     */
    async getAssignments(workOrderId: string): Promise<WorkOrderAssignment[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_assignments')
            .select('*, technician:technicians(*)')
            .eq('work_order_id', workOrderId);

        if (error) {
            console.error('Error fetching assignments:', error);
            throw new Error(`Failed to fetch assignments: ${error.message}`);
        }

        return (data || []) as WorkOrderAssignment[];
    },

    /**
     * Assign technicians to a work order
     */
    async assignTechnicians(workOrderId: string, technicianIds: string[]): Promise<void> {
        const supabase = createClient();

        // Remove existing assignments
        await supabase
            .from('work_order_assignments')
            .delete()
            .eq('work_order_id', workOrderId);

        // Add new assignments
        if (technicianIds.length > 0) {
            const assignments = technicianIds.map(techId => ({
                work_order_id: workOrderId,
                technician_id: techId,
            }));

            const { error } = await supabase
                .from('work_order_assignments')
                .insert(assignments);

            if (error) {
                throw new Error(`Failed to assign technicians: ${error.message}`);
            }
        }
    },

    // =============================================
    // SHIPMENTS
    // =============================================

    /**
     * Get shipments for a work order
     */
    async getShipments(workOrderId: string): Promise<WorkOrderShipment[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_shipments')
            .select('*')
            .eq('work_order_id', workOrderId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching shipments:', error);
            throw new Error(`Failed to fetch shipments: ${error.message}`);
        }

        // Enrich with receiver names
        const shipments = (data || []) as WorkOrderShipment[];
        return await this.enrichShipmentsWithReceiverNames(shipments);
    },

    /**
     * Get recent received shipments (for dashboard widget)
     */
    async getRecentReceivedShipments(limit: number = 5): Promise<WorkOrderShipment[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_shipments')
            .select('*')
            .not('received_at', 'is', null)
            .order('received_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching recent shipments:', error);
            throw new Error(`Failed to fetch recent shipments: ${error.message}`);
        }

        const shipments = (data || []) as WorkOrderShipment[];
        return await this.enrichShipmentsWithReceiverNames(shipments);
    },

    /**
     * Helper to enrich shipments with receiver names
     */
    async enrichShipmentsWithReceiverNames(shipments: WorkOrderShipment[]): Promise<WorkOrderShipment[]> {
        const supabase = createClient();

        // Group by receiver type for efficient lookups
        const techIds = shipments.filter(s => s.received_by_type === 'technician' && s.received_by_id).map(s => s.received_by_id!);
        const staffIds = shipments.filter(s => s.received_by_type === 'office_staff' && s.received_by_id).map(s => s.received_by_id!);

        // Fetch technicians
        let techMap: Record<string, string> = {};
        if (techIds.length > 0) {
            const { data: techs } = await supabase
                .from('technicians')
                .select('id, name')
                .in('id', techIds);
            techMap = (techs || []).reduce((acc, t) => ({ ...acc, [t.id]: t.name }), {});
        }

        // Fetch office staff
        let staffMap: Record<string, string> = {};
        if (staffIds.length > 0) {
            const { data: staff } = await supabase
                .from('office_staff')
                .select('id, name')
                .in('id', staffIds);
            staffMap = (staff || []).reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {});
        }

        // Enrich shipments
        return shipments.map(s => ({
            ...s,
            received_by_name: s.received_by_type === 'technician'
                ? techMap[s.received_by_id!]
                : staffMap[s.received_by_id!] || undefined
        }));
    },

    /**
     * Create a new shipment
     */
    async createShipment(shipment: Omit<WorkOrderShipment, 'id' | 'created_at' | 'updated_at' | 'received_by_name'>): Promise<WorkOrderShipment> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_shipments')
            .insert(shipment)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create shipment: ${error.message}`);
        }

        return data as WorkOrderShipment;
    },

    /**
     * Update a shipment
     */
    async updateShipment(id: string, updates: Partial<Omit<WorkOrderShipment, 'id' | 'created_at' | 'updated_at'>>): Promise<WorkOrderShipment> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_shipments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update shipment: ${error.message}`);
        }

        return data as WorkOrderShipment;
    },

    /**
     * Delete a shipment
     */
    async deleteShipment(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('work_order_shipments')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete shipment: ${error.message}`);
        }
    },

    /**
     * Upload receipt photos for a shipment
     */
    async uploadShipmentPhotos(shipmentId: string, photos: File[]): Promise<string[]> {
        const supabase = createClient();
        const photoUrls: string[] = [];

        for (const photo of photos) {
            // Generate unique file name
            const fileExt = photo.name.split('.').pop();
            const fileName = `${shipmentId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Upload photo to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('shipment-photos')
                .upload(fileName, photo);

            if (uploadError) {
                console.error(`Failed to upload photo: ${photo.name}`, uploadError);
                throw new Error(`Failed to upload photo: ${photo.name}`);
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('shipment-photos')
                .getPublicUrl(fileName);

            photoUrls.push(urlData.publicUrl);
        }

        // Update shipment with photo URLs
        const { data: shipment } = await supabase
            .from('work_order_shipments')
            .select('receipt_photos')
            .eq('id', shipmentId)
            .single();

        const existingPhotos = (shipment?.receipt_photos || []) as string[];
        await this.updateShipment(shipmentId, {
            receipt_photos: [...existingPhotos, ...photoUrls]
        });

        return photoUrls;
    },

    // =============================================
    // UNIFIED RECEIVER OPTIONS
    // =============================================

    /**
     * Get combined list of technicians and office staff for "Received By" dropdown
     */
    async getReceiverOptions(): Promise<ReceiverOption[]> {
        const supabase = createClient();

        // Fetch technicians
        const { data: techs, error: techError } = await supabase
            .from('technicians')
            .select('id, name')
            .order('name', { ascending: true });

        if (techError) {
            console.error('Error fetching technicians:', techError);
        }

        // Fetch office staff
        const { data: staff, error: staffError } = await supabase
            .from('office_staff')
            .select('id, name, title')
            .order('name', { ascending: true });

        if (staffError) {
            console.error('Error fetching office staff:', staffError);
        }

        // Combine and format
        const options: ReceiverOption[] = [];

        // Add technicians
        (techs || []).forEach((tech: { id: string; name: string }) => {
            options.push({
                id: tech.id,
                name: tech.name,
                type: 'technician',
                title: 'Technician'
            });
        });

        // Add office staff
        (staff || []).forEach((s: { id: string; name: string; title: string | null }) => {
            options.push({
                id: s.id,
                name: s.name,
                type: 'office_staff',
                title: s.title
            });
        });

        return options;
    },
    /**
     * Get profiles for a list of user IDs
     */
    async getUserProfiles(userIds: string[]): Promise<Record<string, { name: string }>> {
        if (!userIds.length) return {};

        const supabase = createClient();
        const { data, error } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', userIds);

        if (error) {
            console.error('Error fetching user profiles:', error);
            return {};
        }

        return (data || []).reduce((acc, profile) => ({
            ...acc,
            [profile.id]: { name: profile.display_name }
        }), {});
    },


    // =============================================
    // TASKS & CHECKLISTS
    // =============================================

    /**
     * Get tasks for a work order
     */
    async getTasks(workOrderId: string): Promise<WorkOrderTask[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_tasks')
            .select(`
                *,
                assignments:task_assignments(*, technician:technicians(*)),
                checklists:task_checklists(*)
            `)
            .eq('work_order_id', workOrderId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching tasks:', error);
            throw new Error(`Failed to fetch tasks: ${error.message}`);
        }

        // Calculate progress for each task
        const tasks = (data || []).map((task: any) => {
            const total = task.checklists?.length || 0;
            const completed = task.checklists?.filter((c: any) => c.is_completed).length || 0;
            return {
                ...task,
                progress: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        });

        return tasks as WorkOrderTask[];
    },

    /**
     * Create a new task
     */
    async createTask(task: { work_order_id: string; name: string } & Partial<WorkOrderTask>): Promise<WorkOrderTask> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_tasks')
            .insert([{
                work_order_id: task.work_order_id,
                name: task.name,
                description: task.description || null,
                status: task.status || 'Pending',
                priority: task.priority || 'Medium',
                due_date: task.due_date || null,
            }])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create task: ${error.message}`);
        }

        return data as WorkOrderTask;
    },

    /**
     * Update a task
     */
    async updateTask(id: string, updates: Partial<WorkOrderTask>): Promise<WorkOrderTask> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update task: ${error.message}`);
        }

        return data as WorkOrderTask;
    },

    /**
     * Delete a task
     */
    async deleteTask(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('work_order_tasks')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete task: ${error.message}`);
        }
    },

    /**
     * Assign technicians to a task
     */
    async assignTask(taskId: string, technicianIds: string[]): Promise<void> {
        const supabase = createClient();

        // Remove existing assignments
        await supabase.from('task_assignments').delete().eq('task_id', taskId);

        if (technicianIds.length > 0) {
            const assignments = technicianIds.map(techId => ({
                task_id: taskId,
                technician_id: techId
            }));

            const { error } = await supabase
                .from('task_assignments')
                .insert(assignments);

            if (error) {
                throw new Error(`Failed to assign task: ${error.message}`);
            }
        }
    },

    /**
     * Get checklist items for a task
     */
    async getTaskChecklists(taskId: string): Promise<TaskChecklist[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('task_checklists')
            .select('*')
            .eq('task_id', taskId)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching checklists:', error);
            throw new Error(`Failed to fetch checklists: ${error.message}`);
        }

        const checklists = (data || []) as unknown as TaskChecklist[];
        // Enrich
        const userIds = checklists.filter(c => c.completed_by_id).map(c => c.completed_by_id!);
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('user_profiles')
                .select('id, display_name, avatar_url')
                .in('id', userIds);

            const profileMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
            checklists.forEach((c: any) => {
                if (c.completed_by_id && profileMap[c.completed_by_id]) {
                    c.completed_by = profileMap[c.completed_by_id];
                }
            });
        }

        return checklists;
    },

    /**
     * Create checklist item
     */
    async createChecklistItem(item: { task_id: string; content: string } & Partial<TaskChecklist>): Promise<TaskChecklist> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('task_checklists')
            .insert([{
                task_id: item.task_id,
                content: item.content,
                sort_order: item.sort_order || 0
            }])
            .select()
            .single();

        if (error) throw new Error(`Failed to create checklist item: ${error.message}`);
        return data as TaskChecklist;
    },

    /**
     * Toggle checklist item completion
     */
    async toggleChecklistItem(itemId: string, isCompleted: boolean, userId: string): Promise<TaskChecklist> {
        const supabase = createClient();
        const updates = {
            is_completed: isCompleted,
            completed_by_id: isCompleted ? userId : null,
            completed_at: isCompleted ? new Date().toISOString() : null
        };

        const { data, error } = await supabase
            .from('task_checklists')
            .update(updates)
            .eq('id', itemId)
            .select()
            .single();

        if (error) throw new Error(`Failed to update checklist item: ${error.message}`);
        return data as TaskChecklist;
    },

    /**
     * Delete checklist item
     */
    async deleteChecklistItem(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase.from('task_checklists').delete().eq('id', id);
        if (error) throw new Error(`Failed to delete checklist item: ${error.message}`);
    },

    /**
     * Update checklist item content
     */
    async updateChecklistItem(id: string, content: string): Promise<TaskChecklist> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('task_checklists')
            .update({ content })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update checklist item: ${error.message}`);
        return data as TaskChecklist;
    },

    // =============================================
    // CHECKLIST TEMPLATES
    // =============================================

    async getChecklistTemplates(): Promise<ChecklistTemplate[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('checklist_templates')
            .select('*, items:checklist_template_items(*)')
            .order('name');

        if (error) throw new Error(`Failed to fetch templates: ${error.message}`);
        return data as ChecklistTemplate[];
    },

    async createChecklistTemplate(template: { name: string; description?: string }): Promise<ChecklistTemplate> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('checklist_templates')
            .insert([template])
            .select()
            .single();

        if (error) throw new Error(`Failed to create template: ${error.message}`);
        return data as ChecklistTemplate;
    },

    async deleteChecklistTemplate(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase.from('checklist_templates').delete().eq('id', id);
        if (error) throw new Error(`Failed to delete template: ${error.message}`);
    },

    async createChecklistTemplateItem(item: { template_id: string; content: string; sort_order?: number }): Promise<ChecklistTemplateItem> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('checklist_template_items')
            .insert([item])
            .select()
            .single();
        if (error) throw new Error(`Failed to add template item: ${error.message}`);
        return data as ChecklistTemplateItem;
    },

    async deleteChecklistTemplateItem(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase.from('checklist_template_items').delete().eq('id', id);
        if (error) throw new Error(`Failed to delete template item: ${error.message}`);
    },

    /**
     * Apply a valid template to a task (copy items)
     */
    async applyTemplateToTask(taskId: string, templateId: string): Promise<void> {
        const supabase = createClient();

        // 1. Fetch template items
        const { data: items, error: fetchError } = await supabase
            .from('checklist_template_items')
            .select('*')
            .eq('template_id', templateId)
            .order('sort_order');

        if (fetchError || !items) throw new Error(`Failed to fetch template items: ${fetchError?.message}`);

        // 2. Create task checklists
        if (items.length > 0) {
            const newItems = items.map(item => ({
                task_id: taskId,
                content: item.content,
                sort_order: item.sort_order,
                is_completed: false
            }));

            const { error: insertError } = await supabase
                .from('task_checklists')
                .insert(newItems);

            if (insertError) throw new Error(`Failed to apply template: ${insertError.message}`);
        }
    },

    // =============================================
    // JOB STATUS
    // =============================================

    /**
     * Update job status with optional reason (required for On Hold/Cancelled)
     */
    async updateJobStatus(
        id: string,
        status: 'Open' | 'Active' | 'On Hold' | 'Completed' | 'Submitted' | 'Invoiced' | 'Cancelled',
        reason?: string
    ): Promise<WorkOrder> {
        // Validate reason is provided for On Hold and Cancelled
        if ((status === 'On Hold' || status === 'Cancelled') && !reason?.trim()) {
            throw new Error(`A reason is required when setting status to "${status}"`);
        }

        const supabase = createClient();
        const updates: { job_status: string; job_status_reason?: string | null } = {
            job_status: status,
        };

        // Clear reason for non-hold/cancelled statuses, or set it if provided
        if (status === 'On Hold' || status === 'Cancelled') {
            updates.job_status_reason = reason || null;
        } else {
            updates.job_status_reason = null;
        }

        const { data, error } = await supabase
            .from('work_orders')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update job status: ${error.message}`);
        }

        return data as WorkOrder;
    },
};

