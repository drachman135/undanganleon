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
        this.google_maps_url = data.google_maps_url || 'https://maps.google.com/?q=-6.2661555,106.7972412';
        this.whatsapp_number = data.whatsapp_number || '6281234567890';
        
        // Music fields
        this.music_enabled = data.music_enabled !== undefined ? !!data.music_enabled : true;
        this.music_volume = typeof data.music_volume === 'number' ? data.music_volume : 0.4;
        this.background_music_url = data.background_music_url || null;
        this.loading_duration = typeof data.loading_duration === 'number' ? data.loading_duration : 3000;
        
        // Theme
        this.theme_color = data.theme_color || '#F97316';
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

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

// Export to window object for browser access
window.InvitationSettings = InvitationSettings;
window.SettingsValidator = SettingsValidator;
