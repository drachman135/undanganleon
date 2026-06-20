-- supabase/migrations/schema.sql
-- Relational Database Schema & Security Policies

-- Enable uuid-ossp extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Helper function for handling automatic update timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABLE: invitation_settings
CREATE TABLE IF NOT EXISTS invitation_settings (
    id SERIAL PRIMARY KEY,
    cover_title VARCHAR(255) NOT NULL DEFAULT 'Kiriman Ulang Tahun Spesial',
    cover_subtitle VARCHAR(255) NOT NULL DEFAULT 'Telah Tiba Untukmu',
    child_name VARCHAR(100) NOT NULL DEFAULT 'Alfath',
    child_age VARCHAR(50) NOT NULL DEFAULT 'DUA',
    hero_description TEXT NOT NULL DEFAULT 'Mari bergabung dalam petualangan ulang tahun yang spesial.',
    hero_image_url TEXT,
    event_date DATE NOT NULL DEFAULT '2026-07-12',
    event_time VARCHAR(100) NOT NULL DEFAULT '15:00 WIB - Selesai',
    location_name VARCHAR(255) NOT NULL DEFAULT 'Kediaman Alfath',
    full_address TEXT NOT NULL DEFAULT 'Jl. Melati No. 24, Cilandak Barat, Jakarta Selatan',
    google_maps_url TEXT NOT NULL DEFAULT 'https://maps.google.com/?q=-6.2661555,106.7972412',
    whatsapp_number VARCHAR(50) NOT NULL DEFAULT '6281234567890',
    music_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    music_volume FLOAT NOT NULL DEFAULT 0.4,
    background_music_url TEXT,
    loading_duration INTEGER NOT NULL DEFAULT 3000,
    theme_color VARCHAR(50) NOT NULL DEFAULT '#F97316',
    start_time VARCHAR(50) NOT NULL DEFAULT '15:00',
    end_time VARCHAR(50) NOT NULL DEFAULT 'Selesai',
    event_guide TEXT NOT NULL DEFAULT 'Acara diadakan di kediaman utama keluarga. Anda dapat memarkir kendaraan di area yang telah disediakan oleh petugas.',
    footer_text VARCHAR(255) NOT NULL DEFAULT '© 2026 Leon Birthday Invitation',
    gallery_title VARCHAR(255) NOT NULL DEFAULT 'Galeri Kenangan',
    gallery_subtitle VARCHAR(255) NOT NULL DEFAULT 'Perjalanan tumbuh kembang Alfath dari waktu ke waktu.',
    profile_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    profile_full_name VARCHAR(255) DEFAULT '',
    profile_birth_place VARCHAR(255) DEFAULT '',
    profile_birth_date DATE,
    profile_description TEXT DEFAULT '',
    profile_avatar_url TEXT,
    hero_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    countdown_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    gallery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    location_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    rsvp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    footer_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    hero_order INTEGER NOT NULL DEFAULT 1,
    profile_order INTEGER NOT NULL DEFAULT 2,
    countdown_order INTEGER NOT NULL DEFAULT 3,
    gallery_order INTEGER NOT NULL DEFAULT 4,
    location_order INTEGER NOT NULL DEFAULT 5,
    rsvp_order INTEGER NOT NULL DEFAULT 6,
    footer_order INTEGER NOT NULL DEFAULT 7,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on invitation_settings
ALTER TABLE invitation_settings ENABLE ROW LEVEL SECURITY;

-- Triggers for invitation_settings
CREATE TRIGGER set_timestamp_invitation_settings
BEFORE UPDATE ON invitation_settings
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- 3. TABLE: gallery_images
CREATE TABLE IF NOT EXISTS gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    image_title VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on gallery_images
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- 4. TABLE: guests
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_name VARCHAR(255) NOT NULL,
    guest_slug VARCHAR(255) UNIQUE NOT NULL,
    invitation_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on guests
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Index on guest_slug for lookup query optimization
CREATE INDEX IF NOT EXISTS idx_guests_slug ON guests(guest_slug);

-- 5. TABLE: rsvp_submissions
CREATE TABLE IF NOT EXISTS rsvp_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_name VARCHAR(255) NOT NULL,
    attendance_status VARCHAR(50) NOT NULL DEFAULT 'hadir',
    guest_count INT NOT NULL DEFAULT 1,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on rsvp_submissions
ALTER TABLE rsvp_submissions ENABLE ROW LEVEL SECURITY;

-- 6. TABLE: admin_profiles
CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on admin_profiles
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════
--  SECURITY POLICIES (ROW LEVEL SECURITY - RLS)
-- ══════════════════════════════════════════════════

-- Policy helpers
-- Check if requesting user is an authenticated admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RLS Policies: invitation_settings
CREATE POLICY "Allow public read access to invitation_settings"
ON invitation_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow admin write access to invitation_settings"
ON invitation_settings FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());


