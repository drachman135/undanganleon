-- supabase/migrations/10_add_layout_settings.sql
-- Migration to add layout section enabled and order columns to invitation_settings

ALTER TABLE invitation_settings 
ADD COLUMN IF NOT EXISTS hero_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS countdown_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS gallery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS location_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS rsvp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS footer_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS hero_order INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS profile_order INTEGER NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS countdown_order INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS gallery_order INTEGER NOT NULL DEFAULT 4,
ADD COLUMN IF NOT EXISTS location_order INTEGER NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS rsvp_order INTEGER NOT NULL DEFAULT 6,
ADD COLUMN IF NOT EXISTS footer_order INTEGER NOT NULL DEFAULT 7;

-- Ensure profile_enabled exists and change its default to TRUE
ALTER TABLE invitation_settings ALTER COLUMN profile_enabled SET DEFAULT TRUE;

-- Update the existing settings row to ensure all columns are initialized correctly
UPDATE invitation_settings 
SET 
    hero_enabled = COALESCE(hero_enabled, TRUE),
    profile_enabled = COALESCE(profile_enabled, TRUE),
    countdown_enabled = COALESCE(countdown_enabled, TRUE),
    gallery_enabled = COALESCE(gallery_enabled, TRUE),
    location_enabled = COALESCE(location_enabled, TRUE),
    rsvp_enabled = COALESCE(rsvp_enabled, TRUE),
    footer_enabled = COALESCE(footer_enabled, TRUE),
    hero_order = COALESCE(hero_order, 1),
    profile_order = COALESCE(profile_order, 2),
    countdown_order = COALESCE(countdown_order, 3),
    gallery_order = COALESCE(gallery_order, 4),
    location_order = COALESCE(location_order, 5),
    rsvp_order = COALESCE(rsvp_order, 6),
    footer_order = COALESCE(footer_order, 7)
WHERE id = 1;
