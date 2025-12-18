export interface Technician {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    skills: string[] | null;
    created_at: string;
}

export interface Equipment {
    id: string;
    name: string;
    type: string | null;
    status: 'available' | 'in-use' | 'maintenance';
    created_at: string;
}

export interface Vehicle {
    id: string;
    name: string;
    make: string | null;
    license_plate: string | null;
    driver: string | null;
    registration: string | null;
    gross_weight: string | null;
    vin: string | null;
    type: string | null;
    status: 'available' | 'in-use' | 'maintenance';
    created_at: string;
}

export interface OfficeStaff {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    title: string | null;
    created_at: string;
}

export interface WorkOrderFile {
    id: string;
    work_order_id: string;
    file_url: string;
    file_name: string | null;
    file_size: number | null;
    mime_type: string | null;
    created_at: string;
}

// Client entity - corporate companies
export interface Client {
    id: string;
    name: string;
    address: string | null;
    notes: string | null;
    created_at: string;
    // Optional: populated when project_managers are joined
    project_managers?: ProjectManager[];
    // Optional: count of project managers
    pm_count?: number;
}

// Project Manager - external client contact (NOT internal office_staff)
export interface ProjectManager {
    id: string;
    client_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    created_at: string;
    // Optional: populated when client is joined
    client?: Client;
}

export interface WorkOrder {
    id: string;
    uploaded_by: string | null;
    processed: boolean;
    analysis: any;
    created_at: string;
    // Client assignment (Phase 11)
    client_id: string | null;
    pm_id: string | null;
    // Optional: populated when files are joined in queries
    files?: WorkOrderFile[];
    // Optional: populated when client/PM are joined
    client?: Client;
    project_manager?: ProjectManager;
}
