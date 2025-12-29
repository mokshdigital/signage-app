export interface Technician {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    skills: string[] | null;
    user_profile_id: string | null; // Optional link to user_profiles
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



// User who is a technician (from user_profiles - primary source)
// Links to legacy technicians table for skills data
export interface TechnicianUser {
    id: string;                    // user_profile ID
    display_name: string;
    avatar_url: string | null;
    phone: string | null;
    email: string | null;
    is_active: boolean;
    // Optional: linked technician extension data (skills, timesheets, etc.)
    technician?: {
        id: string;
        skills: string[] | null;
    }[] | null;
}

// File Category - for organizing WO files
export interface FileCategory {
    id: string;
    work_order_id: string;
    name: string;
    parent_id: string | null;
    is_system: boolean;
    rbac_level: 'office' | 'field' | 'office_only';
    display_order: number;
    created_by: string | null;
    created_at: string;
    // Optional: populated when recursively joined
    subcategories?: FileCategory[];
    files?: WorkOrderFile[];
}

export interface WorkOrderFile {
    id: string;
    work_order_id: string;
    file_url: string;
    file_name: string | null;
    file_size: number | null;
    mime_type: string | null;
    category_id: string | null;
    uploaded_by: string | null;
    is_client_visible: boolean;
    created_at: string;
    // Optional: populated when category is joined
    category?: FileCategory;
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
    client_id?: string;
    name: string;
    email: string | null;
    phone?: string | null;
    user_profile_id?: string | null;  // Link to auth account for portal access
    created_at?: string;
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
    user_profile_id: string;  // References user_profiles.id directly
    assigned_at: string;
    notes: string | null;
    // Optional: populated when user_profile is joined
    user_profile?: {
        id: string;
        display_name: string;
        avatar_url: string | null;
        email: string | null;
    };
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

// Job Status - workflow status for work orders
export type JobStatus = 'Open' | 'Active' | 'On Hold' | 'Completed' | 'Submitted' | 'Invoiced' | 'Cancelled';

// Owner profile type (partial user_profile for display)
export interface WorkOrderOwner {
    id: string;
    display_name: string;
    avatar_url: string | null;
}

// Shipping comment for tracking client conversations
export interface ShippingComment {
    id: string;
    work_order_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    // Optional: populated when user is joined
    user?: {
        id: string;
        display_name: string;
        avatar_url: string | null;
    };
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
    planned_dates?: string[] | null;  // Array of DATE ISO strings
    work_order_date: string | null;  // DATE stored as ISO string
    // Scheduling fields
    estimated_days?: number | null;
    scheduling_notes?: string | null;
    // Sub-Phase B: Requirements
    skills_required: string[] | null;
    permits_required: string[] | null;
    equipment_required: string[] | null;
    materials_required: string[] | null;
    recommended_techs: number | null;
    scope_of_work: string | null;
    // Owner and Status (Phase 15)
    owner_id: string | null;
    shipment_status: string | null;
    job_status: JobStatus;
    review_needed?: boolean;
    job_status_reason: string | null;
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
    // Optional: populated when tasks are joined
    tasks?: WorkOrderTask[];
    // Optional: populated when owner is joined
    owner?: WorkOrderOwner;
    // Optional: populated when shipping comments are joined
    shipping_comments?: ShippingComment[];
}

export interface ChecklistTemplate {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    // Optional: items
    items?: ChecklistTemplateItem[];
}

export interface ChecklistTemplateItem {
    id: string;
    template_id: string;
    content: string;
    sort_order: number;
    created_at: string;
}

export type TaskStatus = 'Pending' | 'In Progress' | 'On Hold' | 'Blocked' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Emergency';

export interface WorkOrderTask {
    id: string;
    work_order_id: string;
    name: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    block_reason: string | null;
    category_id: string | null;
    created_at: string;
    updated_at: string;
    // Optional: Arrays for UI
    assignments?: TaskAssignment[];
    checklists?: TaskChecklist[];
    // Optional: Joined data
    category?: WorkOrderCategory;
    tags?: TaskTag[];
    // Helper functionality
    progress?: number; // Calculated field
}

export interface TaskAssignment {
    id: string;
    task_id: string;
    user_profile_id: string;  // References user_profiles.id directly
    // Optional: joined user profile data
    user_profile?: {
        id: string;
        display_name: string;
        avatar_url: string | null;
    };
}

export interface TaskChecklist {
    id: string;
    task_id: string;
    content: string;
    is_completed: boolean;
    completed_by_id: string | null;
    completed_at: string | null;
    sort_order: number;
    created_at: string;
    // Optional
    completed_by?: { display_name: string; avatar_url: string | null }; // Using a partial user profile structure
}

// Task Comment - threaded comments on individual tasks
export interface TaskComment {
    id: string;
    task_id: string;
    user_id: string;
    content: string;
    attachments: string[];
    created_at: string;
    updated_at: string;
    // Joined data
    user?: {
        id: string;
        display_name: string;
        avatar_url: string | null;
    };
    mentions?: TaskCommentMention[];
}

// Task Comment Mention - junction table for @mentions
export interface TaskCommentMention {
    id: string;
    comment_id: string;
    mentioned_user_id: string | null;
    created_at: string;
    // Joined data
    user?: { id: string; display_name: string };

}

// Mentionable User - combined type for @mention dropdown
export interface MentionableUser {
    id: string;
    name: string;
    type: 'user' | 'technician';
    avatar_url?: string | null;
}

// Work Order Category - categories scoped to a work order
export interface WorkOrderCategory {
    id: string;
    work_order_id: string;
    name: string;
    color: string;
    created_at: string;
}

// Task Tag - global tags for tasks
export interface TaskTag {
    id: string;
    name: string;
    color: string;
    created_at: string;
}

// Task Tag Assignment - junction table for task tags
export interface TaskTagAssignment {
    id: string;
    task_id: string;
    tag_id: string;
    created_at: string;
    // Joined data
    tag?: TaskTag;
}

// =============================================
// TIMESHEET SYSTEM TYPES (Phase 30)
// =============================================

// Location Chip - admin-managed locations
export interface LocationChip {
    id: string;
    name: string;
    color: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

// Activity Type - admin-managed with WO requirement flag
export interface ActivityType {
    id: string;
    name: string;
    color: string;
    requires_wo: boolean;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

// Timesheet Day Status
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'processed';

// Timesheet Day - header table (one per user per date)
export interface TimesheetDay {
    id: string;
    user_id: string;
    work_date: string; // DATE as ISO string
    status: TimesheetStatus;
    total_hours: number;
    submitted_at: string | null;
    approved_by: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;
    // Optional: joined data
    user?: {
        id: string;
        display_name: string;
        avatar_url: string | null;
    };
    entries?: TimesheetEntry[];
    approver?: {
        id: string;
        display_name: string;
    };
}

// Timesheet Entry - detail table
export interface TimesheetEntry {
    id: string;
    timesheet_day_id: string;
    activity_type_id: string;
    location_chip_id: string;
    work_order_id: string | null; // NULL = "General"
    hours: number;
    start_time: string | null;
    end_time: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Optional: joined data
    activity_type?: ActivityType;
    location_chip?: LocationChip;
    work_order?: {
        id: string;
        work_order_number: string | null;
        site_address: string | null;
    };
}

// Timesheet Status History - audit trail
export interface TimesheetStatusHistory {
    id: string;
    timesheet_day_id: string;
    from_status: string | null;
    to_status: string;
    changed_by: string;
    notes: string | null;
    created_at: string;
    // Optional: joined data
    changed_by_user?: {
        id: string;
        display_name: string;
    };
}

// Timesheet Day Request Status
export type DayRequestStatus = 'pending' | 'approved' | 'denied';

// Timesheet Day Request - past-day edit requests
export interface TimesheetDayRequest {
    id: string;
    user_id: string;
    requested_date: string; // DATE as ISO string
    reason: string;
    status: DayRequestStatus;
    reviewed_by: string | null;
    reviewed_at: string | null;
    review_notes: string | null;
    created_at: string;
    updated_at: string;
    // Optional: joined data
    user?: {
        id: string;
        display_name: string;
        avatar_url: string | null;
    };
    reviewer?: {
        id: string;
        display_name: string;
    };
}

// Invoice Staging Source Type
export type InvoiceStagingSourceType = 'labor' | 'material' | 'equipment' | 'expense';

// WO Invoice Staging - billable items
export interface InvoiceStagingItem {
    id: string;
    work_order_id: string;
    source_type: InvoiceStagingSourceType;
    source_id: string;
    description: string | null;
    quantity: number;
    unit: string;
    actual_value: number;
    billed_value: number;
    unit_rate: number;
    is_billable: boolean;
    locked: boolean;
    created_at: string;
    updated_at: string;
    // Optional: joined data
    work_order?: {
        id: string;
        work_order_number: string | null;
    };
}

// Weekly Summary for display
export interface WeeklySummary {
    weekStart: string;
    weekEnd: string;
    totalHours: number;
    days: {
        date: string;
        dayOfWeek: string;
        hours: number;
        status: TimesheetStatus | null;
        dayId: string | null;
    }[];
}
