// js/supabase-db.js
'use strict';

const db = {
    /**
     * Fetch all configuration settings for the invitation.
     */
    async getSettings() {
        try {
            const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
            if (!supabase) return null;

            const { data, error } = await supabase
                .from('invitation_settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (error) throw error;
            return data;
        } catch (e) {
            console.warn('db.getSettings failed:', e);
            return null;
        }
    },

    /**
     * Fetch gallery images sorted by sort_order.
     */
    async getGallery() {
        try {
            const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
            if (!supabase) return null;

            const { data, error } = await supabase
                .from('gallery_images')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return data;
        } catch (e) {
            console.warn('db.getGallery failed:', e);
            return null;
        }
    },

    /**
     * Look up a guest profile by slug.
     * @param {string} slug 
     */
    async getGuestBySlug(slug) {
        if (!slug) return null;
        try {
            const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
            if (!supabase) return null;

            const { data, error } = await supabase
                .from('guests')
                .select('*')
                .eq('guest_slug', slug)
                .single();

            if (error) throw error;
            return data;
        } catch (e) {
            console.warn(`db.getGuestBySlug (${slug}) failed:`, e);
            return null;
        }
    },

    /**
     * Submit an RSVP confirmation to the database.
     * @param {string} guestName 
     * @param {string|number} guestCount 
     */
    async submitRSVP(guestName, guestCount) {
        try {
            const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
            if (!supabase) return null;

            const count = parseInt(guestCount, 10) || 1;

            const { data, error } = await supabase
                .from('rsvp_submissions')
                .insert([
                    {
                        guest_name: guestName,
                        attendance_status: 'hadir',
                        guest_count: count,
                        message: 'Mengonfirmasi lewat form undangan web'
                    }
                ])
                .select();

            if (error) throw error;
            return data;
        } catch (e) {
            console.warn('db.submitRSVP failed:', e);
            return null;
        }
    }
};
