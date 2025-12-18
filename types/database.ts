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

// Job Type - categorizes work orders
export interface JobType {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
}

// Work Order Assignment - junction table linking work orders to technicians
export interface WorkOrderAssignment {
    id: string;
    work_order_id: string;
    technician_id: string;
    assigned_at: string;
    notes: string | null;
    // Optional: populated when technician is joined
    technician?: Technician;
}

// Receipt type for received_by_type
export type ReceiverType = 'technician' | 'office_staff';

// Work Order Shipment - tracks shipments for a work order
export interface WorkOrderShipment {
    id: string;
    work_order_id: string;
    tracking_id: string | null;
    contents: string | null;
    status_location: string;
    received_by_id: string | null;
    received_by_type: ReceiverType | null;
    received_at: string | null;
    receipt_photos: string[] | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Optional: populated when receiver is joined (either tech or office staff)
    received_by_name?: string;
}

// Combined type for receiver dropdown options
export interface ReceiverOption {
    id: string;
    name: string;
    type: ReceiverType;
    title?: string | null; // office_staff title or technician role info
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
    // Sub-Phase A: Work Order Number and Logistics
    work_order_number: string | null;
    job_type_id: string | null;
    site_address: string | null;
    planned_date: string | null;  // DATE stored as ISO string
    work_order_date: string | null;  // DATE stored as ISO string
    // Sub-Phase B: Requirements
    skills_required: string[] | null;
    permits_required: string[] | null;
    equipment_required: string[] | null;
    materials_required: string[] | null;
    // Optional: populated when files are joined in queries
    files?: WorkOrderFile[];
    // Optional: populated when client/PM are joined
    client?: Client;
    project_manager?: ProjectManager;
    // Optional: populated when job_type is joined
    job_type?: JobType;
    // Optional: populated when assignments are joined
    assignments?: WorkOrderAssignment[];
    // Optional: populated when shipments are joined
    shipments?: WorkOrderShipment[];
}
