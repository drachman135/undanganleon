-- supabase/migrations/06_create_music_storage.sql
-- Create storage bucket for music assets if it doesn't already exist

INSERT INTO storage.buckets (id, name, public) 
VALUES ('music', 'music', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to prevent duplicate exceptions
DROP POLICY IF EXISTS "Allow public read of music assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin upload of music assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin update of music assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin delete of music assets" ON storage.objects;

-- 3. Policies for 'music' bucket
CREATE POLICY "Allow public read of music assets"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'music');

CREATE POLICY "Allow admin upload of music assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'music' AND is_admin());

CREATE POLICY "Allow admin update of music assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'music' AND is_admin());

CREATE POLICY "Allow admin delete of music assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'music' AND is_admin());
