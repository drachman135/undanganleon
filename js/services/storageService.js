// js/services/storageService.js
'use strict';

/**
 * Service to manage Supabase Storage operations.
 */
const StorageService = {
    /**
     * Upload a file to a specific storage bucket.
     * @param {string} bucket 
     * @param {string} filePath 
     * @param {File} file 
     * @returns {Promise<string>} Public URL of the uploaded file
     */
    async uploadFile(bucket, filePath, file) {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) throw new Error('Supabase client is not initialized');

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error('StorageService.uploadFile failed:', error);
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) {
            throw new Error('Gagal mendapatkan URL publik dari file.');
        }

        return urlData.publicUrl;
    },

    /**
     * Delete a file from a specific storage bucket.
     * @param {string} bucket 
     * @param {string} filePath 
     */
    async deleteFile(bucket, filePath) {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) throw new Error('Supabase client is not initialized');

        // Extract filename / path from full URL if full URL is passed
        let cleanPath = filePath;
        if (filePath.startsWith('http')) {
            // URL format: https://xxxx.supabase.co/storage/v1/object/public/bucket/path
            const parts = filePath.split(`/storage/v1/object/public/${bucket}/`);
            if (parts.length === 2) {
                cleanPath = parts[1];
            } else {
                // Try fallback splitting by filename
                cleanPath = filePath.split('/').pop().split('?')[0];
            }
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .remove([cleanPath]);

        if (error) {
            console.warn('StorageService.deleteFile failed (non-blocking):', error);
        }

        return data;
    }
};

// Export to window object
window.StorageService = StorageService;
