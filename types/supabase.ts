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
