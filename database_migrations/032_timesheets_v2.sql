-- Migration: 032_timesheets_v2.sql
-- Description: Timesheet system with locations, activity types, entries, and billing staging
-- Date: 2024-12-29

-- =============================================
-- LOCATION CHIPS TABLE
-- Admin-managed locations with soft delete
-- =============================================

CREATE TABLE IF NOT EXISTS location_chips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#f59e0b', -- Tops Amber default
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_location_chips_name ON location_chips(name) WHERE is_active = true;

-- =============================================
-- ACTIVITY TYPES TABLE
-- Admin-managed with WO requirement flag
-- =============================================

CREATE TABLE IF NOT EXISTS activity_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6', -- Blue default
    requires_wo BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_types_name ON activity_types(name) WHERE is_active = true;

-- =============================================
-- TIMESHEET DAYS TABLE (Header)
-- One row per user per date
-- =============================================

CREATE TABLE IF NOT EXISTS timesheet_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'processed')),
    total_hours DECIMAL(5,2) DEFAULT 0,
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_timesheet_days_user_id ON timesheet_days(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_days_work_date ON timesheet_days(work_date);
CREATE INDEX IF NOT EXISTS idx_timesheet_days_status ON timesheet_days(status);

-- =============================================
-- TIMESHEET ENTRIES TABLE (Detail)
-- Individual time entries
-- =============================================

CREATE TABLE IF NOT EXISTS timesheet_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timesheet_day_id UUID NOT NULL REFERENCES timesheet_days(id) ON DELETE CASCADE,
    activity_type_id UUID NOT NULL REFERENCES activity_types(id) ON DELETE RESTRICT,
    location_chip_id UUID NOT NULL REFERENCES location_chips(id) ON DELETE RESTRICT,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL, -- NULL = "General"
    hours DECIMAL(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    start_time TIME, -- stored but not required in UI
    end_time TIME,   -- stored but not required in UI
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure 0.25 hour increments
    CONSTRAINT hours_quarter_increments CHECK (MOD(hours * 100, 25) = 0)
);

CREATE INDEX IF NOT EXISTS idx_timesheet_entries_day_id ON timesheet_entries(timesheet_day_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_work_order_id ON timesheet_entries(work_order_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_activity_type_id ON timesheet_entries(activity_type_id);

-- =============================================
-- TIMESHEET STATUS HISTORY (Audit Trail)
-- =============================================

CREATE TABLE IF NOT EXISTS timesheet_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timesheet_day_id UUID NOT NULL REFERENCES timesheet_days(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timesheet_status_history_day_id ON timesheet_status_history(timesheet_day_id);

-- =============================================
-- TIMESHEET DAY REQUESTS (Past-Day Editing)
-- =============================================

CREATE TABLE IF NOT EXISTS timesheet_day_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    requested_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reviewed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timesheet_day_requests_user_id ON timesheet_day_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_day_requests_status ON timesheet_day_requests(status);

-- =============================================
-- WO INVOICE STAGING TABLE
-- Generalized billable items (UI deferred)
-- =============================================

CREATE TABLE IF NOT EXISTS wo_invoice_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('labor', 'material', 'equipment', 'expense')),
    source_id UUID NOT NULL, -- timesheet_entry.id, etc.
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'hours',
    actual_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    billed_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_rate DECIMAL(10,2) DEFAULT 0, -- editable
    is_billable BOOLEAN DEFAULT true,
    locked BOOLEAN DEFAULT false, -- when invoiced
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wo_invoice_staging_work_order_id ON wo_invoice_staging(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_invoice_staging_source_type ON wo_invoice_staging(source_type);
CREATE INDEX IF NOT EXISTS idx_wo_invoice_staging_source_id ON wo_invoice_staging(source_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- 1. Update total_hours when entries change
CREATE OR REPLACE FUNCTION update_timesheet_day_total_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE timesheet_days 
        SET total_hours = COALESCE((
            SELECT SUM(hours) FROM timesheet_entries WHERE timesheet_day_id = OLD.timesheet_day_id
        ), 0),
        updated_at = NOW()
        WHERE id = OLD.timesheet_day_id;
        RETURN OLD;
    ELSE
        UPDATE timesheet_days 
        SET total_hours = COALESCE((
            SELECT SUM(hours) FROM timesheet_entries WHERE timesheet_day_id = NEW.timesheet_day_id
        ), 0),
        updated_at = NOW()
        WHERE id = NEW.timesheet_day_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_timesheet_day_total_hours ON timesheet_entries;
CREATE TRIGGER trigger_update_timesheet_day_total_hours
    AFTER INSERT OR UPDATE OR DELETE ON timesheet_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_timesheet_day_total_hours();

-- 2. Prevent changes to processed timesheets (hard-lock)
CREATE OR REPLACE FUNCTION prevent_processed_timesheet_changes()
RETURNS TRIGGER AS $$
DECLARE
    day_status TEXT;
BEGIN
    -- Get the status of the parent timesheet day
    IF TG_OP = 'DELETE' THEN
        SELECT status INTO day_status FROM timesheet_days WHERE id = OLD.timesheet_day_id;
    ELSE
        SELECT status INTO day_status FROM timesheet_days WHERE id = NEW.timesheet_day_id;
    END IF;
    
    IF day_status = 'processed' THEN
        RAISE EXCEPTION 'Cannot modify entries for processed timesheets';
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_processed_timesheet_changes ON timesheet_entries;
CREATE TRIGGER trigger_prevent_processed_timesheet_changes
    BEFORE INSERT OR UPDATE OR DELETE ON timesheet_entries
    FOR EACH ROW
    EXECUTE FUNCTION prevent_processed_timesheet_changes();

-- 3. Copy WO-linked entries to staging on approval (skip General entries)
CREATE OR REPLACE FUNCTION copy_approved_entries_to_staging()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when status changes TO 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO wo_invoice_staging (
            work_order_id,
            source_type,
            source_id,
            description,
            quantity,
            unit,
            actual_value,
            billed_value,
            unit_rate
        )
        SELECT 
            te.work_order_id,
            'labor',
            te.id,
            CONCAT(at.name, ' - ', lc.name),
            te.hours,
            'hours',
            te.hours,
            te.hours, -- billed_value starts same as actual
            0 -- unit_rate to be set by billing
        FROM timesheet_entries te
        JOIN activity_types at ON te.activity_type_id = at.id
        JOIN location_chips lc ON te.location_chip_id = lc.id
        WHERE te.timesheet_day_id = NEW.id
          AND te.work_order_id IS NOT NULL  -- Skip "General" entries
          AND NOT EXISTS (
              SELECT 1 FROM wo_invoice_staging 
              WHERE source_id = te.id AND source_type = 'labor'
          );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_copy_approved_entries_to_staging ON timesheet_days;
CREATE TRIGGER trigger_copy_approved_entries_to_staging
    AFTER UPDATE ON timesheet_days
    FOR EACH ROW
    EXECUTE FUNCTION copy_approved_entries_to_staging();

-- 4. Log status changes
CREATE OR REPLACE FUNCTION log_timesheet_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO timesheet_status_history (
            timesheet_day_id,
            from_status,
            to_status,
            changed_by,
            notes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.approved_by, NEW.user_id),
            CASE 
                WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
                ELSE NULL
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_timesheet_status_change ON timesheet_days;
CREATE TRIGGER trigger_log_timesheet_status_change
    AFTER UPDATE ON timesheet_days
    FOR EACH ROW
    EXECUTE FUNCTION log_timesheet_status_change();

-- 5. Updated_at triggers
CREATE OR REPLACE FUNCTION update_timesheet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_location_chips_updated_at ON location_chips;
CREATE TRIGGER trigger_location_chips_updated_at
    BEFORE UPDATE ON location_chips
    FOR EACH ROW EXECUTE FUNCTION update_timesheet_updated_at();

DROP TRIGGER IF EXISTS trigger_activity_types_updated_at ON activity_types;
CREATE TRIGGER trigger_activity_types_updated_at
    BEFORE UPDATE ON activity_types
    FOR EACH ROW EXECUTE FUNCTION update_timesheet_updated_at();

DROP TRIGGER IF EXISTS trigger_timesheet_day_requests_updated_at ON timesheet_day_requests;
CREATE TRIGGER trigger_timesheet_day_requests_updated_at
    BEFORE UPDATE ON timesheet_day_requests
    FOR EACH ROW EXECUTE FUNCTION update_timesheet_updated_at();

DROP TRIGGER IF EXISTS trigger_wo_invoice_staging_updated_at ON wo_invoice_staging;
CREATE TRIGGER trigger_wo_invoice_staging_updated_at
    BEFORE UPDATE ON wo_invoice_staging
    FOR EACH ROW EXECUTE FUNCTION update_timesheet_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Location Chips (read: all authenticated, write: settings:manage_locations)
ALTER TABLE location_chips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "location_chips_select" ON location_chips;
CREATE POLICY "location_chips_select" ON location_chips
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "location_chips_insert" ON location_chips;
CREATE POLICY "location_chips_insert" ON location_chips
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "location_chips_update" ON location_chips;
CREATE POLICY "location_chips_update" ON location_chips
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "location_chips_delete" ON location_chips;
CREATE POLICY "location_chips_delete" ON location_chips
FOR DELETE TO authenticated USING (true);

-- Activity Types (same as location chips)
ALTER TABLE activity_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_types_select" ON activity_types;
CREATE POLICY "activity_types_select" ON activity_types
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "activity_types_insert" ON activity_types;
CREATE POLICY "activity_types_insert" ON activity_types
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "activity_types_update" ON activity_types;
CREATE POLICY "activity_types_update" ON activity_types
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "activity_types_delete" ON activity_types;
CREATE POLICY "activity_types_delete" ON activity_types
FOR DELETE TO authenticated USING (true);

-- Timesheet Days (users see own, admins see all)
ALTER TABLE timesheet_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timesheet_days_select" ON timesheet_days;
CREATE POLICY "timesheet_days_select" ON timesheet_days
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_internal());

DROP POLICY IF EXISTS "timesheet_days_insert" ON timesheet_days;
CREATE POLICY "timesheet_days_insert" ON timesheet_days
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR is_internal());

DROP POLICY IF EXISTS "timesheet_days_update" ON timesheet_days;
CREATE POLICY "timesheet_days_update" ON timesheet_days
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR is_internal())
WITH CHECK (user_id = auth.uid() OR is_internal());

-- Timesheet Entries (via parent day)
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timesheet_entries_select" ON timesheet_entries;
CREATE POLICY "timesheet_entries_select" ON timesheet_entries
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM timesheet_days td 
        WHERE td.id = timesheet_entries.timesheet_day_id
        AND (td.user_id = auth.uid() OR is_internal())
    )
);

