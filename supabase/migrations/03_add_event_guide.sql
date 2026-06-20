-- supabase/migrations/03_add_event_guide.sql
-- Migration to add Event Guide column to invitation_settings

ALTER TABLE invitation_settings 
ADD COLUMN IF NOT EXISTS event_guide TEXT NOT NULL DEFAULT 'Acara diadakan di kediaman utama keluarga. Anda dapat memarkir kendaraan di area yang telah disediakan oleh petugas.';
