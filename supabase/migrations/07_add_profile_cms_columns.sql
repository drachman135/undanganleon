-- supabase/migrations/07_add_profile_cms_columns.sql
-- Migration to add Profile Section CMS columns to invitation_settings

ALTER TABLE invitation_settings 
ADD COLUMN IF NOT EXISTS profile_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_full_name VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS profile_birth_place VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS profile_birth_date DATE,
ADD COLUMN IF NOT EXISTS profile_description TEXT DEFAULT '';
