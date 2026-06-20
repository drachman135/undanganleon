// js/services/rsvpService.js
'use strict';

/**
 * Main Service Orchestrator coordinating all RSVP CMS operations and subcomponents.
 */
class RSVPService {
    constructor() {
        this.supabase = null;
        this.rsvpData = []; // cached full list of submissions
        this.toastTimeout = null;

        // Subcomponents references
        this.rsvpTable = null;
        this.rsvpFilters = null;
        this.exportManager = null;
        this.analyticsPanel = null;
        this.detailModal = null;
    }

    /**
     * Entry point on page load.
     */
    async init() {
        try {
            this.showGlobalLoading(true);

            // Connect to Supabase
            this.supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
            if (!this.supabase) {
                throw new Error('Supabase client failed to initialize');
            }

            // Initialize Subcomponents in sequence
            this.initAnalyticsPanel();
            this.initDetailModal();
            this.initRSVPTable();
            this.initExportManager();
            this.initRSVPFilters();

            // Load all RSVP entries
            await this.loadRSVPData();

            // Window resize triggers responsive redraws
            window.addEventListener('resize', () => {
                if (this.rsvpTable) {
                    this.rsvpTable.render();
                }
            });

        } catch (e) {
            console.error('Failed to initialize RSVPService:', e);
            this.showToast('Gagal memuat manajemen RSVP. Periksa koneksi Supabase Anda.', 'error');
        } finally {
            this.showGlobalLoading(false);
        }
    }

    /**
     * Query data from repository and refresh visual card stats and graphs.
     */
    async loadRSVPData() {
        try {
            this.rsvpData = await RSVPRepository.getAllRSVP();

            // 1. Update Core Card statistics
            this.updateSummaryCards();

            // 2. Feed visual analytics graphs
            if (this.analyticsPanel) {
                this.analyticsPanel.update(this.rsvpData);
            }

            // 3. Populate filters which implicitly updates the table view
            if (this.rsvpFilters) {
                this.rsvpFilters.setData(this.rsvpData);
            }
        } catch (error) {
            console.error('Error loading RSVP submissions:', error);
            this.showToast('Gagal memuat data RSVP.', 'error');
        }
    }

    // ==========================================
    // INITIALIZATION METHODS
    // ==========================================

    initAnalyticsPanel() {
        this.analyticsPanel = new AnalyticsPanel({
            ratioChartEl: document.getElementById('chart-ratio'),
            ratioPercentageEl: document.getElementById('chart-ratio-percentage'),
            ratioLegendEl: document.getElementById('chart-ratio-legend'),
            distributionChartEl: document.getElementById('chart-distribution'),
            totalAttendeesEl: document.getElementById('analytics-total-attendees')
        });
    }

    initDetailModal() {
        this.detailModal = new DetailModal({
            modalEl: document.getElementById('rsvp-detail-modal'),
            closeBtnEl: document.getElementById('btn-modal-close-detail'),
            closeFooterBtnEl: document.getElementById('btn-modal-close-detail-footer'),
            nameEl: document.getElementById('detail-guest-name'),
            badgeEl: document.getElementById('detail-attendance-badge'),
            countEl: document.getElementById('detail-guest-count'),
            messageEl: document.getElementById('detail-message'),
            dateEl: document.getElementById('detail-submission-date')
        });
    }

    initRSVPTable() {
        this.rsvpTable = new RSVPTable({
            desktopContainerEl: document.getElementById('rsvp-desktop-container'),
            tableBodyEl: document.getElementById('rsvp-table-body'),
            mobileContainerEl: document.getElementById('rsvp-mobile-container'),
            emptyStateEl: document.getElementById('rsvp-empty-state'),
            paginationPanelEl: document.getElementById('rsvp-pagination-panel'),
            infoTextEl: document.getElementById('pagination-info-text'),
            buttonsContainerEl: document.getElementById('pagination-buttons-container'),
            onDetailClicked: (rsvp) => this.handleDetailClicked(rsvp),
            onDeleteClicked: (id) => this.handleDeleteClicked(id)
        });
    }

    initExportManager() {
        this.exportManager = new ExportManager({
            toggleBtnEl: document.getElementById('btn-toggle-export-panel'),
            panelEl: document.getElementById('export-expandable-panel'),
            cancelBtnEl: document.getElementById('btn-cancel-export'),
            processBtnEl: document.getElementById('btn-process-export'),
            formatRadioName: 'export-format',
            filterSelectEl: document.getElementById('export-filter'),
            onExportDataNeeded: () => this.rsvpData,
            onShowToast: (msg, type) => this.showToast(msg, type)
        });
    }

