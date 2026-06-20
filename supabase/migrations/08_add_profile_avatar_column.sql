-- supabase/migrations/08_add_profile_avatar_column.sql
-- Migration to add Profile Avatar URL column to invitation_settings

ALTER TABLE invitation_settings 
ADD COLUMN IF NOT EXISTS profile_avatar_url TEXT;
