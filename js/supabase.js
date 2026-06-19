// js/supabase.js
'use strict';

const SUPABASE_URL = 'https://jiqipowmkzqmyekjxnjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7uaygnUhT6-yZPcpoRbjkA_UolWtBmN';

let supabaseClient = null;

function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;

    // Check if configuration exists in localStorage (configured via Admin Panel)
    const storedUrl = localStorage.getItem('supabase_url') || SUPABASE_URL;
    const storedKey = localStorage.getItem('supabase_anon_key') || SUPABASE_ANON_KEY;

    const isValidUrl = storedUrl && storedUrl !== 'https://your-project.supabase.co' && storedUrl.startsWith('https://');
    const isValidKey = storedKey && storedKey !== 'your-anon-key';

    if (typeof supabase !== 'undefined' && isValidUrl && isValidKey) {
        try {
            supabaseClient = supabase.createClient(storedUrl, storedKey);
        } catch (e) {
            console.error('Failed to initialize Supabase client:', e);
        }
    }
    return supabaseClient;
}
