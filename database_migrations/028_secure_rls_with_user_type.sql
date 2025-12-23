-- Migration 028: Secure RLS with User Type

-- Helper function to check if user is internal efficiently
CREATE OR REPLACE FUNCTION public.is_internal()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = auth.uid()
    AND user_type = 'internal'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Work Orders
-- Allow internal users to see all work orders
DROP POLICY IF EXISTS "Internal users can view all work orders" ON work_orders;
CREATE POLICY "Internal users can view all work orders" ON work_orders
FOR SELECT TO authenticated
USING (is_internal());

-- Ensure internal users can update/insert too?
DROP POLICY IF EXISTS "Internal users can manage all work orders" ON work_orders;
CREATE POLICY "Internal users can manage all work orders" ON work_orders
FOR ALL TO authenticated
USING (is_internal());

-- Clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Remove open policies
DROP POLICY IF EXISTS "Allow all reads on clients" ON clients;
DROP POLICY IF EXISTS "Allow all inserts on clients" ON clients;
DROP POLICY IF EXISTS "Allow all updates on clients" ON clients;
DROP POLICY IF EXISTS "Allow all deletes on clients" ON clients;

-- Add restricted policies
DROP POLICY IF EXISTS "Internal users can manage clients" ON clients;
CREATE POLICY "Internal users can manage clients" ON clients
FOR ALL TO authenticated
USING (is_internal());

-- User Profiles
-- Ensure internal users can view all profiles (staff directory)
DROP POLICY IF EXISTS "Internal users can view all profiles" ON user_profiles;
CREATE POLICY "Internal users can view all profiles" ON user_profiles
FOR SELECT TO authenticated
USING (is_internal());
