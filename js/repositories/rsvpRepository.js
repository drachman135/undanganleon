// js/repositories/rsvpRepository.js
'use strict';

/**
 * Data Repository for rsvp_submissions table in Supabase.
 */
const RSVPRepository = {
    /**
     * Get all RSVP records from Supabase, ordered by created_at descending.
     * @returns {Promise<Array>}
     */
    async getAllRSVP() {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) throw new Error('Supabase client is not initialized');

        const { data, error } = await supabase
            .from('rsvp_submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('RSVPRepository.getAllRSVP failed:', error);
            throw error;
        }

        return data || [];
    },

    /**
     * Delete an RSVP record by ID.
     * @param {string} id - RSVP entry UUID
     * @returns {Promise<boolean>}
     */
    async deleteRSVP(id) {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) throw new Error('Supabase client is not initialized');

        const { error } = await supabase
            .from('rsvp_submissions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('RSVPRepository.deleteRSVP failed:', error);
            throw error;
        }

        return true;
    }
};

// Export to window object
window.RSVPRepository = RSVPRepository;
