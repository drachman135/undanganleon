// js/repositories/guestRepository.js
'use strict';

/**
 * Data Repository for guests table in Supabase.
 */
const GuestRepository = {
    /**
     * Get all guest records from Supabase, ordered by created_at descending.
     * @returns {Promise<Array>}
     */
    async getAllGuests() {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) throw new Error('Supabase client is not initialized');

        const { data, error } = await supabase
            .from('guests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('GuestRepository.getAllGuests failed:', error);
            throw error;
        }

        return data || [];
    },

    /**
     * Check if a slug already exists in the database.
     * @param {string} slug - Slug to check
     * @param {string|null} excludeId - Optional ID to exclude from validation (for editing)
     * @returns {Promise<boolean>} - True if slug exists, false otherwise
     */
    async checkSlugExists(slug, excludeId = null) {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) throw new Error('Supabase client is not initialized');

        let query = supabase
            .from('guests')
            .select('id')
            .eq('guest_slug', slug);

        if (excludeId) {
            query = query.ne('id', excludeId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('GuestRepository.checkSlugExists failed:', error);
            throw error;
        }

        return data && data.length > 0;
    },

    /**
     * Create a single guest record.
     * @param {object} guest - Guest data { guest_name, guest_slug, invitation_url }
     * @returns {Promise<object>} - The inserted record
     */
    async insertGuest(guest) {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) throw new Error('Supabase client is not initialized');

        const payload = {
            guest_name: guest.guest_name,
            guest_slug: guest.guest_slug,
            invitation_url: guest.invitation_url,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('guests')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('GuestRepository.insertGuest failed:', error);
            throw error;
        }

        return data;
    },

    /**
     * Update a single guest record.
     * @param {string} id - Guest UUID
     * @param {object} guest - Guest data to update { guest_name, guest_slug, invitation_url }
     * @returns {Promise<object>} - The updated record
     */
    async updateGuest(id, guest) {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) throw new Error('Supabase client is not initialized');

        const payload = {
            guest_name: guest.guest_name,
            guest_slug: guest.guest_slug,
            invitation_url: guest.invitation_url
        };

        const { data, error } = await supabase
            .from('guests')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('GuestRepository.updateGuest failed:', error);
            throw error;
        }

        return data;
    },

    /**
     * Delete a single guest record.
     * @param {string} id - Guest UUID
     * @returns {Promise<boolean>} - True if delete succeeded
     */
    async deleteGuest(id) {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) throw new Error('Supabase client is not initialized');

        const { error } = await supabase
            .from('guests')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('GuestRepository.deleteGuest failed:', error);
            throw error;
        }

        return true;
    },

    /**
     * Bulk insert multiple guest records.
     * @param {Array<object>} guestsList - Array of guest records [{ guest_name, guest_slug, invitation_url }]
     * @returns {Promise<Array>} - The inserted records
     */
    async bulkInsertGuests(guestsList) {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) throw new Error('Supabase client is not initialized');

        if (!guestsList || guestsList.length === 0) return [];

        const payload = guestsList.map(g => ({
            guest_name: g.guest_name,
            guest_slug: g.guest_slug,
            invitation_url: g.invitation_url,
            created_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('guests')
            .insert(payload)
            .select();

        if (error) {
            console.error('GuestRepository.bulkInsertGuests failed:', error);
            throw error;
        }

        return data || [];
    }
};

// Export to window object
window.GuestRepository = GuestRepository;
