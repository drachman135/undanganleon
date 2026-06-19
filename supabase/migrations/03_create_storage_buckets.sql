-- supabase/migrations/03_create_storage_buckets.sql
-- Create storage bucket for hero images if it doesn't already exist

INSERT INTO storage.buckets (id, name, public) 
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;