DROP POLICY IF EXISTS "timesheet_entries_insert" ON timesheet_entries;
CREATE POLICY "timesheet_entries_insert" ON timesheet_entries
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM timesheet_days td 
        WHERE td.id = timesheet_entries.timesheet_day_id
        AND (td.user_id = auth.uid() OR is_internal())
        AND td.status IN ('draft', 'rejected')
    )
);

DROP POLICY IF EXISTS "timesheet_entries_update" ON timesheet_entries;
CREATE POLICY "timesheet_entries_update" ON timesheet_entries
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM timesheet_days td 
        WHERE td.id = timesheet_entries.timesheet_day_id
        AND (td.user_id = auth.uid() OR is_internal())
        AND td.status IN ('draft', 'rejected')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM timesheet_days td 
        WHERE td.id = timesheet_entries.timesheet_day_id
        AND (td.user_id = auth.uid() OR is_internal())
        AND td.status IN ('draft', 'rejected')
    )
);

DROP POLICY IF EXISTS "timesheet_entries_delete" ON timesheet_entries;
CREATE POLICY "timesheet_entries_delete" ON timesheet_entries
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM timesheet_days td 
        WHERE td.id = timesheet_entries.timesheet_day_id
        AND (td.user_id = auth.uid() OR is_internal())
        AND td.status IN ('draft', 'rejected')
    )
);

