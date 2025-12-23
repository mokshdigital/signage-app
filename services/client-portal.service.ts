/**
 * Client Portal Service
 * 
 * Handles all operations for the client-facing portal including:
 * - Fetching accessible work orders for logged-in project managers
 * - Work order details with owner contact info
 * - Client-visible files
 * - Chat export functionality
 */

import { createClient } from '@/lib/supabase/client';

export interface ClientWorkOrderSummary {
    id: string;
    work_order_number: string | null;
    site_address: string | null;
    job_status: string;
    client_po_number?: string | null;
    created_at: string;
}

export interface ClientWorkOrderDetail {
    id: string;
    work_order_number: string | null;
    client_po_number: string | null;
    site_address: string | null;
    job_status: string;
    created_at: string;
    // Owner info
    owner: {
        id: string;
        display_name: string;
        email: string | null;
        phone: string | null;
    } | null;
    // Client info
    client: {
        id: string;
        name: string;
    } | null;
    // Primary PM info
    project_manager: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
    } | null;
}

export interface ClientVisibleFile {
    id: string;
    file_name: string | null;
    file_url: string;
    file_size: number | null;
    mime_type: string | null;
    created_at: string;
    category_name: string | null;
}

export interface ChatMessageForExport {
    id: string;
    message: string;
    sender_name: string;
    sender_company: string | null;
    created_at: string;
    file_references: string[];
}

export interface CompanySettings {
    name: string;
    logo_url: string | null;
    phone: string | null;
    email: string | null;
}

export const clientPortalService = {
    /**
     * Get current user's project manager record
     * Returns null if user is not a project manager
     */
    async getCurrentProjectManager(): Promise<{ id: string; client_id: string; name: string; client_name: string } | null> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data, error } = await supabase
            .from('project_managers')
            .select(`
                id,
                client_id,
                name,
                client:clients(name)
            `)
            .eq('user_profile_id', user.id)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            client_id: data.client_id,
            name: data.name,
            client_name: (data.client as any)?.name || 'Unknown Client'
        };
    },

    /**
     * Get all work orders accessible to the current user
     * (where user is primary PM or additional authorized contact)
     */
    async getAccessibleWorkOrders(): Promise<ClientWorkOrderSummary[]> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return [];

        // First get the PM record for this user
        const pm = await this.getCurrentProjectManager();
        if (!pm) return [];

        // Get work orders where this PM is primary
        const { data: primaryWOs } = await supabase
            .from('work_orders')
            .select('id, work_order_number, site_address, job_status, created_at')
            .eq('pm_id', pm.id)
            .order('created_at', { ascending: false });

        // Get work orders where this PM has additional access
        const { data: additionalAccess } = await supabase
            .from('work_order_client_access')
            .select(`
                work_order:work_orders(id, work_order_number, site_address, job_status, created_at)
            `)
            .eq('project_manager_id', pm.id);

        // Combine and dedupe
        const workOrderMap = new Map<string, ClientWorkOrderSummary>();

        (primaryWOs || []).forEach(wo => {
            workOrderMap.set(wo.id, {
                id: wo.id,
                work_order_number: wo.work_order_number,
                site_address: wo.site_address,
                job_status: wo.job_status,
                created_at: wo.created_at
            });
        });

        (additionalAccess || []).forEach(a => {
            const wo = a.work_order as any;
            if (wo && !workOrderMap.has(wo.id)) {
                workOrderMap.set(wo.id, {
                    id: wo.id,
                    work_order_number: wo.work_order_number,
                    site_address: wo.site_address,
                    job_status: wo.job_status,
                    created_at: wo.created_at
                });
            }
        });

        return Array.from(workOrderMap.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    /**
     * Get detailed work order info for client display
     */
    async getWorkOrderForClient(workOrderId: string): Promise<ClientWorkOrderDetail | null> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('work_orders')
            .select(`
                id,
                work_order_number,
                site_address,
                job_status,
                created_at,
                owner:user_profiles!work_orders_owner_id_fkey(
                    id, display_name, email, phone
                ),
                client:clients(id, name),
                project_manager:project_managers(id, name, email, phone)
            `)
            .eq('id', workOrderId)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            work_order_number: data.work_order_number,
            client_po_number: null, // TODO: Add client_po_number to work_orders table if needed
            site_address: data.site_address,
            job_status: data.job_status,
            created_at: data.created_at,
            owner: data.owner as any,
            client: data.client as any,
            project_manager: data.project_manager as any
        };
    },

    /**
     * Get files visible to clients for a work order
     */
    async getClientVisibleFiles(workOrderId: string): Promise<ClientVisibleFile[]> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('work_order_files')
            .select(`
                id,
                file_name,
                file_url,
                file_size,
                mime_type,
                created_at,
                category:file_categories(name)
            `)
            .eq('work_order_id', workOrderId)
            .eq('is_client_visible', true)
            .order('created_at', { ascending: false });

        if (error || !data) return [];

        return data.map(f => ({
            id: f.id,
            file_name: f.file_name,
            file_url: f.file_url,
            file_size: f.file_size,
            mime_type: f.mime_type,
            created_at: f.created_at,
            category_name: (f.category as any)?.name || null
        }));
    },

    /**
     * Get chat messages for PDF export
     */
    async getChatMessagesForExport(workOrderId: string): Promise<ChatMessageForExport[]> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('work_order_client_chat')
            .select(`
                id,
                message,
                sender_company_name,
                file_references,
                created_at,
                sender:user_profiles!work_order_client_chat_sender_id_fkey(
                    display_name
                )
            `)
            .eq('work_order_id', workOrderId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });

        if (error || !data) return [];

        return data.map(m => ({
            id: m.id,
            message: m.message,
            sender_name: (m.sender as any)?.display_name || 'Unknown',
            sender_company: m.sender_company_name,
            created_at: m.created_at,
            file_references: m.file_references || []
        }));
    },

    /**
     * Get company settings for branding
     */
    async getCompanySettings(): Promise<CompanySettings> {
        const supabase = createClient();

        const { data } = await supabase
            .from('company_settings')
            .select('name, logo_url, phone, email')
            .single();

        return {
            name: data?.name || 'Tops Lighting',
            logo_url: data?.logo_url || null,
            phone: data?.phone || null,
            email: data?.email || null
        };
    },

    /**
     * Check if current user can access a specific work order
     */
    async canAccessWorkOrder(workOrderId: string): Promise<boolean> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        const pm = await this.getCurrentProjectManager();
        if (!pm) return false;

        // Check if primary PM
        const { data: wo } = await supabase
            .from('work_orders')
            .select('pm_id')
            .eq('id', workOrderId)
            .single();

        if (wo?.pm_id === pm.id) return true;

        // Check if additional access
        const { data: access } = await supabase
            .from('work_order_client_access')
            .select('id')
            .eq('work_order_id', workOrderId)
            .eq('project_manager_id', pm.id)
            .single();

        return !!access;
    }
};
