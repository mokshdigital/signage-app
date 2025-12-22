import { createClient } from '@/lib/supabase/client';
import { Client, ProjectManager, WorkOrder } from '@/types/database';

/**
 * Service for Client and Project Manager operations
 * 
 * Clients are corporate entities with PMs as their contacts.
 * PMs (Project Managers) are labeled as "Client Contacts" in the UI
 * to distinguish them from internal office_staff.
 */
export const clientsService = {
    // ============================================
    // CLIENT OPERATIONS
    // ============================================

    /**
     * Fetch all clients with optional PM count
     */
    async getAll(): Promise<Client[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('clients')
            .select(`
                *,
                project_managers (id)
            `)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching clients:', error);
            throw new Error(`Failed to fetch clients: ${error.message}`);
        }

        // Transform to include pm_count
        return (data || []).map(client => ({
            ...client,
            pm_count: client.project_managers?.length || 0,
            project_managers: undefined, // Remove the raw join data
        })) as Client[];
    },

    /**
     * Get a single client by ID with their project managers
     */
    async getById(id: string): Promise<Client | null> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('clients')
            .select(`
                *,
                project_managers (*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch client: ${error.message}`);
        }

        return data as Client;
    },

    /**
     * Create a new client
     */
    async create(client: Omit<Client, 'id' | 'created_at' | 'project_managers' | 'pm_count'>): Promise<Client> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('clients')
            .insert([client])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create client: ${error.message}`);
        }

        return data as Client;
    },

    /**
     * Update a client
     */
    async update(id: string, updates: Partial<Omit<Client, 'id' | 'created_at'>>): Promise<Client> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update client: ${error.message}`);
        }

        return data as Client;
    },

    /**
     * Delete a client (cascades to PMs)
     */
    async delete(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete client: ${error.message}`);
        }
    },

    /**
     * Search clients by name
     */
    async search(query: string): Promise<Client[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .ilike('name', `%${query}%`)
            .order('name', { ascending: true })
            .limit(20);

        if (error) {
            throw new Error(`Failed to search clients: ${error.message}`);
        }

        return (data || []) as Client[];
    },

    // ============================================
    // PROJECT MANAGER OPERATIONS
    // ============================================

    /**
     * Get all project managers for a client
     */
    async getProjectManagers(clientId: string): Promise<ProjectManager[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('project_managers')
            .select('*')
            .eq('client_id', clientId)
            .order('name', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch project managers: ${error.message}`);
        }

        return (data || []) as ProjectManager[];
    },

    /**
     * Create a project manager for a client
     */
    async createProjectManager(pm: Omit<ProjectManager, 'id' | 'created_at' | 'client' | 'client_id'> & { client_id: string }): Promise<ProjectManager> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('project_managers')
            .insert([pm])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create project manager: ${error.message}`);
        }

        return data as ProjectManager;
    },

    /**
     * Update a project manager
     */
    async updateProjectManager(id: string, updates: Partial<Omit<ProjectManager, 'id' | 'created_at'>>): Promise<ProjectManager> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('project_managers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update project manager: ${error.message}`);
        }

        return data as ProjectManager;
    },

    /**
     * Delete a project manager
     */
    async deleteProjectManager(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('project_managers')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete project manager: ${error.message}`);
        }
    },

    /**
     * Search project managers across all clients
     * Returns results with client info
     */
    async searchProjectManagers(query: string): Promise<ProjectManager[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('project_managers')
            .select(`
                *,
                client:clients (id, name)
            `)
            .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
            .order('name', { ascending: true })
            .limit(20);

        if (error) {
            throw new Error(`Failed to search project managers: ${error.message}`);
        }

        return (data || []) as ProjectManager[];
    },

    // ============================================
    // WORK ORDER ASSIGNMENT OPERATIONS
    // ============================================

    /**
     * Get work orders for a client
     */
    async getClientWorkOrders(clientId: string): Promise<WorkOrder[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_orders')
            .select(`
                *,
                project_manager:project_managers (id, name, email)
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch client work orders: ${error.message}`);
        }

        return (data || []) as WorkOrder[];
    },

    /**
     * Assign a work order to a client and PM
     */
    async assignWorkOrder(
        workOrderId: string,
        clientId: string,
        pmId: string | null
    ): Promise<WorkOrder> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_orders')
            .update({
                client_id: clientId,
                pm_id: pmId,
            })
            .eq('id', workOrderId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to assign work order: ${error.message}`);
        }

        return data as WorkOrder;
    },

    /**
     * Unassign a work order (remove client/PM)
     */
    async unassignWorkOrder(workOrderId: string): Promise<WorkOrder> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_orders')
            .update({
                client_id: null,
                pm_id: null,
            })
            .eq('id', workOrderId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to unassign work order: ${error.message}`);
        }

        return data as WorkOrder;
    },
};
