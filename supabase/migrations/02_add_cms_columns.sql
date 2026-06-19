-- supabase/migrations/02_add_cms_columns.sql
-- Migration to add Event Settings CMS columns to invitation_settings

ALTER TABLE invitation_settings 
ADD COLUMN IF NOT EXISTS cover_title VARCHAR(255) NOT NULL DEFAULT 'Kiriman Ulang Tahun Spesial',
ADD COLUMN IF NOT EXISTS cover_subtitle VARCHAR(255) NOT NULL DEFAULT 'Telah Tiba Untukmu',
ADD COLUMN IF NOT EXISTS hero_description TEXT NOT NULL DEFAULT 'Mari bergabung dalam petualangan ulang tahun yang spesial.',
ADD COLUMN IF NOT EXISTS theme_color VARCHAR(50) NOT NULL DEFAULT '#F97316',
ADD COLUMN IF NOT EXISTS start_time VARCHAR(50) NOT NULL DEFAULT '15:00',
ADD COLUMN IF NOT EXISTS end_time VARCHAR(50) NOT NULL DEFAULT 'Selesai';
