-- supabase/migrations/09_add_gallery_cms_columns.sql
-- Migration to add Gallery Title and Subtitle columns to invitation_settings

ALTER TABLE invitation_settings 
ADD COLUMN IF NOT EXISTS gallery_title VARCHAR(255) NOT NULL DEFAULT 'Galeri Kenangan',
ADD COLUMN IF NOT EXISTS gallery_subtitle VARCHAR(255) NOT NULL DEFAULT 'Perjalanan tumbuh kembang Alfath dari waktu ke waktu.';
