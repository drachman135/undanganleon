// js/models/settingsModel.js
'use strict';

/**
 * Type-safe model representing invitation settings.
 */
class InvitationSettings {
    constructor(data = {}) {
        this.id = data.id || 1;
        this.cover_title = data.cover_title || 'Kiriman Ulang Tahun Spesial';
        this.cover_subtitle = data.cover_subtitle || 'Telah Tiba Untukmu';
        this.child_name = data.child_name || 'Alfath';
        this.child_age = String(data.child_age || '2');
        this.hero_description = data.hero_description || 'Mari bergabung dalam petualangan ulang tahun yang spesial.';
        this.hero_image_url = data.hero_image_url || 'images/hero_cake.png';
        this.event_date = data.event_date || '2026-07-12';
        
        // Time fields
        this.start_time = data.start_time || '15:00';
        this.end_time = data.end_time || 'Selesai';
        this.event_time = data.event_time || `${this.start_time} WIB - ${this.end_time}`;
        
        this.location_name = data.location_name || 'Kediaman Alfath';
        this.full_address = data.full_address || 'Jl. Melati No. 24, Cilandak Barat, Jakarta Selatan';
        this.event_guide = data.event_guide || 'Acara diadakan di kediaman utama keluarga. Anda dapat memarkir kendaraan di area yang telah disediakan oleh petugas.';
        this.footer_text = data.footer_text || '© 2026 Leon Birthday Invitation';
        this.google_maps_url = data.google_maps_url || 'https://maps.google.com/?q=-6.2661555,106.7972412';
        this.whatsapp_number = data.whatsapp_number || '6281234567890';
        
        // Music fields
        this.music_enabled = data.music_enabled !== undefined ? !!data.music_enabled : true;
        this.music_volume = typeof data.music_volume === 'number' ? data.music_volume : 0.4;
        this.background_music_url = data.background_music_url || null;
        this.loading_duration = typeof data.loading_duration === 'number' ? data.loading_duration : 3000;
        
        // Profile CMS Section
        this.profile_enabled = data.profile_enabled !== undefined ? !!data.profile_enabled : true;
        this.profile_full_name = data.profile_full_name || '';
        this.profile_birth_place = data.profile_birth_place || '';
        this.profile_birth_date = data.profile_birth_date || '';
        this.profile_description = data.profile_description || '';
        this.profile_avatar_url = data.profile_avatar_url || null;

        // Gallery Header CMS Section
        this.gallery_title = data.gallery_title || 'Galeri Kenangan';
        this.gallery_subtitle = data.gallery_subtitle || 'Perjalanan tumbuh kembang Alfath dari waktu ke waktu.';

        // Theme
        this.theme_color = data.theme_color || '#F97316';

        // Layout Settings
        this.hero_enabled = data.hero_enabled !== undefined ? !!data.hero_enabled : true;
        this.countdown_enabled = data.countdown_enabled !== undefined ? !!data.countdown_enabled : true;
        this.gallery_enabled = data.gallery_enabled !== undefined ? !!data.gallery_enabled : true;
        this.location_enabled = data.location_enabled !== undefined ? !!data.location_enabled : true;
        this.rsvp_enabled = data.rsvp_enabled !== undefined ? !!data.rsvp_enabled : true;
        this.footer_enabled = data.footer_enabled !== undefined ? !!data.footer_enabled : true;

        this.hero_order = data.hero_order !== undefined ? parseInt(data.hero_order, 10) : 1;
        this.profile_order = data.profile_order !== undefined ? parseInt(data.profile_order, 10) : 2;
        this.countdown_order = data.countdown_order !== undefined ? parseInt(data.countdown_order, 10) : 3;
        this.gallery_order = data.gallery_order !== undefined ? parseInt(data.gallery_order, 10) : 4;
        this.location_order = data.location_order !== undefined ? parseInt(data.location_order, 10) : 5;
        this.rsvp_order = data.rsvp_order !== undefined ? parseInt(data.rsvp_order, 10) : 6;
        this.footer_order = data.footer_order !== undefined ? parseInt(data.footer_order, 10) : 7;
    }
}

