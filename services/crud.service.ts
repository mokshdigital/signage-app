import { createClient } from '@/lib/supabase/client';

// Define the valid table names in your database
export type TableName =
    | 'technicians'
    | 'equipment'
    | 'vehicles'
    | 'work_orders'
    | 'work_order_files'
    | 'user_profiles';

/**
 * Factory function to create a typed CRUD service for any Supabase table
 * 
 * @example
 * // Create a service for the 'technicians' table
 * const techniciansService = createCrudService<Technician>('technicians');
 * 
 * // Use the service
 * const allTechs = await techniciansService.getAll();
 * const newTech = await techniciansService.create({ name: 'John', email: 'john@example.com' });
 */
export function createCrudService<T extends { id: string; created_at: string }>(
    tableName: TableName,
    options: {
        orderBy?: keyof T;
        ascending?: boolean;
    } = {}
) {
    const { orderBy = 'created_at' as keyof T, ascending = false } = options;

    return {
        /**
         * Fetch all records from the table
         */
        async getAll(): Promise<T[]> {
            const supabase = createClient();
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .order(String(orderBy), { ascending });

            if (error) {
                console.error(`Error fetching ${tableName}:`, error);
                throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
            }

            return (data || []) as unknown as T[];
        },

        /**
         * Fetch a single record by ID
         */
        async getById(id: string): Promise<T | null> {
            const supabase = createClient();
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Not found
                }
                console.error(`Error fetching ${tableName} by id:`, error);
                throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
            }

            return data as unknown as T;
        },

        /**
         * Create a new record
         */
        async create(item: Omit<T, 'id' | 'created_at'>): Promise<T> {
            const supabase = createClient();
            const { data, error } = await supabase
                .from(tableName)
                .insert([item as Record<string, unknown>])
                .select()
                .single();

            if (error) {
                console.error(`Error creating ${tableName}:`, error);
                throw new Error(`Failed to create ${tableName}: ${error.message}`);
            }

            return data as unknown as T;
        },

        /**
         * Update an existing record by ID
         */
        async update(id: string, updates: Partial<T>): Promise<T> {
            const supabase = createClient();
            const { data, error } = await supabase
                .from(tableName)
                .update(updates as Record<string, unknown>)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error(`Error updating ${tableName}:`, error);
                throw new Error(`Failed to update ${tableName}: ${error.message}`);
            }

            return data as unknown as T;
        },

        /**
         * Delete a record by ID
         */
        async delete(id: string): Promise<void> {
            const supabase = createClient();
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) {
                console.error(`Error deleting ${tableName}:`, error);
                throw new Error(`Failed to delete ${tableName}: ${error.message}`);
            }
        },

        /**
         * Fetch records with a custom filter
         */
        async getWhere(
            column: keyof T,
            operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike',
            value: unknown
        ): Promise<T[]> {
            const supabase = createClient();
            let query = supabase.from(tableName).select('*');

            switch (operator) {
                case 'eq':
                    query = query.eq(String(column), value as string | number);
                    break;
                case 'neq':
                    query = query.neq(String(column), value as string | number);
                    break;
                case 'gt':
                    query = query.gt(String(column), value as string | number);
                    break;
                case 'gte':
                    query = query.gte(String(column), value as string | number);
                    break;
                case 'lt':
                    query = query.lt(String(column), value as string | number);
                    break;
                case 'lte':
                    query = query.lte(String(column), value as string | number);
                    break;
                case 'like':
                    query = query.like(String(column), value as string);
                    break;
                case 'ilike':
                    query = query.ilike(String(column), value as string);
                    break;
            }

            const { data, error } = await query.order(String(orderBy), { ascending });

            if (error) {
                console.error(`Error fetching ${tableName} with filter:`, error);
                throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
            }

            return (data || []) as unknown as T[];
        },
    };
}
