-- supabase/migrations/05_create_gallery_storage.sql
-- Create storage bucket for gallery images if it doesn't already exist

INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to prevent duplicate exceptions
DROP POLICY IF EXISTS "Allow public read of gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin upload of gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin update of gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin delete of gallery images" ON storage.objects;

-- 2. Policies for 'gallery-images' bucket
CREATE POLICY "Allow public read of gallery images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'gallery-images');

CREATE POLICY "Allow admin upload of gallery images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gallery-images' AND is_admin());

CREATE POLICY "Allow admin update of gallery images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'gallery-images' AND is_admin());

CREATE POLICY "Allow admin delete of gallery images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'gallery-images' AND is_admin());
