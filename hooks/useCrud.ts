import { useState, useEffect, useCallback } from 'react';

interface CrudService<T> {
    getAll: () => Promise<T[]>;
    create: (item: any) => Promise<T>;
    update?: (id: string, updates: Partial<T>) => Promise<T>;
    delete: (id: string) => Promise<void>;
}

interface UseCrudOptions {
    /** If true, automatically fetch data on mount */
    fetchOnMount?: boolean;
}

/**
 * Generic CRUD operations hook that works with any service
 * 
 * @example
 * const { items, loading, create, remove, refresh } = useCrud(techniciansService);
 * 
 * // Create a new item
 * await create({ name: 'John', email: 'john@example.com' });
 * 
 * // Delete an item
 * await remove('item-id');
 */

export function useCrud<T extends { id: string }>(
    service: CrudService<T>,
    options: UseCrudOptions = { fetchOnMount: true }
) {
    // ... (state and callbacks remain the same)
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await service.getAll();
            setItems(data);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [service]);

    const create = useCallback(async (item: any): Promise<T> => {
        setActionLoading(true);
        try {
            const newItem = await service.create(item);
            setItems(prev => [newItem, ...prev]);
            return newItem;
        } finally {
            setActionLoading(false);
        }
    }, [service]);

    const update = useCallback(async (id: string, updates: Partial<T>): Promise<T | null> => {
        if (!service.update) {
            console.warn('Update method not available on this service');
            return null;
        }
        setActionLoading(true);
        try {
            const updatedItem = await service.update(id, updates);
            setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
            return updatedItem;
        } finally {
            setActionLoading(false);
        }
    }, [service]);

    const remove = useCallback(async (id: string): Promise<void> => {
        setActionLoading(true);
        try {
            await service.delete(id);
            setItems(prev => prev.filter(item => item.id !== id));
        } finally {
            setActionLoading(false);
        }
    }, [service]);

    const refresh = useCallback(() => {
        return fetchAll();
    }, [fetchAll]);

    // Initial fetch
    useEffect(() => {
        if (options.fetchOnMount) {
            fetchAll();
        }
    }, [fetchAll, options.fetchOnMount]);

    return {
        items,
        loading,
        error,
        actionLoading,
        create,
        update,
        remove,
        // Aliases for compatibility
        createItem: create,
        updateItem: update,
        deleteItem: remove,
        refresh,
        fetchAll,
        setItems,
        count: items.length,
        isEmpty: !loading && items.length === 0,
    };
}
