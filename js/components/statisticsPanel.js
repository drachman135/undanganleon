// js/components/statisticsPanel.js
'use strict';

/**
 * Manages calculating and rendering summary metric cards in the admin dashboard.
 */
class StatisticsPanel {
    constructor({ totalEl, newEl, generatedEl }) {
        this.totalEl = totalEl;
        this.newEl = newEl;
        this.generatedEl = generatedEl;
    }

    /**
     * Compute and output statistics from current guest list.
     * @param {Array} guests 
     */
    update(guests) {
        if (!guests) return;

        const totalGuests = guests.length;

        // Calculate guests registered within the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0); // start of day

        const newGuestsCount = guests.filter(g => {
            if (!g.created_at) return false;
            return new Date(g.created_at) >= sevenDaysAgo;
        }).length;

        // Calculate count of guests with valid invitation URLs
        const generatedLinksCount = guests.filter(g => !!g.invitation_url).length;

        // Update DOM elements
        if (this.totalEl) this.totalEl.textContent = this.formatNumber(totalGuests);
        if (this.newEl) this.newEl.textContent = this.formatNumber(newGuestsCount);
        if (this.generatedEl) this.generatedEl.textContent = this.formatNumber(generatedLinksCount);
    }

    /**
     * Fallback and localize formats.
     */
    formatNumber(num) {
        return typeof num === 'number' ? num.toLocaleString('id-ID') : '0';
    }
}

// Bind to window object
window.StatisticsPanel = StatisticsPanel;
