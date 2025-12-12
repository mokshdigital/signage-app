-- Migration: Create user_profiles table for extended user information
-- This stores additional profile data collected during onboarding

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    alternate_email TEXT,
    title TEXT, -- Set by administrator (e.g., "Project Manager", "Lead Technician")
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding 
    ON user_profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone 
    ON user_profiles(phone);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can insert their own profile (during onboarding)
CREATE POLICY "Users can create own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile (except title - admin only)
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Service role can do anything (for admin operations)
CREATE POLICY "Service role has full access"
    ON user_profiles FOR ALL
    USING (auth.role() = 'service_role');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before each update
DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- Comment for documentation
COMMENT ON TABLE user_profiles IS 'Extended user profile information collected during onboarding';
COMMENT ON COLUMN user_profiles.title IS 'User role/title, set by administrator';
COMMENT ON COLUMN user_profiles.onboarding_completed IS 'Whether user has completed the onboarding flow';
