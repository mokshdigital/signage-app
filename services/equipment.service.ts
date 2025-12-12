import { createCrudService } from './crud.service';
import { Equipment } from '@/types/database';

/**
 * Service for equipment CRUD operations
 * 
 * @example
 * import { equipmentService } from '@/services';
 * 
 * // Fetch all equipment
 * const equipment = await equipmentService.getAll();
 * 
 * // Get only available equipment
 * const available = await equipmentService.getByStatus('available');
 */
const baseService = createCrudService<Equipment>('equipment');

export const equipmentService = {
    ...baseService,

    /**
     * Get equipment by status
     */
    async getByStatus(status: Equipment['status']): Promise<Equipment[]> {
        return baseService.getWhere('status', 'eq', status);
    },

    /**
     * Get available equipment count
     */
    async getAvailableCount(): Promise<number> {
        const available = await this.getByStatus('available');
        return available.length;
    },
};