/**
 * Validation rules and message mapping helper.
 */
const SettingsValidator = {
    validate(settings) {
        const errors = {};

        // child_name: Required, Max 100 characters
        if (!settings.child_name || settings.child_name.trim() === '') {
            errors.child_name = 'Nama anak wajib diisi';
        } else if (settings.child_name.length > 100) {
            errors.child_name = 'Nama anak maksimal 100 karakter';
        }

        // child_age: Required, Must be positive number
        if (settings.child_age === undefined || settings.child_age === null || String(settings.child_age).trim() === '') {
            errors.child_age = 'Usia anak wajib diisi';
        } else {
            const ageNum = Number(settings.child_age);
            if (isNaN(ageNum) || ageNum <= 0) {
                errors.child_age = 'Usia harus berupa angka positif';
            }
        }

        // event_date: Required
        if (!settings.event_date || settings.event_date.trim() === '') {
            errors.event_date = 'Tanggal acara wajib diisi';
        }

        // google_maps_url: Must be valid URL if provided
        if (settings.google_maps_url && settings.google_maps_url.trim() !== '') {
            try {
                new URL(settings.google_maps_url);
            } catch (_) {
                errors.google_maps_url = 'URL Google Maps tidak valid';
            }
        }

        // music_volume: Range 0.0 -> 1.0
        const vol = parseFloat(settings.music_volume);
        if (isNaN(vol) || vol < 0.0 || vol > 1.0) {
            errors.music_volume = 'Volume musik harus bernilai antara 0.0 hingga 1.0';
        }

        // whatsapp_number: Only numeric characters
        if (!settings.whatsapp_number || String(settings.whatsapp_number).trim() === '') {
            errors.whatsapp_number = 'Nomor WhatsApp wajib diisi';
        } else if (!/^\d+$/.test(String(settings.whatsapp_number).trim())) {
            errors.whatsapp_number = 'Nomor WhatsApp hanya boleh berisi angka';
        }

        // event_guide: Required, Max 500 characters
        if (!settings.event_guide || settings.event_guide.trim() === '') {
            errors.event_guide = 'Petunjuk acara wajib diisi';
        } else if (settings.event_guide.length > 500) {
            errors.event_guide = 'Petunjuk acara maksimal 500 karakter';
        }

        // footer_text: Required, Max 200 characters
        if (!settings.footer_text || settings.footer_text.trim() === '') {
            errors.footer_text = 'Teks kaki (footer) wajib diisi';
        } else if (settings.footer_text.length > 200) {
            errors.footer_text = 'Teks kaki (footer) maksimal 200 karakter';
        }

        // gallery_title: Required, Max 200 characters
        if (!settings.gallery_title || settings.gallery_title.trim() === '') {
            errors.gallery_title = 'Judul galeri wajib diisi';
        } else if (settings.gallery_title.length > 200) {
            errors.gallery_title = 'Judul galeri maksimal 200 karakter';
        }

        // gallery_subtitle: Required, Max 300 characters
        if (!settings.gallery_subtitle || settings.gallery_subtitle.trim() === '') {
            errors.gallery_subtitle = 'Subjudul galeri wajib diisi';
        } else if (settings.gallery_subtitle.length > 300) {
            errors.gallery_subtitle = 'Subjudul galeri maksimal 300 karakter';
        }

        // profile_full_name: Required if profile_enabled is true
        if (settings.profile_enabled) {
            if (!settings.profile_full_name || settings.profile_full_name.trim() === '') {
                errors.profile_full_name = 'Nama lengkap profil wajib diisi';
            }
        }

        // Validate layout orders (must be integers)
        const orderFields = ['hero_order', 'profile_order', 'countdown_order', 'gallery_order', 'location_order', 'rsvp_order', 'footer_order'];
        orderFields.forEach(field => {
            if (settings[field] !== undefined) {
                const val = Number(settings[field]);
                if (isNaN(val)) {
                    errors[field] = 'Urutan harus berupa angka';
                }
            }
        });

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

// Export to window object for browser access
window.InvitationSettings = InvitationSettings;
window.SettingsValidator = SettingsValidator;
