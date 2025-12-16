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
                    created_at: string
                }
                Insert: {
                    id?: string
                    uploaded_by?: string | null
                    processed?: boolean
                    analysis?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    uploaded_by?: string | null
                    processed?: boolean
                    analysis?: Json | null
                    created_at?: string
                }
                Relationships: []
            }
            work_order_files: {
                Row: {
                    id: string
                    work_order_id: string
                    file_url: string
                    file_name: string | null
                    file_size: number | null
                    mime_type: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    work_order_id: string
                    file_url: string
                    file_name?: string | null
                    file_size?: number | null
                    mime_type?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    work_order_id?: string
                    file_url?: string
                    file_name?: string | null
                    file_size?: number | null
                    mime_type?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "work_order_files_work_order_id_fkey"
                        columns: ["work_order_id"]
                        referencedRelation: "work_orders"
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
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    title?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    title?: string | null
                    created_at?: string
                }
                Relationships: []
            },
            technicians: {
                Row: {
                    id: string
                    name: string
                    email: string | null
                    phone: string | null
                    skills: string[] | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    skills?: string[] | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    skills?: string[] | null
                    created_at?: string
                }
                Relationships: []
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

