// js/middleware/authGuard.js
'use strict';

/**
 * Route protection guard for the Admin Panel.
 * Validates authentication session and admin role in admin_profiles.
 */
async function protectAdminRoute() {
    const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
    
    // Detect page path to determine if it is the login page
    const path = window.location.pathname;
    const isLoginPage = path.includes('login.html') || path.endsWith('/login') || path.endsWith('/login/');

    if (!supabase) {
        if (!isLoginPage) {
            window.location.href = './login.html';
        }
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            // Unauthenticated: redirect to login if visiting any protected page
            if (!isLoginPage) {
                window.location.href = './login.html';
            }
        } else {
            // Authenticated: check database for admin privileges
            const { data: profile, error: profileError } = await supabase
                .from('admin_profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            const isAdmin = profile && profile.role === 'admin';

            if (!isAdmin || profileError) {
                // Deny access: sign out user and redirect to login page with query info
                await supabase.auth.signOut();
                if (!isLoginPage) {
                    window.location.href = './login.html?error=unauthorized';
                }
            } else {
                // Authorized Admin: redirect to dashboard if visiting the login page
                if (isLoginPage) {
                    window.location.href = './dashboard.html';
                }
            }
        }
    } catch (e) {
        console.error('Auth Guard failure:', e);
        if (!isLoginPage) {
            window.location.href = './login.html?error=session_expired';
        }
    }
}

// Execute immediately upon script loading in <head> to prevent layout content flash
protectAdminRoute();
