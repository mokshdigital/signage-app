-- Revert: Block editing once status is 'submitted'
-- Only 'draft' and 'rejected' allow editing.

BEGIN;

-- Drop existing policies (which allowed 'submitted')
DROP POLICY IF EXISTS "timesheet_entries_insert" ON timesheet_entries;
DROP POLICY IF EXISTS "timesheet_entries_update" ON timesheet_entries;
DROP POLICY IF EXISTS "timesheet_entries_delete" ON timesheet_entries;

-- Recreate with 'submitted' EXCLUDED (only draft/rejected)
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

COMMIT;