    initRSVPFilters() {
        this.rsvpFilters = new RSVPFilters({
            searchInputEl: document.getElementById('input-search-rsvp'),
            filterStatusEl: document.getElementById('filter-attendance'),
            sortEl: document.getElementById('sort-rsvp'),
            onFiltersChanged: (filteredData) => {
                if (this.rsvpTable) {
                    this.rsvpTable.setData(filteredData);
                }
            }
        });
    }

    // ==========================================
    // DATA AND UTILS HANDLERS
    // ==========================================

    /**
     * Calculates statistics and populates text fields in cards.
     */
    updateSummaryCards() {
        const total = this.rsvpData.length;
        const hadir = this.rsvpData.filter(r => r.attendance_status === 'hadir').length;
        const tidakHadir = this.rsvpData.filter(r => r.attendance_status === 'tidak_hadir').length;
        
        const sumAttendees = this.rsvpData
            .filter(r => r.attendance_status === 'hadir')
            .reduce((sum, r) => sum + (r.guest_count || 0), 0);

        // Set card values
        document.getElementById('stats-total-rsvp').textContent = total.toLocaleString('id-ID');
        document.getElementById('stats-total-hadir').textContent = hadir.toLocaleString('id-ID');
        document.getElementById('stats-total-tidak-hadir').textContent = tidakHadir.toLocaleString('id-ID');
        document.getElementById('stats-guests-attending').textContent = sumAttendees.toLocaleString('id-ID');

        // Set latest activity details
        const latestEl = document.getElementById('stats-latest-rsvp');
        const latestDescEl = document.getElementById('stats-latest-desc');

        if (total > 0) {
            // Find row with largest created_at
            const sorted = [...this.rsvpData].sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            const latest = sorted[0];

            const name = latest.guest_name || '-';
            const statusText = latest.attendance_status === 'hadir' ? 'Hadir' : 'Absen';
            
            // Format name to show cleanly
            const displayName = name.length > 15 ? `${name.substring(0, 12)}...` : name;
            
            if (latestEl) {
                latestEl.textContent = displayName;
                latestEl.title = name;
            }
            if (latestDescEl) {
                const date = new Date(latest.created_at);
                const timeStr = `${date.toLocaleDateString('id-ID')} ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
                latestDescEl.innerHTML = `Oleh ${displayName} (${statusText})<br><span style="font-size: 0.75rem; color: var(--slate);">${timeStr}</span>`;
            }
        } else {
            if (latestEl) latestEl.textContent = '-';
            if (latestDescEl) latestDescEl.textContent = 'Belum ada RSVP masuk';
        }
    }

    handleDetailClicked(rsvp) {
        if (this.detailModal) {
            this.detailModal.open(rsvp);
        }
    }

    async handleDeleteClicked(id) {
        if (confirm('Apakah Anda yakin ingin menghapus RSVP ini?')) {
            this.showToast('Menghapus...', 'success');
            
            try {
                this.showGlobalLoading(true);
                await RSVPRepository.deleteRSVP(id);
                this.showToast('RSVP berhasil dihapus', 'success');
                await this.loadRSVPData();
            } catch (error) {
                console.error('Delete RSVP failed:', error);
                this.showToast('Gagal menghapus RSVP', 'error');
            } finally {
                this.showGlobalLoading(false);
            }
        }
    }

    // ==========================================
    // NOTIFICATION TOASTS AND LOADERS
    // ==========================================

    showGlobalLoading(isLoading) {
        const skeleton = document.getElementById('rsvp-skeleton-loader');
        const desktop = document.getElementById('rsvp-desktop-container');
        const mobile = document.getElementById('rsvp-mobile-container');
        const emptyState = document.getElementById('rsvp-empty-state');
        const pagination = document.getElementById('rsvp-pagination-panel');

        if (isLoading) {
            if (skeleton) skeleton.style.display = 'block';
            if (desktop) desktop.style.display = 'none';
            if (mobile) mobile.style.display = 'none';
            if (emptyState) emptyState.style.display = 'none';
            if (pagination) pagination.style.display = 'none';
        } else {
            if (skeleton) skeleton.style.display = 'none';
            if (this.rsvpTable) {
                this.rsvpTable.render();
            }
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        const text = document.getElementById('toast-message');

        if (!toast || !icon || !text) return;

        toast.className = 'toast show ' + type;
        icon.textContent = type === 'success' ? '✓' : '✗';
        text.textContent = message;

        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Only run if page has the search input representing the RSVP dashboard context
    if (document.getElementById('input-search-rsvp')) {
        const rsvpService = new RSVPService();
        rsvpService.init();
        window.rsvpService = rsvpService;
    }
});
