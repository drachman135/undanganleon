-- supabase/migrations/04_create_storage_policies.sql
-- Create Row Level Security policies for storage.objects on bucket 'hero-images'

-- 1. Drop existing policies to prevent duplicate exceptions
DROP POLICY IF EXISTS "Allow public read of hero images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin upload of hero images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin update of hero images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin delete of hero images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin modify/delete of hero images" ON storage.objects;

-- 2. Policies for 'hero-images' bucket
CREATE POLICY "Allow public read of hero images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'hero-images');

CREATE POLICY "Allow admin upload of hero images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'hero-images' AND is_admin());

CREATE POLICY "Allow admin update of hero images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'hero-images' AND is_admin());

CREATE POLICY "Allow admin delete of hero images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'hero-images' AND is_admin());
