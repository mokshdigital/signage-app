import { createCrudService } from './crud.service';
import { OfficeStaff } from '@/types/database';

/**
 * Service for Office Staff CRUD operations
 */
const baseService = createCrudService<OfficeStaff>('office_staff');

export const officeStaffService = {
    ...baseService,
    // Add custom methods here if needed in future
};
