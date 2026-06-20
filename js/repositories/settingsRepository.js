// js/repositories/settingsRepository.js
'use strict';

/**
 * Data Repository for invitation settings table in Supabase.
 */
const SettingsRepository = {
    /**
     * Get settings record (row id = 1) from Supabase.
     * @returns {Promise<InvitationSettings|null>}
     */
    async getSettings() {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) throw new Error('Supabase client is not initialized');

        const { data, error } = await supabase
            .from('invitation_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('SettingsRepository.getSettings failed:', error);
            throw error;
        }

        return data ? new InvitationSettings(data) : null;
    },

    /**
     * Update settings record (row id = 1) in Supabase.
     * @param {InvitationSettings} settings 
     * @returns {Promise<InvitationSettings>}
     */
    async updateSettings(settings) {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) throw new Error('Supabase client is not initialized');

        // Prepare raw payload mapping back to DB schema
        const payload = {
            cover_title: settings.cover_title,
            cover_subtitle: settings.cover_subtitle,
            child_name: settings.child_name,
            child_age: settings.child_age,
            hero_description: settings.hero_description,
            hero_image_url: settings.hero_image_url,
            event_date: settings.event_date,
            event_time: `${settings.start_time} WIB - ${settings.end_time}`,
            location_name: settings.location_name,
            full_address: settings.full_address,
            event_guide: settings.event_guide,
            footer_text: settings.footer_text,
            google_maps_url: settings.google_maps_url,
            whatsapp_number: settings.whatsapp_number,
            music_enabled: settings.music_enabled,
            music_volume: parseFloat(settings.music_volume),
            background_music_url: settings.background_music_url,
            loading_duration: parseInt(settings.loading_duration, 10),
            theme_color: settings.theme_color,
            start_time: settings.start_time,
            end_time: settings.end_time,
            profile_enabled: settings.profile_enabled,
            profile_full_name: settings.profile_full_name,
            profile_birth_place: settings.profile_birth_place,
            profile_birth_date: settings.profile_birth_date || null,
            profile_description: settings.profile_description,
            profile_avatar_url: settings.profile_avatar_url,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('invitation_settings')
            .update(payload)
            .eq('id', 1)
            .select()
            .single();

        if (error) {
            console.error('SettingsRepository.updateSettings failed:', error);
            throw error;
        }

        return new InvitationSettings(data);
    }
};

// Export to window object
window.SettingsRepository = SettingsRepository;
