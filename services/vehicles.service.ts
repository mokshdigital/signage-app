import { createCrudService } from './crud.service';
import { Vehicle } from '@/types/database';

/**
 * Service for vehicle CRUD operations
 * 
 * @example
 * import { vehiclesService } from '@/services';
 * 
 * // Fetch all vehicles
 * const vehicles = await vehiclesService.getAll();
 * 
 * // Get only available vehicles
 * const available = await vehiclesService.getByStatus('available');
 */
const baseService = createCrudService<Vehicle>('vehicles');

export const vehiclesService = {
    ...baseService,

    /**
     * Get vehicles by status
     */
    async getByStatus(status: Vehicle['status']): Promise<Vehicle[]> {
        return baseService.getWhere('status', 'eq', status);
    },

    /**
     * Get available vehicles count
     */
    async getAvailableCount(): Promise<number> {
        const available = await this.getByStatus('available');
        return available.length;
    },
};