-- Timesheet Status History (read only via parent day)
ALTER TABLE timesheet_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timesheet_status_history_select" ON timesheet_status_history;
CREATE POLICY "timesheet_status_history_select" ON timesheet_status_history
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM timesheet_days td 
        WHERE td.id = timesheet_status_history.timesheet_day_id
        AND (td.user_id = auth.uid() OR is_internal())
    )
);

-- Day Requests (users see own, admins see all pending)
ALTER TABLE timesheet_day_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timesheet_day_requests_select" ON timesheet_day_requests;
CREATE POLICY "timesheet_day_requests_select" ON timesheet_day_requests
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_internal());

DROP POLICY IF EXISTS "timesheet_day_requests_insert" ON timesheet_day_requests;
CREATE POLICY "timesheet_day_requests_insert" ON timesheet_day_requests
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "timesheet_day_requests_update" ON timesheet_day_requests;
CREATE POLICY "timesheet_day_requests_update" ON timesheet_day_requests
FOR UPDATE TO authenticated
USING (is_internal());

-- WO Invoice Staging (internal users only)
ALTER TABLE wo_invoice_staging ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wo_invoice_staging_select" ON wo_invoice_staging;
CREATE POLICY "wo_invoice_staging_select" ON wo_invoice_staging
FOR SELECT TO authenticated USING (is_internal());

