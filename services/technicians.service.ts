import { createCrudService } from './crud.service';
import { Technician } from '@/types/database';

/**
 * Service for technician CRUD operations
 * 
 * @example
 * import { techniciansService } from '@/services';
 * 
 * // Fetch all technicians
 * const techs = await techniciansService.getAll();
 * 
 * // Create a new technician
 * const newTech = await techniciansService.create({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '555-1234',
 *   skills: ['electrical', 'signage installation'],
 * });
 */
export const techniciansService = {
    ...createCrudService<Technician>('technicians'),

    /**
     * Find technicians by skill
     */
    async findBySkill(skill: string): Promise<Technician[]> {
        const allTechs = await this.getAll();
        return allTechs.filter(tech =>
            tech.skills?.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        );
    },
};
