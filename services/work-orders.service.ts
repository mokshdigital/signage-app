import { createClient } from '@/lib/supabase/client';
import { WorkOrder, WorkOrderFile } from '@/types/database';

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
    /**
     * Fetch all work orders
     */
    async getAll(): Promise<WorkOrder[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching work orders:', error);
            throw new Error(`Failed to fetch work orders: ${error.message}`);
        }

        return (data || []) as WorkOrder[];
    },

    /**
     * Get a single work order by ID
     */
    async getById(id: string): Promise<WorkOrder | null> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch work order: ${error.message}`);
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
            }])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create work order: ${error.message}`);
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

        // Delete work order (CASCADE will delete file records)
        const { error } = await supabase
            .from('work_orders')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete work order: ${error.message}`);
        }
    },

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
};
