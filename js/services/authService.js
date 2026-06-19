// js/services/authService.js
'use strict';

const authService = {
    /**
     * Log in a user with email and password using Supabase Auth.
     * @param {string} email 
     * @param {string} password 
     */
    async login(email, password) {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) throw new Error('Supabase client is not initialized');

        // 1. Authenticate with email/password
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) throw authError;
        if (!authData || !authData.session) throw new Error('Sesi gagal dibuat');

        // 2. Validate admin role from admin_profiles
        try {
            const isAuthorized = await this.validateAdminRole(authData.session.user.id);
            if (!isAuthorized) {
                // If not an admin, sign out immediately to prevent token reuse
                await this.logout();
                throw new Error('UNAUTHORIZED_ROLE');
            }
            return authData.session;
        } catch (err) {
            await this.logout();
            throw err;
        }
    },

    /**
     * Sign out the user, clear sessions, and redirect.
     */
    async logout() {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (supabase) {
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.error('Sign out error:', e);
            }
        }
        // Redirect to login page
        window.location.href = './login.html';
    },

    /**
     * Check if a user ID exists in the admin_profiles table with 'admin' role.
     * @param {string} userId 
     */
    async validateAdminRole(userId) {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) return false;

        const { data, error } = await supabase
            .from('admin_profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !data) {
            console.warn('Role verification failed:', error);
            return false;
        }

        return data.role === 'admin';
    }
};