DROP POLICY IF EXISTS "wo_invoice_staging_update" ON wo_invoice_staging;
CREATE POLICY "wo_invoice_staging_update" ON wo_invoice_staging
FOR UPDATE TO authenticated
USING (is_internal() AND locked = false)
WITH CHECK (is_internal());

-- =============================================
-- RBAC PERMISSIONS (15 total)
-- =============================================

-- Timesheet permissions
INSERT INTO permissions (name, description, resource, action) VALUES
    ('timesheets:view_own', 'View own timesheet entries', 'timesheets', 'view_own'),
    ('timesheets:log_own', 'Create and edit own time entries (today only)', 'timesheets', 'log_own'),
    ('timesheets:submit_own', 'Submit own daily timesheets for approval', 'timesheets', 'submit_own'),
    ('timesheets:request_past_day', 'Request permission to edit past days', 'timesheets', 'request_past_day'),
    ('timesheets:view_all', 'View all users'' timesheets', 'timesheets', 'view_all'),
    ('timesheets:approve', 'Approve or reject submitted timesheets', 'timesheets', 'approve'),
    ('timesheets:approve_past_requests', 'Approve past-day edit requests', 'timesheets', 'approve_past_requests'),
    ('timesheets:process', 'Mark timesheets as processed for payroll', 'timesheets', 'process'),
    ('timesheets:edit_any', 'Edit any user''s timesheet entries', 'timesheets', 'edit_any'),
    ('timesheets:delete_any', 'Delete any timesheet entry', 'timesheets', 'delete_any')
ON CONFLICT (name) DO NOTHING;

-- Settings permissions (if not exists)
INSERT INTO permissions (name, description, resource, action) VALUES
    ('settings:manage_locations', 'Create, edit, and deactivate location chips', 'settings', 'manage_locations'),
    ('settings:manage_activity_types', 'Create, edit, and deactivate activity types', 'settings', 'manage_activity_types')
ON CONFLICT (name) DO NOTHING;

-- Billing permissions
INSERT INTO permissions (name, description, resource, action) VALUES
    ('billing:view_staging', 'View billing staging table', 'billing', 'view_staging'),
    ('billing:edit_staging', 'Edit billed values and unit rates', 'billing', 'edit_staging'),
    ('billing:lock_staging', 'Lock staging items for invoicing', 'billing', 'lock_staging')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- GRANT PERMISSIONS TO ROLES
-- =============================================

-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND p.name IN (
    'timesheets:view_own', 'timesheets:log_own', 'timesheets:submit_own',
    'timesheets:request_past_day', 'timesheets:view_all', 'timesheets:approve',
    'timesheets:approve_past_requests', 'timesheets:process', 'timesheets:edit_any',
    'timesheets:delete_any', 'settings:manage_locations', 'settings:manage_activity_types',
    'billing:view_staging', 'billing:edit_staging', 'billing:lock_staging'
  )
ON CONFLICT DO NOTHING;

-- Admin gets most permissions (except process and lock)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN (
    'timesheets:view_own', 'timesheets:log_own', 'timesheets:submit_own',
    'timesheets:request_past_day', 'timesheets:view_all', 'timesheets:approve',
    'timesheets:approve_past_requests', 'timesheets:edit_any',
    'settings:manage_locations', 'settings:manage_activity_types',
    'billing:view_staging', 'billing:edit_staging'
  )
ON CONFLICT DO NOTHING;

-- Technician role gets basic permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'technician'
  AND p.name IN (
    'timesheets:view_own', 'timesheets:log_own', 'timesheets:submit_own',
    'timesheets:request_past_day'
  )
ON CONFLICT DO NOTHING;

-- =============================================
-- END OF MIGRATION
-- =============================================