-- RLS Policies: gallery_images
CREATE POLICY "Allow public read access to gallery_images"
ON gallery_images FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow admin write access to gallery_images"
ON gallery_images FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());


-- RLS Policies: guests
CREATE POLICY "Allow public read access to guests lookup"
ON guests FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow admin write access to guests"
ON guests FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());


-- RLS Policies: rsvp_submissions
CREATE POLICY "Allow public inserts to rsvp_submissions"
ON rsvp_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow admin write/read access to rsvp_submissions"
ON rsvp_submissions FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());


-- RLS Policies: admin_profiles
CREATE POLICY "Allow admin access to profiles"
ON admin_profiles FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());


-- ══════════════════════════════════════════════════
--  STORAGE BUCKET SECURITY RULES
-- ══════════════════════════════════════════════════
-- Storage rules are managed via Supabase storage.objects policies:

-- To be executed inside Supabase dashboard or SQL editor for bucket configurations:
/*
-- 1. Policies for 'hero-images' bucket
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
*/

-- 7. Insert initial seed settings row
INSERT INTO invitation_settings (
    id, 
    cover_title,
    cover_subtitle,
    child_name, 
    child_age, 
    hero_description,
    hero_image_url, 
    event_date, 
    event_time, 
    location_name, 
    full_address, 
    google_maps_url, 
    whatsapp_number, 
    music_enabled, 
    music_volume, 
    background_music_url, 
    loading_duration,
    theme_color,
    start_time,
    end_time,
    event_guide,
    footer_text,
    gallery_title,
    gallery_subtitle,
    profile_enabled,
    profile_full_name,
    profile_birth_place,
    profile_birth_date,
    profile_description,
    profile_avatar_url,
    hero_enabled,
    countdown_enabled,
    gallery_enabled,
    location_enabled,
    rsvp_enabled,
    footer_enabled,
    hero_order,
    profile_order,
    countdown_order,
    gallery_order,
    location_order,
    rsvp_order,
    footer_order
)
VALUES (
    1, 
    'Kiriman Ulang Tahun Spesial',
    'Telah Tiba Untukmu',
    'ALFATH', 
    'DUA', 
    'Mari bergabung dalam petualangan ulang tahun yang spesial.',
    'images/hero_cake.png', 
    '2026-07-12', 
    '15:00 WIB - Selesai', 
    'Kediaman Alfath', 
    'Jl. Melati No. 24, Cilandak Barat, Jakarta Selatan', 
    'https://maps.google.com/?q=-6.2661555,106.7972412', 
    '6281234567890', 
    TRUE, 
    0.4, 
    NULL, 
    3000,
    '#F97316',
    '15:00',
    'Selesai',
    'Acara diadakan di kediaman utama keluarga. Anda dapat memarkir kendaraan di area yang telah disediakan oleh petugas.',
    '© 2026 Leon Birthday Invitation',
    'Galeri Kenangan',
    'Perjalanan tumbuh kembang Alfath dari waktu ke waktu.',
    TRUE,
    'Muhammad Alfath',
    'Jakarta',
    '2024-07-12',
    'Alfath adalah anak laki-laki aktif yang menyukai kendaraan besar seperti truk dan mobil pemadam kebakaran.',
    NULL,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    1,
    2,
    3,
    4,
    5,
    6,
    7
) ON CONFLICT (id) DO NOTHING;
