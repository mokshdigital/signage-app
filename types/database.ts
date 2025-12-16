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

export interface WorkOrderFile {
    id: string;
    work_order_id: string;
    file_url: string;
    file_name: string | null;
    file_size: number | null;
    mime_type: string | null;
    created_at: string;
}

export interface WorkOrder {
    id: string;
    uploaded_by: string | null;
    processed: boolean;
    analysis: any;
    created_at: string;
    // Optional: populated when files are joined in queries
    files?: WorkOrderFile[];
}
