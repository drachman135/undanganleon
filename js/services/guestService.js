// js/services/guestService.js
'use strict';

/**
 * Main Service Orchestrator coordinating all Guest CMS interactions.
 */
class GuestService {
    constructor() {
        this.supabase = null;
        this.guests = []; // cached list of guests
        this.toastTimeout = null;

        // Component references
        this.guestTable = null;
        this.guestForm = null;
        this.importManager = null;
        this.statisticsPanel = null;
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

            // Initialize Subcomponents
            this.initStatisticsPanel();
            this.initGuestTable();
            this.initGuestForm();
            this.initImportManager();

            // Load initial guests list
            await this.loadGuests();

            // Bind page-level action elements
            this.bindPageActions();

            // Beforeunload warning guard for active forms/import content
            window.addEventListener('beforeunload', (e) => {
                const isFormOpen = document.getElementById('guest-form-modal')?.classList.contains('show');
                const pasteAreaValue = document.getElementById('import-paste-area')?.value.trim();
                
                if (isFormOpen || pasteAreaValue) {
                    e.preventDefault();
                    e.returnValue = 'Perubahan belum disimpan';
                    return 'Perubahan belum disimpan';
                }
            });

        } catch (e) {
            console.error('Failed to initialize GuestService:', e);
            this.showToast('Gagal memuat manajemen tamu. Periksa koneksi Supabase Anda.', 'error');
        } finally {
            this.showGlobalLoading(false);
        }
    }

    /**
     * Retrieve the latest guest data from repository and update components.
     */
    async loadGuests() {
        try {
            this.guests = await GuestRepository.getAllGuests();

            // Update components
            if (this.guestTable) {
                this.guestTable.setGuests(this.guests);
            }
            if (this.statisticsPanel) {
                this.statisticsPanel.update(this.guests);
            }
        } catch (error) {
            console.error('Error loading guests:', error);
            this.showToast('Gagal memuat data tamu dari server.', 'error');
        }
    }

    // ==========================================
    // INITIALIZATION HELPERS
    // ==========================================

    initStatisticsPanel() {
        this.statisticsPanel = new StatisticsPanel({
            totalEl: document.getElementById('stats-total-guests'),
            newEl: document.getElementById('stats-new-guests'),
            generatedEl: document.getElementById('stats-generated-links')
        });
    }

    initGuestTable() {
        this.guestTable = new GuestTable({
            desktopContainerEl: document.getElementById('guests-desktop-container'),
            tableBodyEl: document.getElementById('guests-table-body'),
            mobileContainerEl: document.getElementById('guests-mobile-container'),
            emptyStateEl: document.getElementById('guests-empty-state'),
            onEditClicked: (guest) => this.handleEditClicked(guest),
            onDeleteClicked: (id) => this.handleDeleteClicked(id),
            onCopyClicked: (url) => this.handleCopyClicked(url)
        });

        // Re-render table on window resize to switch table/cards view seamlessly
        window.addEventListener('resize', () => {
            if (this.guestTable) {
                this.guestTable.render();
            }
        });
    }

    initGuestForm() {
        const modalEl = document.getElementById('guest-form-modal');
        const formEl = document.getElementById('guest-submit-form');

        this.guestForm = new GuestForm({
            modalEl,
            formEl,
            onSubmit: (guestPayload) => this.handleFormSubmit(guestPayload)
        });
    }

    initImportManager() {
        const toggleBtnEl = document.getElementById('btn-toggle-import-panel');
        const panelEl = document.getElementById('import-expandable-panel');
        const dropzoneEl = document.getElementById('import-dropzone');
        const fileInputEl = document.getElementById('import-file-input');
        const pasteAreaEl = document.getElementById('import-paste-area');
        const processBtnEl = document.getElementById('btn-process-import');
        const clearBtnEl = document.getElementById('btn-clear-import');
        const summaryPanelEl = document.getElementById('import-summary-box');

        const countsEls = {
            totalEl: document.getElementById('summary-total'),
            successEl: document.getElementById('summary-success'),
            failedEl: document.getElementById('summary-failed'),
            duplicateEl: document.getElementById('summary-duplicates')
        };

        this.importManager = new ImportManager({
            toggleBtnEl,
            panelEl,
            dropzoneEl,
            fileInputEl,
            pasteAreaEl,
            processBtnEl,
            clearBtnEl,
            summaryPanelEl,
            countsEls,
            onImportTriggered: (names) => this.handleImportTriggered(names)
        });
    }

    /**
     * Bind page actions (Search and Add Guest).
     */
    bindPageActions() {
        // Search Input filter
        const searchInput = document.getElementById('input-search-guest');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (this.guestTable) {
                    this.guestTable.filter(e.target.value);
                }
            });
        }

        // Add Guest Button click
        const addBtn = document.getElementById('btn-open-add-modal');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (this.guestForm) {
                    this.guestForm.open(null);
                }
            });
        }
    }

    // ==========================================
    // ACTION HANDLERS
    // ==========================================

    handleEditClicked(guest) {
        if (this.guestForm) {
            this.guestForm.open(guest);
        }
    }

    async handleDeleteClicked(id) {
        if (confirm('Apakah Anda yakin ingin menghapus tamu ini?')) {
            try {
                this.showGlobalLoading(true);
                await GuestRepository.deleteGuest(id);
                this.showToast('Tamu berhasil dihapus', 'success');
                await this.loadGuests();
            } catch (error) {
                console.error('Delete guest failed:', error);
                this.showToast('Gagal menghapus tamu', 'error');
            } finally {
                this.showGlobalLoading(false);
            }
        }
    }

    async handleCopyClicked(url) {
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            this.showToast('Tautan undangan berhasil disalin! 📋', 'success');
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            this.showToast('Gagal menyalin tautan.', 'error');
        }
    }

    async handleFormSubmit(guestPayload) {
        try {
            if (guestPayload.id) {
                // Update existing guest record
                await GuestRepository.updateGuest(guestPayload.id, guestPayload);
                this.showToast('Data tamu berhasil diperbarui', 'success');
            } else {
                // Insert new guest record
                await GuestRepository.insertGuest(guestPayload);
                this.showToast('Tamu baru berhasil ditambahkan', 'success');
            }
            await this.loadGuests();
        } catch (error) {
            console.error('Save guest failed:', error);
            this.showToast('Gagal menyimpan tamu.', 'error');
            throw error; // rethrow so guestForm UI can reset loading state correctly
        }
    }

    async handleImportTriggered(names) {
        try {
            // Read in-use slugs from local memory cache to optimize conflicts processing
            const existingSlugs = new Set(this.guests.map(g => g.guest_slug));
            const payload = [];
            let duplicatesCount = 0;

            names.forEach(name => {
                const baseSlug = LinkGenerator.generateSlug(name);
                const finalSlug = LinkGenerator.resolveUniqueSlug(baseSlug, existingSlugs);

                if (finalSlug !== baseSlug) {
                    duplicatesCount++;
                }

                // Add to temporary checking list to avoid duplicates within import file rows itself
                existingSlugs.add(finalSlug);

                payload.push({
                    guest_name: name,
                    guest_slug: finalSlug,
                    invitation_url: LinkGenerator.generateInvitationUrl(finalSlug)
                });
            });

            // Perform bulk query insertion
            const insertedData = await GuestRepository.bulkInsertGuests(payload);
            const successCount = insertedData.length;
            const failedCount = payload.length - successCount;

            this.showToast(`Impor berhasil! ${successCount} tamu ditambahkan`, 'success');

            // Refresh view
            await this.loadGuests();

            // Clear import area text
            if (this.importManager) {
                this.importManager.showSummary({
                    total: names.length,
                    success: successCount,
                    failed: failedCount,
                    duplicates: duplicatesCount
                });
                
                // Optional: clear text area on successful import
                const pasteArea = document.getElementById('import-paste-area');
                if (pasteArea) pasteArea.value = '';
            }

        } catch (error) {
            console.error('Bulk import failed:', error);
            this.showToast('Gagal mengimpor daftar tamu secara massal.', 'error');
            throw error;
        }
    }

    // ==========================================
    // NOTIFICATION TOASTS AND LOADERS
    // ==========================================

    showGlobalLoading(isLoading) {
        const skeleton = document.getElementById('guests-skeleton-loader');
        const desktop = document.getElementById('guests-desktop-container');
        const mobile = document.getElementById('guests-mobile-container');
        const emptyState = document.getElementById('guests-empty-state');

        if (isLoading) {
            if (skeleton) skeleton.style.display = 'block';
            if (desktop) desktop.style.display = 'none';
            if (mobile) mobile.style.display = 'none';
            if (emptyState) emptyState.style.display = 'none';
        } else {
            if (skeleton) skeleton.style.display = 'none';
            // Let the GuestTable manage container displays depending on data size
            if (this.guestTable) {
                this.guestTable.render();
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

// Instantiate on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only run if we are inside the guests page context
    if (document.getElementById('input-search-guest')) {
        const guestService = new GuestService();
        guestService.init();
        window.guestService = guestService;
    }
});
