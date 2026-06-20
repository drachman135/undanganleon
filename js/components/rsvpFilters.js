// js/components/rsvpFilters.js
'use strict';

/**
 * Manages search inputs, filter selections, sorting configurations, and triggers view updates.
 */
class RSVPFilters {
    constructor({ searchInputEl, filterStatusEl, sortEl, onFiltersChanged }) {
        this.searchInput = searchInputEl;
        this.filterStatus = filterStatusEl;
        this.sortSelect = sortEl;
        this.onFiltersChanged = onFiltersChanged;

        this.originalData = [];
        this.filteredData = [];

        this.bindEvents();
    }

    /**
     * Bind filters DOM changes.
     */
    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.applyFilters());
        }
        if (this.filterStatus) {
            this.filterStatus.addEventListener('change', () => this.applyFilters());
        }
        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', () => this.applyFilters());
        }
    }

    /**
     * Initialize data lists.
     * @param {Array} data 
     */
    setData(data) {
        this.originalData = [...data];
        this.applyFilters();
    }

    /**
     * Execute filter rules and sort sequences in-memory.
     */
    applyFilters() {
        let results = [...this.originalData];

        // 1. Apply Search Query (Guest Name or Message)
        const query = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
        if (query) {
            results = results.filter(r => {
                const nameMatch = (r.guest_name || '').toLowerCase().includes(query);
                const messageMatch = (r.message || '').toLowerCase().includes(query);
                return nameMatch || messageMatch;
            });
        }

        // 2. Apply Attendance Status Filter
        const status = this.filterStatus ? this.filterStatus.value : 'all';
        if (status !== 'all') {
            results = results.filter(r => r.attendance_status === status);
        }

        // 3. Apply Sorting
        const sortBy = this.sortSelect ? this.sortSelect.value : 'newest';
        this.sortResults(results, sortBy);

        this.filteredData = results;

        if (this.onFiltersChanged) {
            this.onFiltersChanged(this.filteredData);
        }
    }

    /**
     * Sorts the results array according to selected criteria.
     */
    sortResults(array, criterion) {
        switch (criterion) {
            case 'newest':
                array.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                break;
            case 'oldest':
                array.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
                break;
            case 'name_asc':
                array.sort((a, b) => {
                    const nameA = (a.guest_name || '').toLowerCase();
                    const nameB = (b.guest_name || '').toLowerCase();
                    return nameA.localeCompare(nameB, 'id');
                });
                break;
            case 'count_desc':
                array.sort((a, b) => (b.guest_count || 0) - (a.guest_count || 0));
                break;
            case 'count_asc':
                array.sort((a, b) => (a.guest_count || 0) - (b.guest_count || 0));
                break;
            default:
                break;
        }
    }
}

// Bind to window object
window.RSVPFilters = RSVPFilters;
