// Timesheet Service
// Handles all timesheet-related operations: locations, activities, days, entries, requests
import { createClient } from '@/lib/supabase/client';
import type {
    LocationChip,
    ActivityType,
    TimesheetDay,
    TimesheetEntry,
    TimesheetDayRequest,
    InvoiceStagingItem,
    WeeklySummary,
    WorkOrder,
} from '@/types/database';

// =============================================
// TYPES
// =============================================

export interface CreateEntryInput {
    timesheet_day_id: string;
    activity_type_id: string;
    location_chip_id: string;
    work_order_id?: string | null;
    hours: number;
    notes?: string;
}

export interface UpdateEntryInput {
    activity_type_id?: string;
    location_chip_id?: string;
    work_order_id?: string | null;
    hours?: number;
    notes?: string;
}

// =============================================
// SERVICE
// =============================================

export const timesheetsService = {
    // =============================================
    // LOCATION CHIPS (Admin CRUD)
    // =============================================

    async getLocationChips(includeInactive = false): Promise<LocationChip[]> {
        const supabase = createClient();
        let query = supabase
            .from('location_chips')
            .select('*')
            .order('sort_order', { ascending: true });

        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async createLocationChip(name: string, color: string): Promise<LocationChip> {
        const supabase = createClient();

        // Get max sort_order
        const { data: existing } = await supabase
            .from('location_chips')
            .select('sort_order')
            .order('sort_order', { ascending: false })
            .limit(1);

        const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

        const { data, error } = await supabase
            .from('location_chips')
            .insert({ name, color, sort_order: nextOrder })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateLocationChip(id: string, updates: Partial<Pick<LocationChip, 'name' | 'color' | 'is_active' | 'sort_order'>>): Promise<LocationChip> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('location_chips')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteLocationChip(id: string): Promise<void> {
        const supabase = createClient();
        // Soft delete - just deactivate
        const { error } = await supabase
            .from('location_chips')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
    },

    // =============================================
    // ACTIVITY TYPES (Admin CRUD)
    // =============================================

    async getActivityTypes(includeInactive = false): Promise<ActivityType[]> {
        const supabase = createClient();
        let query = supabase
            .from('activity_types')
            .select('*')
            .order('sort_order', { ascending: true });

        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async createActivityType(input: { name: string; color: string; requires_wo: boolean }): Promise<ActivityType> {
        const supabase = createClient();

        // Get max sort_order
        const { data: existing } = await supabase
            .from('activity_types')
            .select('sort_order')
            .order('sort_order', { ascending: false })
            .limit(1);

        const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

        const { data, error } = await supabase
            .from('activity_types')
            .insert({ ...input, sort_order: nextOrder })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateActivityType(id: string, updates: Partial<Pick<ActivityType, 'name' | 'color' | 'requires_wo' | 'is_active' | 'sort_order'>>): Promise<ActivityType> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('activity_types')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteActivityType(id: string): Promise<void> {
        const supabase = createClient();
        // Soft delete - just deactivate
        const { error } = await supabase
            .from('activity_types')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
    },

    // =============================================
    // TIMESHEET DAYS
    // =============================================

    async getOrCreateDay(userId: string, date: string): Promise<TimesheetDay> {
        const supabase = createClient();

        // Try to find existing day
        const { data: existing, error: findError } = await supabase
            .from('timesheet_days')
            .select('*')
            .eq('user_id', userId)
            .eq('work_date', date)
            .single();

        if (existing) return existing;

        // Create new day
        const { data, error } = await supabase
            .from('timesheet_days')
            .insert({ user_id: userId, work_date: date })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getMyDays(userId: string, startDate: string, endDate: string): Promise<TimesheetDay[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timesheet_days')
            .select(`
                *,
                entries:timesheet_entries(
                    *,
                    activity_type:activity_types(*),
                    location_chip:location_chips(*),
                    work_order:work_orders(id, work_order_number, site_address)
                )
            `)
            .eq('user_id', userId)
            .gte('work_date', startDate)
            .lte('work_date', endDate)
            .order('work_date', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getAllDays(filters?: {
        status?: string;
        startDate?: string;
        endDate?: string;
        userId?: string;
    }): Promise<TimesheetDay[]> {
        const supabase = createClient();
        let query = supabase
            .from('timesheet_days')
            .select(`
                *,
                user:user_profiles!user_id(id, display_name, avatar_url),
                approver:user_profiles!approved_by(id, display_name),
                entries:timesheet_entries(*)
            `)
            .order('work_date', { ascending: false });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.startDate) {
            query = query.gte('work_date', filters.startDate);
        }
        if (filters?.endDate) {
            query = query.lte('work_date', filters.endDate);
        }
        if (filters?.userId) {
            query = query.eq('user_id', filters.userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getDayById(dayId: string): Promise<TimesheetDay | null> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timesheet_days')
            .select(`
                *,
                user:user_profiles!user_id(id, display_name, avatar_url),
                entries:timesheet_entries(
                    *,
                    activity_type:activity_types(*),
                    location_chip:location_chips(*),
                    work_order:work_orders(id, work_order_number, site_address)
                )
            `)
            .eq('id', dayId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async submitDay(dayId: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('timesheet_days')
            .update({
                status: 'submitted',
                submitted_at: new Date().toISOString()
            })
            .eq('id', dayId)
            .in('status', ['draft', 'rejected']); // Can only submit from draft or rejected

        if (error) throw error;
    },

    async approveDay(dayId: string, approverId: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('timesheet_days')
            .update({
                status: 'approved',
                approved_by: approverId,
                approved_at: new Date().toISOString(),
                rejection_reason: null
            })
            .eq('id', dayId)
            .eq('status', 'submitted'); // Can only approve submitted

        if (error) throw error;
    },

    async rejectDay(dayId: string, approverId: string, reason: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('timesheet_days')
            .update({
                status: 'rejected',
                approved_by: approverId,
                approved_at: new Date().toISOString(),
                rejection_reason: reason
            })
            .eq('id', dayId)
            .eq('status', 'submitted');

        if (error) throw error;
    },

    async processDay(dayId: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('timesheet_days')
            .update({ status: 'processed' })
            .eq('id', dayId)
            .eq('status', 'approved'); // Can only process approved

        if (error) throw error;
    },

    // =============================================
    // TIMESHEET ENTRIES
    // =============================================

    async getEntriesForDay(dayId: string): Promise<TimesheetEntry[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timesheet_entries')
            .select(`
                *,
                activity_type:activity_types(*),
                location_chip:location_chips(*),
                work_order:work_orders(id, work_order_number, site_address)
            `)
            .eq('timesheet_day_id', dayId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async createEntry(input: CreateEntryInput): Promise<TimesheetEntry> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timesheet_entries')
            .insert({
                timesheet_day_id: input.timesheet_day_id,
                activity_type_id: input.activity_type_id,
                location_chip_id: input.location_chip_id,
                work_order_id: input.work_order_id || null,
                hours: input.hours,
                notes: input.notes || null,
            })
            .select(`
                *,
                activity_type:activity_types(*),
                location_chip:location_chips(*),
                work_order:work_orders(id, work_order_number, site_address)
            `)
            .single();

        if (error) throw error;
        return data;
    },

    async updateEntry(id: string, updates: UpdateEntryInput): Promise<TimesheetEntry> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timesheet_entries')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                activity_type:activity_types(*),
                location_chip:location_chips(*),
                work_order:work_orders(id, work_order_number, site_address)
            `)
            .single();

        if (error) throw error;
        return data;
    },

    async deleteEntry(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('timesheet_entries')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // =============================================
    // PAST-DAY REQUESTS
    // =============================================

    async createPastDayRequest(userId: string, requestedDate: string, reason: string): Promise<TimesheetDayRequest> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timesheet_day_requests')
            .insert({ user_id: userId, requested_date: requestedDate, reason })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getMyRequests(userId: string): Promise<TimesheetDayRequest[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timesheet_day_requests')
            .select(`
                *,
                reviewer:user_profiles!reviewed_by(id, display_name)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getPendingRequests(): Promise<TimesheetDayRequest[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timesheet_day_requests')
            .select(`
                *,
                user:user_profiles!user_id(id, display_name, avatar_url)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async approveRequest(id: string, reviewerId: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('timesheet_day_requests')
            .update({
                status: 'approved',
                reviewed_by: reviewerId,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('status', 'pending');

        if (error) throw error;
    },

    async denyRequest(id: string, reviewerId: string, notes: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('timesheet_day_requests')
            .update({
                status: 'denied',
                reviewed_by: reviewerId,
                reviewed_at: new Date().toISOString(),
                review_notes: notes
            })
            .eq('id', id)
            .eq('status', 'pending');

        if (error) throw error;
    },

    async hasApprovedRequest(userId: string, date: string): Promise<boolean> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('timesheet_day_requests')
            .select('id')
            .eq('user_id', userId)
            .eq('requested_date', date)
            .eq('status', 'approved')
            .limit(1);

        if (error) throw error;
        return data && data.length > 0;
    },

    // =============================================
    // WORK ORDERS (for dropdown)
    // =============================================

    async getMyAssignedWorkOrders(userId: string): Promise<Pick<WorkOrder, 'id' | 'work_order_number' | 'site_address' | 'job_status'>[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('work_order_assignments')
            .select(`
                work_order:work_orders(id, work_order_number, site_address, job_status)
            `)
            .eq('user_profile_id', userId);

        if (error) throw error;

        // Extract work orders and filter active ones
        const workOrders = (data || [])
            .map(d => d.work_order)
            .filter((wo): wo is NonNullable<typeof wo> =>
                wo !== null && wo.job_status !== 'Completed' && wo.job_status !== 'Cancelled'
            );

        return workOrders;
    },

    // =============================================
    // WEEKLY SUMMARY
    // =============================================

    async getWeeklySummary(userId: string, weekStart: string): Promise<WeeklySummary> {
        const startDate = new Date(weekStart);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        const days = await this.getMyDays(
            userId,
            weekStart,
            endDate.toISOString().split('T')[0]
        );

        const dayOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const summaryDays: WeeklySummary['days'] = [];

        let totalHours = 0;

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];

            const dayData = days.find(d => d.work_date === dateStr);
            const hours = dayData?.total_hours || 0;
            totalHours += hours;

            summaryDays.push({
                date: dateStr,
                dayOfWeek: dayOfWeekNames[currentDate.getDay()],
                hours,
                status: dayData?.status || null,
                dayId: dayData?.id || null,
            });
        }

        return {
            weekStart,
            weekEnd: endDate.toISOString().split('T')[0],
            totalHours,
            days: summaryDays,
        };
    },

    // =============================================
    // BILLING STAGING (View only for now)
    // =============================================

    async getStagingItems(workOrderId?: string): Promise<InvoiceStagingItem[]> {
        const supabase = createClient();
        let query = supabase
            .from('wo_invoice_staging')
            .select(`
                *,
                work_order:work_orders(id, work_order_number)
            `)
            .eq('source_type', 'labor')
            .order('created_at', { ascending: false });

        if (workOrderId) {
            query = query.eq('work_order_id', workOrderId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async updateStagingItem(id: string, updates: { billed_value?: number; unit_rate?: number }): Promise<InvoiceStagingItem> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('wo_invoice_staging')
            .update(updates)
            .eq('id', id)
            .eq('locked', false) // Can only update unlocked items
            .select()
            .single();

        if (error) throw error;
        return data;
    },
};
