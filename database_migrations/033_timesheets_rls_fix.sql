-- Fix RLS permissions for triggers
-- Make trigger functions SECURITY DEFINER so they can write to audit/staging tables
-- regardless of the user's direct permissions on those tables.

BEGIN;

ALTER FUNCTION log_timesheet_status_change() SECURITY DEFINER;
ALTER FUNCTION log_timesheet_status_change() SET search_path = public;

ALTER FUNCTION copy_approved_entries_to_staging() SECURITY DEFINER;
ALTER FUNCTION copy_approved_entries_to_staging() SET search_path = public;

COMMIT;
