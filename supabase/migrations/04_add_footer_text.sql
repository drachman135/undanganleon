-- supabase/migrations/04_add_footer_text.sql
-- Migration to add footer_text column to invitation_settings

ALTER TABLE invitation_settings 
ADD COLUMN IF NOT EXISTS footer_text VARCHAR(255) NOT NULL DEFAULT '© 2026 Leon Birthday Invitation';
