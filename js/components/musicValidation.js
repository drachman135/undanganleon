// js/components/musicValidation.js
'use strict';

/**
 * Validation layer for target audio files.
 */
const ValidationLayer = {
    /**
     * Validates if a file is an MP3 and under the size limit of 20MB.
     * @param {File} file 
     * @returns {Object} { isValid: boolean, error: string|null }
     */
    validateAudio(file) {
        const allowedTypes = ['audio/mp3', 'audio/mpeg'];
        const allowedExts = ['mp3'];
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        // Check mimetype and extension
        const isValidType = allowedTypes.includes(file.type) || allowedExts.includes(fileExt);
        if (!isValidType) {
            return {
                isValid: false,
                error: 'Format file tidak didukung' // Matches "Format file tidak didukung" error feedback
            };
        }
        
        // Limit size to 20MB
        const maxSize = 20 * 1024 * 1024; // 20MB in bytes
        if (file.size > maxSize) {
            return {
                isValid: false,
                error: 'Ukuran file terlalu besar' // Matches "Ukuran file terlalu besar" error feedback
            };
        }
        
        return {
            isValid: true,
            error: null
        };
    }
};

// Bind to window object
window.ValidationLayer = ValidationLayer;
