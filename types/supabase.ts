export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            work_orders: {
                Row: {
                    id: string
                    uploaded_by: string | null
                    processed: boolean
                    analysis: Json | null
                    client_id: string | null
                    pm_id: string | null
                    work_order_number: string | null
                    job_type_id: string | null
                    site_address: string | null
                    planned_date: string | null
                    work_order_date: string | null
                    skills_required: string[] | null
                    permits_required: string[] | null
                    equipment_required: string[] | null
                    materials_required: string[] | null
                    recommended_techs: number | null
                    scope_of_work: string | null
                    owner_id: string | null
                    shipment_status: string | null
                    job_status: string
                    job_status_reason: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    uploaded_by?: string | null
                    processed?: boolean
                    analysis?: Json | null
                    client_id?: string | null
                    pm_id?: string | null
                    work_order_number?: string | null
                    job_type_id?: string | null
                    site_address?: string | null
                    planned_date?: string | null
                    work_order_date?: string | null
                    skills_required?: string[] | null
                    permits_required?: string[] | null
                    equipment_required?: string[] | null
                    materials_required?: string[] | null
                    recommended_techs?: number | null
                    scope_of_work?: string | null
                    owner_id?: string | null
                    shipment_status?: string | null
                    job_status?: string
                    job_status_reason?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    uploaded_by?: string | null
                    processed?: boolean
                    analysis?: Json | null
                    client_id?: string | null
                    pm_id?: string | null
                    work_order_number?: string | null
                    job_type_id?: string | null
                    site_address?: string | null
                    planned_date?: string | null
                    work_order_date?: string | null
                    skills_required?: string[] | null
                    permits_required?: string[] | null
                    equipment_required?: string[] | null
                    materials_required?: string[] | null
                    recommended_techs?: number | null
                    scope_of_work?: string | null
                    owner_id?: string | null
                    shipment_status?: string | null
                    job_status?: string
                    job_status_reason?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "work_orders_client_id_fkey"
                        columns: ["client_id"]
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "work_orders_pm_id_fkey"
                        columns: ["pm_id"]
                        referencedRelation: "project_managers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "work_orders_job_type_id_fkey"
                        columns: ["job_type_id"]
                        referencedRelation: "job_types"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "work_orders_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "user_profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            file_categories: {
                Row: {
                    id: string
                    work_order_id: string
                    name: string
                    parent_id: string | null
                    is_system: boolean
                    rbac_level: string
                    display_order: number
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    work_order_id: string
                    name: string
                    parent_id?: string | null
                    is_system?: boolean
                    rbac_level?: string
                    display_order?: number
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    work_order_id?: string
                    name?: string
                    parent_id?: string | null
                    is_system?: boolean
                    rbac_level?: string
                    display_order?: number
                    created_by?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "file_categories_work_order_id_fkey"
                        columns: ["work_order_id"]
                        referencedRelation: "work_orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "file_categories_parent_id_fkey"
                        columns: ["parent_id"]
                        referencedRelation: "file_categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "file_categories_created_by_fkey"
                        columns: ["created_by"]
                        referencedRelation: "user_profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            work_order_files: {
                Row: {
                    id: string
                    work_order_id: string
                    file_url: string
                    file_name: string | null
                    file_size: number | null
                    mime_type: string | null
                    category_id: string | null
                    uploaded_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    work_order_id: string
                    file_url: string
                    file_name?: string | null
                    file_size?: number | null
                    mime_type?: string | null
                    category_id?: string | null
                    uploaded_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    work_order_id?: string
                    file_url?: string
                    file_name?: string | null
                    file_size?: number | null
                    mime_type?: string | null
                    category_id?: string | null
                    uploaded_by?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "work_order_files_work_order_id_fkey"
                        columns: ["work_order_id"]
                        referencedRelation: "work_orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "work_order_files_category_id_fkey"
                        columns: ["category_id"]
                        referencedRelation: "file_categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "work_order_files_uploaded_by_fkey"
                        columns: ["uploaded_by"]
                        referencedRelation: "user_profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            office_staff: {
                Row: {
                    id: string
                    name: string
                    email: string | null
                    phone: string | null
                    title: string | null
                    user_profile_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    title?: string | null
                    user_profile_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    title?: string | null
                    user_profile_id?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "office_staff_user_profile_id_fkey"
                        columns: ["user_profile_id"]
                        referencedRelation: "user_profiles"
                        referencedColumns: ["id"]
                    }
                ]
            },
            technicians: {
                Row: {
                    id: string
                    name: string
                    email: string | null
                    phone: string | null
                    skills: string[] | null
                    user_profile_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    skills?: string[] | null
                    user_profile_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    skills?: string[] | null
                    user_profile_id?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "technicians_user_profile_id_fkey"
                        columns: ["user_profile_id"]
                        referencedRelation: "user_profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            invitations: {
                Row: {
                    id: string
                    email: string
                    display_name: string
                    nick_name: string | null
                    role_id: string | null
                    is_technician: boolean
                    is_office_staff: boolean
                    skills: string[] | null
                    job_title: string | null
                    invited_by: string | null
                    created_at: string
                    claimed_at: string | null
                    claimed_by: string | null
                }
                Insert: {
                    id?: string
                    email: string
                    display_name: string
                    nick_name?: string | null
                    role_id?: string | null
                    is_technician?: boolean
                    is_office_staff?: boolean
                    skills?: string[] | null
                    job_title?: string | null
                    invited_by?: string | null
                    created_at?: string
                    claimed_at?: string | null
                    claimed_by?: string | null
                }
                Update: {
                    id?: string
                    email?: string
                    display_name?: string
                    nick_name?: string | null
                    role_id?: string | null
                    is_technician?: boolean
                    is_office_staff?: boolean
                    skills?: string[] | null
                    job_title?: string | null
                    invited_by?: string | null
                    created_at?: string
                    claimed_at?: string | null
                    claimed_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "invitations_role_id_fkey"
                        columns: ["role_id"]
                        referencedRelation: "roles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invitations_invited_by_fkey"
                        columns: ["invited_by"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invitations_claimed_by_fkey"
                        columns: ["claimed_by"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            equipment: {
                Row: {
                    id: string
                    name: string
                    type: string | null
                    status: 'available' | 'in-use' | 'maintenance'
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    type?: string | null
                    status?: 'available' | 'in-use' | 'maintenance'
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    type?: string | null
                    status?: 'available' | 'in-use' | 'maintenance'
                    created_at?: string
                }
                Relationships: []
            }
            vehicles: {
                Row: {
                    id: string
                    name: string
                    license_plate: string | null
                    type: string | null
                    status: 'available' | 'in-use' | 'maintenance'
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    license_plate?: string | null
                    type?: string | null
                    status?: 'available' | 'in-use' | 'maintenance'
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    license_plate?: string | null
                    type?: string | null
                    status?: 'available' | 'in-use' | 'maintenance'
                    created_at?: string
                }
                Relationships: []
            }
            user_profiles: {
                Row: {
                    id: string
                    display_name: string
                    avatar_url: string | null
                    phone: string | null
                    alternate_email: string | null
                    title: string | null
                    role_id: string | null
                    onboarding_completed: boolean
                    nick_name: string | null
                    user_types: string[] | null
                    is_active: boolean
                    email: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    display_name: string
                    avatar_url?: string | null
                    phone?: string | null
                    alternate_email?: string | null
                    title?: string | null
                    role_id?: string | null
                    onboarding_completed?: boolean
                    nick_name?: string | null
                    user_types?: string[] | null
                    is_active?: boolean
                    email?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    display_name?: string
                    avatar_url?: string | null
                    phone?: string | null
                    alternate_email?: string | null
                    title?: string | null
                    role_id?: string | null
                    onboarding_completed?: boolean
                    nick_name?: string | null
                    user_types?: string[] | null
                    is_active?: boolean
                    email?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_profiles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "auth.users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_profiles_role_id_fkey"
                        columns: ["role_id"]
                        referencedRelation: "roles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            roles: {
                Row: {
                    id: string
                    name: string
                    display_name: string
                    description: string | null
                    is_system: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    display_name: string
                    description?: string | null
                    is_system?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    display_name?: string
                    description?: string | null
                    is_system?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            permissions: {
                Row: {
                    id: string
                    name: string
                    resource: string
                    action: string
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    resource: string
                    action: string
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    resource?: string
                    action?: string
                    description?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            role_permissions: {
                Row: {
                    role_id: string
                    permission_id: string
                    created_at: string
                }
                Insert: {
                    role_id: string
                    permission_id: string
                    created_at?: string
                }
                Update: {
                    role_id?: string
                    permission_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "role_permissions_role_id_fkey"
                        columns: ["role_id"]
                        referencedRelation: "roles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "role_permissions_permission_id_fkey"
                        columns: ["permission_id"]
                        referencedRelation: "permissions"
                        referencedColumns: ["id"]
                    }
                ]
            }
            clients: {
                Row: {
                    id: string
                    name: string
                    address: string | null
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    address?: string | null
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    address?: string | null
                    notes?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            project_managers: {
                Row: {
                    id: string
                    client_id: string
                    name: string
                    email: string | null
                    phone: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    client_id: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    client_id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "project_managers_client_id_fkey"
                        columns: ["client_id"]
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    }
                ]
            }
            job_types: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            work_order_assignments: {
                Row: {
                    id: string
                    work_order_id: string
                    technician_id: string
                    assigned_at: string
                    notes: string | null
                }
                Insert: {
                    id?: string
                    work_order_id: string
                    technician_id: string
                    assigned_at?: string
                    notes?: string | null
                }
                Update: {
                    id?: string
                    work_order_id?: string
                    technician_id?: string
                    assigned_at?: string
                    notes?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "work_order_assignments_work_order_id_fkey"
                        columns: ["work_order_id"]
                        referencedRelation: "work_orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "work_order_assignments_technician_id_fkey"
                        columns: ["technician_id"]
                        referencedRelation: "technicians"
                        referencedColumns: ["id"]
                    }
                ]
            }
            work_order_shipments: {
                Row: {
                    id: string
                    work_order_id: string
                    tracking_id: string | null
                    contents: string | null
                    status_location: string
                    received_by_id: string | null
                    received_by_type: string | null
                    received_at: string | null
                    receipt_photos: string[] | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    work_order_id: string
                    tracking_id?: string | null
                    contents?: string | null
                    status_location?: string
                    received_by_id?: string | null
                    received_by_type?: string | null
                    received_at?: string | null
                    receipt_photos?: string[] | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    work_order_id?: string
                    tracking_id?: string | null
                    contents?: string | null
                    status_location?: string
                    received_by_id?: string | null
                    received_by_type?: string | null
                    received_at?: string | null
                    receipt_photos?: string[] | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "work_order_shipments_work_order_id_fkey"
                        columns: ["work_order_id"]
                        referencedRelation: "work_orders"
                        referencedColumns: ["id"]
                    }
                ]
            },
            checklist_templates: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            },
            checklist_template_items: {
                Row: {
                    id: string
                    template_id: string
                    content: string
                    sort_order: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    template_id: string
                    content: string
                    sort_order?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    template_id?: string
                    content?: string
                    sort_order?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "checklist_template_items_template_id_fkey"
                        columns: ["template_id"]
                        referencedRelation: "checklist_templates"
                        referencedColumns: ["id"]
                    }
                ]
            },
            work_order_tasks: {
                Row: {
                    id: string
                    work_order_id: string
                    name: string
                    description: string | null
                    status: string
                    priority: string
                    due_date: string | null
                    block_reason: string | null
                    category_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    work_order_id: string
                    name: string
                    description?: string | null
                    status?: string
                    priority?: string
                    due_date?: string | null
                    block_reason?: string | null
                    category_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    work_order_id?: string
                    name?: string
                    description?: string | null
                    status?: string
                    priority?: string
                    due_date?: string | null
                    block_reason?: string | null
                    category_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "work_order_tasks_work_order_id_fkey"
                        columns: ["work_order_id"]
                        referencedRelation: "work_orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "work_order_tasks_category_id_fkey"
                        columns: ["category_id"]
                        referencedRelation: "work_order_categories"
                        referencedColumns: ["id"]
                    }
                ]
            },
            task_assignments: {
                Row: {
                    id: string
                    task_id: string
                    technician_id: string
                    assigned_at: string
                }
                Insert: {
                    id?: string
                    task_id: string
                    technician_id: string
                    assigned_at?: string
                }
                Update: {
                    id?: string
                    task_id?: string
                    technician_id?: string
                    assigned_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "task_assignments_task_id_fkey"
                        columns: ["task_id"]
                        referencedRelation: "work_order_tasks"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "task_assignments_technician_id_fkey"
                        columns: ["technician_id"]
                        referencedRelation: "technicians"
                        referencedColumns: ["id"]
                    }
                ]
            },
            task_checklists: {
                Row: {
                    id: string
                    task_id: string
                    content: string
                    is_completed: boolean
                    completed_by_id: string | null
                    completed_at: string | null
                    sort_order: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    task_id: string
                    content: string
                    is_completed?: boolean
                    completed_by_id?: string | null
                    completed_at?: string | null
                    sort_order?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    task_id?: string
                    content?: string
                    is_completed?: boolean
                    completed_by_id?: string | null
                    completed_at?: string | null
                    sort_order?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "task_checklists_task_id_fkey"
                        columns: ["task_id"]
                        referencedRelation: "work_order_tasks"
                        referencedColumns: ["id"]
                    }
                ]
            },
            work_order_shipping_comments: {
                Row: {
                    id: string
                    work_order_id: string
                    user_id: string
                    content: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    work_order_id: string
                    user_id: string
                    content: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    work_order_id?: string
                    user_id?: string
                    content?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "work_order_shipping_comments_work_order_id_fkey"
                        columns: ["work_order_id"]
                        referencedRelation: "work_orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "work_order_shipping_comments_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "user_profiles"
                        referencedColumns: ["id"]
                    }
                ]
            },
            work_order_task_comments: {
                Row: {
                    id: string
                    task_id: string
                    user_id: string
                    content: string
                    attachments: string[]
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    task_id: string
                    user_id: string
                    content: string
                    attachments?: string[]
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    task_id?: string
                    user_id?: string
                    content?: string
                    attachments?: string[]
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "work_order_task_comments_task_id_fkey"
                        columns: ["task_id"]
                        referencedRelation: "work_order_tasks"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "work_order_task_comments_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "user_profiles"
                        referencedColumns: ["id"]
                    }
                ]
            },
            task_comment_mentions: {
                Row: {
                    id: string
                    comment_id: string
                    mentioned_user_id: string | null
                    mentioned_technician_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    comment_id: string
                    mentioned_user_id?: string | null
                    mentioned_technician_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    comment_id?: string
                    mentioned_user_id?: string | null
                    mentioned_technician_id?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "task_comment_mentions_comment_id_fkey"
                        columns: ["comment_id"]
                        referencedRelation: "work_order_task_comments"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "task_comment_mentions_mentioned_user_id_fkey"
                        columns: ["mentioned_user_id"]
                        referencedRelation: "user_profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "task_comment_mentions_mentioned_technician_id_fkey"
                        columns: ["mentioned_technician_id"]
                        referencedRelation: "technicians"
                        referencedColumns: ["id"]
                    }
                ]
            },
            work_order_categories: {
                Row: {
                    id: string
                    work_order_id: string
                    name: string
                    color: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    work_order_id: string
                    name: string
                    color?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    work_order_id?: string
                    name?: string
                    color?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "work_order_categories_work_order_id_fkey"
                        columns: ["work_order_id"]
                        referencedRelation: "work_orders"
                        referencedColumns: ["id"]
                    }
                ]
            },
            task_tags: {
                Row: {
                    id: string
                    name: string
                    color: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    color?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    color?: string
                    created_at?: string
                }
                Relationships: []
            },
            task_tag_assignments: {
                Row: {
                    id: string
                    task_id: string
                    tag_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    task_id: string
                    tag_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    task_id?: string
                    tag_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "task_tag_assignments_task_id_fkey"
                        columns: ["task_id"]
                        referencedRelation: "work_order_tasks"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "task_tag_assignments_tag_id_fkey"
                        columns: ["tag_id"]
                        referencedRelation: "task_tags"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}

