import { createClient } from '@/lib/supabase/client';
import {
    WorkOrder,
    WorkOrderFile,
    JobType,
    WorkOrderAssignment,
    WorkOrderShipment,
    ReceiverOption,
    Technician,
    OfficeStaff
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
            .select('*, client:clients(*)')
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
                project_manager:project_managers(*)
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
                processed: false,
                analysis: null,
                work_order_number: workOrder.work_order_number || null,
                job_type_id: workOrder.job_type_id || null,
                site_address: workOrder.site_address || null,
                planned_date: workOrder.planned_date || null,
                work_order_date: workOrder.work_order_date || null,
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
};

