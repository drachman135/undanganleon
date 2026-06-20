// js/components/linkGenerator.js
'use strict';

/**
 * Utility helper for slug generation and unique validation conflicts.
 */
const LinkGenerator = {
    /**
     * Convert a raw guest name into a clean, URL-safe slug.
     * Rules: lowercased, replace spaces/special chars with a single dash, remove trailing/leading dashes.
     * @param {string} name - Guest name
     * @returns {string} - Slug representation
     */
    generateSlug(name) {
        if (!name) return '';
        return name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric with dash
            .replace(/^-+|-+$/g, '');        // trim leading/trailing dashes
    },

    /**
     * Resolves slug uniqueness using an in-memory array/set of existing slugs.
     * Highly optimized for bulk imports to avoid repeated database hits.
     * @param {string} baseSlug - Original slug
     * @param {Array<string>|Set<string>} existingSlugs - Slugs that are already in use
     * @returns {string} - A guaranteed unique slug
     */
    resolveUniqueSlug(baseSlug, existingSlugs) {
        const slugSet = existingSlugs instanceof Set ? existingSlugs : new Set(existingSlugs);
        if (!slugSet.has(baseSlug)) {
            return baseSlug;
        }

        let suffix = 2;
        let newSlug = `${baseSlug}-${suffix}`;
        while (slugSet.has(newSlug)) {
            suffix++;
            newSlug = `${baseSlug}-${suffix}`;
        }
        return newSlug;
    },

    /**
     * Resolves slug uniqueness by querying the database in a sequential check.
     * Used when adding or updating a single guest.
     * @param {string} baseSlug - Original slug
     * @param {string|null} excludeId - UUID of guest to exclude (used on edit)
     * @returns {Promise<string>} - A unique slug
     */
    async resolveUniqueSlugDb(baseSlug, excludeId = null) {
        let exists = await GuestRepository.checkSlugExists(baseSlug, excludeId);
        if (!exists) {
            return baseSlug;
        }

        let suffix = 2;
        let newSlug = `${baseSlug}-${suffix}`;
        exists = await GuestRepository.checkSlugExists(newSlug, excludeId);
        
        while (exists) {
            suffix++;
            newSlug = `${baseSlug}-${suffix}`;
            exists = await GuestRepository.checkSlugExists(newSlug, excludeId);
        }
        
        return newSlug;
    },

    /**
     * Formats the final URL string sent to the guest.
     * @param {string} slug - Guest slug
     * @returns {string} - URL to send to guest
     */
    generateInvitationUrl(slug) {
        if (!slug) return '';
        // Uses the current site domain dynamically (supports localhost & Vercel deploy)
        return `${window.location.origin}/?to=${slug}`;
    }
};

// Export to window object
window.LinkGenerator = LinkGenerator;
