-- Migration 027: Drop office_staff table
-- Move title to user_profiles and drop the redundant table

-- Update user_profiles title from office_staff
DO $$
BEGIN
    IF to_regclass('office_staff') IS NOT NULL THEN
        UPDATE user_profiles up
        SET title = os.title
        FROM office_staff os
        WHERE up.id = os.user_profile_id
        AND os.title IS NOT NULL;
    END IF;
END $$;

-- Drop office_staff table
DROP TABLE IF EXISTS office_staff;
