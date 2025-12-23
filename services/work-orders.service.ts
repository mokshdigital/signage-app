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
    TechnicianUser,
    WorkOrderTask,
    TaskAssignment,
    TaskChecklist,
    ChecklistTemplate,
    ChecklistTemplateItem,
    ShippingComment,
    TaskComment,
    MentionableUser,
    WorkOrderCategory,
    TaskTag,
    FileCategory
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
                assignments:work_order_assignments(*, user_profile:user_profiles(id, display_name, avatar_url, email)),
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
                planned_dates: workOrder.planned_dates || null,
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
    // FILE CATEGORIES & ORGANIZED UPLOAD
    // =============================================

    /**
     * Get all file categories for a work order
     */
    async getFileCategories(workOrderId: string): Promise<FileCategory[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('file_categories')
            .select('*, files:work_order_files(*)')
            .eq('work_order_id', workOrderId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching file categories:', error);
            throw new Error(`Failed to fetch file categories: ${error.message}`);
        }

        return (data || []) as FileCategory[];
    },

    /**
     * Initialize default system categories for a work order
     */
    async initializeSystemCategories(workOrderId: string, userId: string): Promise<void> {
        const supabase = createClient();

        // Check if categories already exist
        const { count } = await supabase
            .from('file_categories')
            .select('*', { count: 'exact', head: true })
            .eq('work_order_id', workOrderId);

        if (count && count > 0) return;

        const systemCategories = [
            { name: 'Work Order', rbac_level: 'office', display_order: 10 },
            { name: 'Survey', rbac_level: 'office', display_order: 20 },
            { name: 'Plans', rbac_level: 'office', display_order: 30 },
            { name: 'Art Work', rbac_level: 'office', display_order: 40 },
            {
                name: 'Pictures',
                rbac_level: 'field',
                display_order: 50,
                subcategories: ['Reference', 'Before', 'WIP', 'After', 'Other']
            },
            {
                name: 'Tech Docs',
                rbac_level: 'field',
                display_order: 60,
                subcategories: ['Permits', 'Safety Docs', 'Expense Receipts']
            },
            {
                name: 'Office Docs',
                rbac_level: 'office_only',
                display_order: 70,
                subcategories: ['Quote', 'Client PO']
            }
        ];

        for (const cat of systemCategories) {
            // Create parent category
            const { data: parent } = await supabase
                .from('file_categories')
                .insert({
                    work_order_id: workOrderId,
                    name: cat.name,
                    is_system: true,
                    rbac_level: cat.rbac_level,
                    display_order: cat.display_order,
                    created_by: userId
                })
                .select()
                .single();

            if (parent && 'subcategories' in cat && cat.subcategories) {
                // Create subcategories
                const subCats = cat.subcategories.map((subName, index) => ({
                    work_order_id: workOrderId,
                    name: subName,
                    parent_id: parent.id,
                    is_system: true,
                    rbac_level: cat.rbac_level, // Inherit RBAC level
                    display_order: index * 10,
                    created_by: userId
                }));

                await supabase.from('file_categories').insert(subCats);
            }
        }
    },

    /**
     * Create a custom category or subcategory
     */
    async createFileCategory(params: {
        work_order_id: string;
        name: string;
        parent_id?: string | null;
        rbac_level?: 'office' | 'field' | 'office_only';
        created_by: string;
    }): Promise<FileCategory> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('file_categories')
            .insert({
                ...params,
                is_system: false,
                rbac_level: params.rbac_level || 'office',
                display_order: 999 // Custom cats at the end
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create category: ${error.message}`);
        return data as FileCategory;
    },

    /**
     * Delete a file category (only if empty)
     */
    async deleteFileCategory(categoryId: string): Promise<void> {
        const supabase = createClient();

        // Check if has files
        const { count: fileCount } = await supabase
            .from('work_order_files')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', categoryId);

        if (fileCount && fileCount > 0) {
            throw new Error('Cannot delete category containing files');
        }

        const { error } = await supabase
            .from('file_categories')
            .delete()
            .eq('id', categoryId);

        if (error) throw new Error(`Failed to delete category: ${error.message}`);
    },

    /**
     * Upload a file to a specific category
     */
    async uploadFileToCategory(
        workOrderId: string,
        categoryId: string,
        file: File,
        userId: string,
        categoryPathName: string = 'uploads' // Used for folder structure
    ): Promise<WorkOrderFile> {
        const supabase = createClient();

        // Clean path name
        const cleanPathName = categoryPathName.toLowerCase().replace(/[^a-z0-9]/g, '_');

        // Generate unique file path: work-orders/{woId}/{category}/{timestamp}_{filename}
        const fileExt = file.name.split('.').pop();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${workOrderId}/${cleanPathName}/${Date.now()}_${safeFileName}`;

        // Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('work-orders')
            .upload(storagePath, file);

        if (uploadError) throw new Error(`Failed to upload file: ${uploadError.message}`);

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('work-orders')
            .getPublicUrl(storagePath);

        // Create DB record
        const { data, error } = await supabase
            .from('work_order_files')
            .insert({
                work_order_id: workOrderId,
                category_id: categoryId,
                file_url: urlData.publicUrl,
                file_name: file.name,
                file_size: file.size,
                mime_type: file.type,
                uploaded_by: userId
            })
            .select('*, category:file_categories(*)')
            .single();

        if (error) throw new Error(`Failed to save file record: ${error.message}`);
        return data as WorkOrderFile;
    },

    /**
     * Move a file to a different category
     */
    async recategorizeFile(fileId: string, newCategoryId: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('work_order_files')
            .update({ category_id: newCategoryId })
            .eq('id', fileId);

        if (error) throw new Error(`Failed to move file: ${error.message}`);
    },

    /**
     * Delete a file
     */
    async deleteFile(fileId: string): Promise<void> {
        const supabase = createClient();

        // Get file info first to delete from storage
        const { data: file } = await supabase
            .from('work_order_files')
            .select('file_url')
            .eq('id', fileId)
            .single();

        if (file) {
            // Extract path from URL (simple assumption based on bucket structure)
            const url = new URL(file.file_url);
            const path = url.pathname.split('/work-orders/')[1];
            if (path) {
                await supabase.storage.from('work-orders').remove([decodeURIComponent(path)]);
            }
        }

        const { error } = await supabase
            .from('work_order_files')
            .delete()
            .eq('id', fileId);

        if (error) throw new Error(`Failed to delete file: ${error.message}`);
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
     * Get all users who are technicians (from user_profiles - primary source)
     * JOINs to technicians table for skills data
     */
    async getTechnicianUsers(): Promise<TechnicianUser[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
                id,
                display_name,
                avatar_url,
                phone,
                email,
                is_active,
                technician:technicians!user_profile_id (
                    id,
                    skills
                )
            `)
            .contains('user_types', ['technician'])
            .eq('is_active', true)
            .order('display_name', { ascending: true });

        if (error) {
            console.error('Error fetching technician users:', error);
            throw new Error(`Failed to fetch technician users: ${error.message}`);
        }

        return (data || []) as TechnicianUser[];
    },

    /**
     * Get assignments for a work order
     */
    async getAssignments(workOrderId: string): Promise<WorkOrderAssignment[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_assignments')
            .select('*, user_profile:user_profiles(id, display_name, avatar_url, email)')
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
                user_profile_id: techId,
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

        // Fetch technicians with optional user_profile join
        let techMap: Record<string, string> = {};
        if (techIds.length > 0) {
            const { data: techs } = await supabase
                .from('technicians')
                .select('id, name, user_profile:user_profiles(display_name)')
                .in('id', techIds);
            techMap = (techs || []).reduce((acc: Record<string, string>, t: any) => ({
                ...acc,
                [t.id]: t.user_profile?.display_name || t.name
            }), {});
        }

        // Fetch office staff with optional user_profile join
        let staffMap: Record<string, string> = {};
        if (staffIds.length > 0) {
            const { data: staff } = await supabase
                .from('office_staff')
                .select('id, name, user_profile:user_profiles(display_name)')
                .in('id', staffIds);
            staffMap = (staff || []).reduce((acc: Record<string, string>, s: any) => ({
                ...acc,
                [s.id]: s.user_profile?.display_name || s.name
            }), {});
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
     * Uses unified user_profiles when available (user_profile_id linked),
     * falls back to legacy name field for unlinked records.
     */
    async getReceiverOptions(): Promise<ReceiverOption[]> {
        const supabase = createClient();

        // Fetch technicians with optional user_profile join
        const { data: techs, error: techError } = await supabase
            .from('technicians')
            .select('id, name, user_profile_id, user_profile:user_profiles(display_name)')
            .order('name', { ascending: true });

        if (techError) {
            console.error('Error fetching technicians:', techError);
        }

        // Fetch office staff with optional user_profile join
        const { data: staff, error: staffError } = await supabase
            .from('office_staff')
            .select('id, name, title, user_profile_id, user_profile:user_profiles(display_name)')
            .order('name', { ascending: true });

        if (staffError) {
            console.error('Error fetching office staff:', staffError);
        }

        // Combine and format
        const options: ReceiverOption[] = [];

        // Add technicians - prefer user_profile.display_name if linked
        (techs || []).forEach((tech: any) => {
            const displayName = tech.user_profile?.display_name || tech.name;
            options.push({
                id: tech.id,
                name: displayName,
                type: 'technician',
                title: 'Technician'
            });
        });

        // Add office staff - prefer user_profile.display_name if linked
        (staff || []).forEach((s: any) => {
            const displayName = s.user_profile?.display_name || s.name;
            options.push({
                id: s.id,
                name: displayName,
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
                assignments:task_assignments(*, user_profile:user_profiles(id, display_name, avatar_url)),
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
                user_profile_id: techId
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

    // =============================================
    // SHIPPING COMMENTS
    // =============================================

    /**
     * Get all shipping comments for a work order (newest first)
     */
    async getShippingComments(workOrderId: string): Promise<ShippingComment[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_shipping_comments')
            .select(`
                *,
                user:user_profiles(id, display_name, avatar_url)
            `)
            .eq('work_order_id', workOrderId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch shipping comments: ${error.message}`);
        }

        return (data || []) as ShippingComment[];
    },

    /**
     * Add a shipping comment
     */
    async addShippingComment(workOrderId: string, content: string): Promise<ShippingComment> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('You must be logged in to add a comment');
        }

        const { data, error } = await supabase
            .from('work_order_shipping_comments')
            .insert([{
                work_order_id: workOrderId,
                user_id: user.id,
                content: content.trim()
            }])
            .select(`
                *,
                user:user_profiles(id, display_name, avatar_url)
            `)
            .single();

        if (error) {
            throw new Error(`Failed to add shipping comment: ${error.message}`);
        }

        return data as ShippingComment;
    },

    /**
     * Update a shipping comment (own comments only - enforced by RLS)
     */
    async updateShippingComment(commentId: string, content: string): Promise<ShippingComment> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_shipping_comments')
            .update({
                content: content.trim(),
                updated_at: new Date().toISOString()
            })
            .eq('id', commentId)
            .select(`
                *,
                user:user_profiles(id, display_name, avatar_url)
            `)
            .single();

        if (error) {
            throw new Error(`Failed to update shipping comment: ${error.message}`);
        }

        return data as ShippingComment;
    },

    /**
     * Delete a shipping comment (own comments only - enforced by RLS)
     */
    async deleteShippingComment(commentId: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('work_order_shipping_comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            throw new Error(`Failed to delete shipping comment: ${error.message}`);
        }
    },

    // =============================================
    // TASK COMMENTS
    // =============================================

    /**
     * Get all comments for a task (newest first)
     */
    async getTaskComments(taskId: string): Promise<TaskComment[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_task_comments')
            .select(`
                *,
                user:user_profiles(id, display_name, avatar_url),
                mentions:task_comment_mentions(
                    id,
                    mentioned_user_id,
                    user:user_profiles(id, display_name)
                )
            `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch task comments: ${error.message}`);
        }

        return (data || []) as TaskComment[];
    },

    /**
     * Get comment count for a task (for badge display)
     */
    async getTaskCommentCount(taskId: string): Promise<number> {
        const supabase = createClient();
        const { count, error } = await supabase
            .from('work_order_task_comments')
            .select('*', { count: 'exact', head: true })
            .eq('task_id', taskId);

        if (error) {
            console.error('Error fetching comment count:', error);
            return 0;
        }

        return count || 0;
    },

    /**
     * Add a task comment with optional attachments and mentions
     */
    async addTaskComment(
        taskId: string,
        content: string,
        attachments: string[] = [],
        mentionedUserIds: string[] = []
    ): Promise<TaskComment> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('You must be logged in to add a comment');
        }

        // Validate attachment limit
        if (attachments.length > 5) {
            throw new Error('Maximum 5 attachments allowed per comment');
        }

        // Create the comment
        const { data: comment, error } = await supabase
            .from('work_order_task_comments')
            .insert([{
                task_id: taskId,
                user_id: user.id,
                content: content.trim(),
                attachments
            }])
            .select(`
                *,
                user:user_profiles(id, display_name, avatar_url)
            `)
            .single();

        if (error) {
            throw new Error(`Failed to add task comment: ${error.message}`);
        }

        const mentions = mentionedUserIds.map(id => ({
            comment_id: comment.id,
            mentioned_user_id: id
        }));

        if (mentions.length > 0) {
            const { error: mentionError } = await supabase
                .from('task_comment_mentions')
                .insert(mentions);

            if (mentionError) {
                console.error('Failed to save mentions:', mentionError);
                // Don't fail the whole operation for mention errors
            }
        }

        return comment as TaskComment;
    },

    /**
     * Update a task comment (own comments only - enforced by RLS)
     */
    async updateTaskComment(
        commentId: string,
        content: string,
        attachments: string[] = [],
        mentionedUserIds: string[] = []
    ): Promise<TaskComment> {
        const supabase = createClient();

        // Validate attachment limit
        if (attachments.length > 5) {
            throw new Error('Maximum 5 attachments allowed per comment');
        }

        // Update the comment
        const { data, error } = await supabase
            .from('work_order_task_comments')
            .update({
                content: content.trim(),
                attachments,
                updated_at: new Date().toISOString()
            })
            .eq('id', commentId)
            .select(`
                *,
                user:user_profiles(id, display_name, avatar_url)
            `)
            .single();

        if (error) {
            throw new Error(`Failed to update task comment: ${error.message}`);
        }

        // Re-sync mentions: delete old, insert new
        await supabase
            .from('task_comment_mentions')
            .delete()
            .eq('comment_id', commentId);

        const mentions = mentionedUserIds.map(id => ({
            comment_id: commentId,
            mentioned_user_id: id
        }));

        if (mentions.length > 0) {
            await supabase
                .from('task_comment_mentions')
                .insert(mentions);
        }

        return data as TaskComment;
    },

    /**
     * Delete a task comment (own comments only - enforced by RLS)
     */
    async deleteTaskComment(commentId: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('work_order_task_comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            throw new Error(`Failed to delete task comment: ${error.message}`);
        }
    },

    /**
     * Get mentionable users for a work order
     * Returns: office_staff + assigned technicians + WO owner
     */
    async getMentionableUsers(workOrderId: string): Promise<MentionableUser[]> {
        const supabase = createClient();
        const mentionableUsers: MentionableUser[] = [];

        // 1. Get all office staff
        const { data: officeStaff } = await supabase
            .from('office_staff')
            .select('id, name')
            .order('name');

        (officeStaff || []).forEach((staff: { id: string; name: string }) => {
            mentionableUsers.push({
                id: staff.id,
                name: staff.name,
                type: 'user',
                avatar_url: null
            });
        });

        // 2. Get WO owner
        const { data: workOrder } = await supabase
            .from('work_orders')
            .select('owner_id, owner:user_profiles!work_orders_owner_id_fkey(id, display_name, avatar_url)')
            .eq('id', workOrderId)
            .single();

        if (workOrder?.owner) {
            const owner = workOrder.owner as { id: string; display_name: string; avatar_url: string | null };
            // Avoid duplicates
            if (!mentionableUsers.some(u => u.id === owner.id)) {
                mentionableUsers.push({
                    id: owner.id,
                    name: owner.display_name,
                    type: 'user',
                    avatar_url: owner.avatar_url
                });
            }
        }

        // 3. Get assigned technicians (now from user_profiles via assignments)
        const { data: assignments } = await supabase
            .from('work_order_assignments')
            .select('user_profile:user_profiles(id, display_name, avatar_url)')
            .eq('work_order_id', workOrderId);

        (assignments || []).forEach((assignment: { user_profile: { id: string; display_name: string; avatar_url: string | null } | null }) => {
            if (assignment.user_profile && !mentionableUsers.some(u => u.id === assignment.user_profile!.id)) {
                mentionableUsers.push({
                    id: assignment.user_profile.id,
                    name: assignment.user_profile.display_name,
                    type: 'technician',
                    avatar_url: assignment.user_profile.avatar_url
                });
            }
        });

        return mentionableUsers;
    },

    /**
     * Upload comment attachment to storage
     * Path: task-comments/{taskId}/{timestamp}_{filename}
     */
    async uploadCommentAttachment(taskId: string, file: File): Promise<string> {
        const supabase = createClient();

        // Validate file size (25MB max)
        const maxSize = 25 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('File size exceeds 25MB limit');
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('File type not allowed. Only PDF and images are supported.');
        }

        // Generate unique file name
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileName = `task-comments/${taskId}/${timestamp}_${randomStr}.${fileExt}`;

        // Upload to work-orders bucket (reusing existing bucket)
        const { error: uploadError } = await supabase.storage
            .from('work-orders')
            .upload(fileName, file);

        if (uploadError) {
            throw new Error(`Failed to upload attachment: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('work-orders')
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    },

    // =============================================
    // WORK ORDER CATEGORIES (WO-scoped)
    // =============================================

    /**
     * Get all categories for a work order
     */
    async getCategories(workOrderId: string): Promise<WorkOrderCategory[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_categories')
            .select('*')
            .eq('work_order_id', workOrderId)
            .order('name');

        if (error) {
            console.error('Error fetching categories:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Create a new category for a work order
     * Returns existing if name already exists
     */
    async createCategory(workOrderId: string, name: string, color: string = '#3B82F6'): Promise<WorkOrderCategory> {
        const supabase = createClient();

        // Check if category already exists
        const { data: existing } = await supabase
            .from('work_order_categories')
            .select('*')
            .eq('work_order_id', workOrderId)
            .ilike('name', name)
            .single();

        if (existing) {
            return existing as WorkOrderCategory;
        }

        // Create new
        const { data, error } = await supabase
            .from('work_order_categories')
            .insert([{ work_order_id: workOrderId, name: name.trim(), color }])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create category: ${error.message}`);
        }

        return data as WorkOrderCategory;
    },

    /**
     * Update a category
     */
    async updateCategory(categoryId: string, updates: { name?: string; color?: string }): Promise<WorkOrderCategory> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_categories')
            .update(updates)
            .eq('id', categoryId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update category: ${error.message}`);
        }

        return data as WorkOrderCategory;
    },

    /**
     * Delete a category
     */
    async deleteCategory(categoryId: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('work_order_categories')
            .delete()
            .eq('id', categoryId);

        if (error) {
            throw new Error(`Failed to delete category: ${error.message}`);
        }
    },

    // =============================================
    // TASK TAGS (Global)
    // =============================================

    /**
     * Get all global tags
     */
    async getAllTags(): Promise<TaskTag[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('task_tags')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching tags:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Create a new global tag
     * Returns existing if name already exists
     */
    async createTag(name: string, color: string = '#10B981'): Promise<TaskTag> {
        const supabase = createClient();

        // Check if tag already exists
        const { data: existing } = await supabase
            .from('task_tags')
            .select('*')
            .ilike('name', name)
            .single();

        if (existing) {
            return existing as TaskTag;
        }

        // Create new
        const { data, error } = await supabase
            .from('task_tags')
            .insert([{ name: name.trim(), color }])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create tag: ${error.message}`);
        }

        return data as TaskTag;
    },

    /**
     * Update a global tag
     */
    async updateTag(tagId: string, updates: { name?: string; color?: string }): Promise<TaskTag> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('task_tags')
            .update(updates)
            .eq('id', tagId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update tag: ${error.message}`);
        }

        return data as TaskTag;
    },

    /**
     * Delete a global tag
     */
    async deleteTag(tagId: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('task_tags')
            .delete()
            .eq('id', tagId);

        if (error) {
            throw new Error(`Failed to delete tag: ${error.message}`);
        }
    },

    /**
     * Get tags for a task
     */
    async getTaskTags(taskId: string): Promise<TaskTag[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('task_tag_assignments')
            .select('tag:task_tags(*)')
            .eq('task_id', taskId);

        if (error) {
            console.error('Error fetching task tags:', error);
            return [];
        }

        return (data || []).map((d: any) => d.tag).filter(Boolean) as TaskTag[];
    },

    /**
     * Assign tags to a task (replaces existing)
     */
    async assignTagsToTask(taskId: string, tagIds: string[]): Promise<void> {
        const supabase = createClient();

        // Delete existing assignments
        await supabase
            .from('task_tag_assignments')
            .delete()
            .eq('task_id', taskId);

        // Insert new assignments
        if (tagIds.length > 0) {
            const assignments = tagIds.map(tagId => ({
                task_id: taskId,
                tag_id: tagId
            }));

            const { error } = await supabase
                .from('task_tag_assignments')
                .insert(assignments);

            if (error) {
                throw new Error(`Failed to assign tags: ${error.message}`);
            }
        }
    },

    /**
     * Set category for a task
     */
    async setTaskCategory(taskId: string, categoryId: string | null): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('work_order_tasks')
            .update({ category_id: categoryId })
            .eq('id', taskId);

        if (error) {
            throw new Error(`Failed to set task category: ${error.message}`);
        }
    },

    // =============================================
    // WORK ORDER TEAM (Office Staff)
    // =============================================

    /**
     * Get all active office staff users for team selection
     * Uses user_profiles with user_types containing 'office_staff'
     */
    async getOfficeStaffUsers(): Promise<{ id: string; display_name: string; avatar_url: string | null }[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('user_profiles')
            .select('id, display_name, avatar_url')
            .contains('user_types', ['office_staff'])
            .eq('is_active', true)
            .order('display_name', { ascending: true });

        if (error) {
            console.error('Error fetching office staff users:', error);
            throw new Error(`Failed to fetch office staff users: ${error.message}`);
        }

        return (data || []);
    },

    /**
     * Get team members for a work order
     */
    async getTeamMembers(workOrderId: string): Promise<{ id: string; user_profile_id: string; user_profile: { id: string; display_name: string; avatar_url: string | null } }[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_team')
            .select('id, user_profile_id, user_profile:user_profiles(id, display_name, avatar_url)')
            .eq('work_order_id', workOrderId);

        if (error) {
            console.error('Error fetching team members:', error);
            throw new Error(`Failed to fetch team members: ${error.message}`);
        }

        return (data || []) as any;
    },

    /**
     * Add team members to a work order
     */
    async addTeamMembers(workOrderId: string, userProfileIds: string[]): Promise<void> {
        if (userProfileIds.length === 0) return;

        const supabase = createClient();
        const members = userProfileIds.map(userId => ({
            work_order_id: workOrderId,
            user_profile_id: userId
        }));

        const { error } = await supabase
            .from('work_order_team')
            .upsert(members, { onConflict: 'work_order_id,user_profile_id' });

        if (error) {
            throw new Error(`Failed to add team members: ${error.message}`);
        }
    },

    /**
     * Remove a team member from a work order
     */
    async removeTeamMember(workOrderId: string, userProfileId: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('work_order_team')
            .delete()
            .eq('work_order_id', workOrderId)
            .eq('user_profile_id', userProfileId);

        if (error) {
            throw new Error(`Failed to remove team member: ${error.message}`);
        }
    },
};
