// js/components/guestTable.js
'use strict';

/**
 * Manages rendering of guest rows, search filtration, copying of URLs, and action event dispatches.
 */
class GuestTable {
    constructor({ 
        desktopContainerEl, 
        tableBodyEl, 
        mobileContainerEl, 
        emptyStateEl, 
        onEditClicked, 
        onDeleteClicked, 
        onCopyClicked 
    }) {
        this.desktopContainer = desktopContainerEl;
        this.tableBody = tableBodyEl;
        this.mobileContainer = mobileContainerEl;
        this.emptyState = emptyStateEl;
        
        this.onEditClicked = onEditClicked;
        this.onDeleteClicked = onDeleteClicked;
        this.onCopyClicked = onCopyClicked;
        
        this.guests = [];
        this.filteredGuests = [];
        this.searchQuery = '';
    }

    /**
     * Update the dataset and trigger render.
     * @param {Array} guests 
     */
    setGuests(guests) {
        this.guests = [...guests];
        this.applyFilter();
    }

    /**
     * Apply search string filter.
     * @param {string} query 
     */
    filter(query) {
        this.searchQuery = (query || '').toLowerCase().trim();
        this.applyFilter();
    }

    /**
     * Filter data array and render layout.
     */
    applyFilter() {
        if (!this.searchQuery) {
            this.filteredGuests = [...this.guests];
        } else {
            this.filteredGuests = this.guests.filter(g => {
                const nameMatch = (g.guest_name || '').toLowerCase().includes(this.searchQuery);
                const slugMatch = (g.guest_slug || '').toLowerCase().includes(this.searchQuery);
                return nameMatch || slugMatch;
            });
        }
        this.render();
    }

    /**
     * Redraw Desktop + Mobile layouts or show empty state.
     */
    render() {
        if (!this.tableBody || !this.mobileContainer || !this.desktopContainer || !this.emptyState) return;

        // Clear containers
        this.tableBody.innerHTML = '';
        this.mobileContainer.innerHTML = '';

        if (this.filteredGuests.length === 0) {
            this.desktopContainer.style.display = 'none';
            this.mobileContainer.style.display = 'none';
            this.emptyState.style.display = 'flex';
            return;
        }

        // Hide empty state
        this.emptyState.style.display = 'none';

        // Detect viewport to adjust container displays
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            this.mobileContainer.style.display = 'flex';
            this.desktopContainer.style.display = 'none';
        } else {
            this.mobileContainer.style.display = 'none';
            this.desktopContainer.style.display = 'block';
        }

        // Render Desktop Rows and Mobile Cards
        this.filteredGuests.forEach(guest => {
            // 1. Create Desktop Row
            const tr = this.createDesktopRow(guest);
            this.tableBody.appendChild(tr);

            // 2. Create Mobile Card
            const card = this.createMobileCard(guest);
            this.mobileContainer.appendChild(card);
        });
    }

    /**
     * Build desktop <tr> element.
     */
    createDesktopRow(guest) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', guest.id);

        const inviteUrl = guest.invitation_url || '';
        const dateStr = this.formatDate(guest.created_at);
        const escapedName = this.escapeHtml(guest.guest_name);

        tr.innerHTML = `
            <td style="font-weight: 600; color: var(--white);">${escapedName}</td>
            <td><code style="color: var(--slate); font-size: 0.8rem; background: rgba(255, 255, 255, 0.05); padding: 2px 6px; border-radius: 4px;">${this.escapeHtml(guest.guest_slug)}</code></td>
            <td>
                <div class="guest-link-cell">
                    <a href="${this.escapeHtml(inviteUrl)}" class="link-text-truncate" target="_blank" title="Buka Undangan">${this.escapeHtml(inviteUrl)}</a>
                    <button type="button" class="btn-action-icon btn-copy-link" title="Salin Tautan" aria-label="Salin tautan undangan untuk ${escapedName}">
                        📋
                    </button>
                </div>
            </td>
            <td style="color: var(--slate); font-size: 0.85rem;">${this.escapeHtml(dateStr)}</td>
            <td style="text-align: right;">
                <button type="button" class="btn-action-icon btn-edit-action" title="Edit Tamu" aria-label="Edit tamu ${escapedName}" style="margin-right: 8px;">
                    ✏️
                </button>
                <button type="button" class="btn-action-icon btn-delete-action btn-delete" title="Hapus Tamu" aria-label="Hapus tamu ${escapedName}">
                    🗑️
                </button>
            </td>
        `;

        // Action bindings
        tr.querySelector('.btn-copy-link').addEventListener('click', () => {
            if (this.onCopyClicked) this.onCopyClicked(inviteUrl);
        });

        tr.querySelector('.btn-edit-action').addEventListener('click', () => {
            if (this.onEditClicked) this.onEditClicked(guest);
        });

        tr.querySelector('.btn-delete-action').addEventListener('click', () => {
            if (this.onDeleteClicked) this.onDeleteClicked(guest.id);
        });

        return tr;
    }

    /**
     * Build mobile card element.
     */
    createMobileCard(guest) {
        const card = document.createElement('div');
        card.className = 'mobile-guest-card';
        card.setAttribute('data-id', guest.id);

        const inviteUrl = guest.invitation_url || '';
        const dateStr = this.formatDate(guest.created_at);
        const escapedName = this.escapeHtml(guest.guest_name);

        card.innerHTML = `
            <div class="mobile-card-header">
                <div>
                    <div class="mobile-guest-name">${escapedName}</div>
                    <div class="mobile-guest-slug">Slug: <code>${this.escapeHtml(guest.guest_slug)}</code></div>
                </div>
            </div>
            <div class="mobile-card-body">
                <div class="mobile-card-row">
                    <span class="mobile-row-label">Tautan Undangan</span>
                    <div class="guest-link-cell" style="max-width: 100%; margin-top: 4px;">
                        <a href="${this.escapeHtml(inviteUrl)}" class="link-text-truncate" target="_blank" title="Buka Undangan">${this.escapeHtml(inviteUrl)}</a>
                        <button type="button" class="btn-action-icon btn-copy-link" title="Salin Tautan" aria-label="Salin tautan undangan untuk ${escapedName}">
                            📋
                        </button>
                    </div>
                </div>
                <div class="mobile-card-row" style="margin-top: 8px;">
                    <span class="mobile-row-label">Dibuat Pada</span>
                    <span style="font-size: 0.85rem; color: var(--slate);">${this.escapeHtml(dateStr)}</span>
                </div>
            </div>
            <div class="mobile-card-footer">
                <button type="button" class="btn btn-secondary btn-edit-action" aria-label="Edit tamu ${escapedName}" style="padding: 6px 12px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                    ✏️ Edit
                </button>
                <button type="button" class="btn btn-delete-action" aria-label="Hapus tamu ${escapedName}" style="padding: 6px 12px; font-size: 0.75rem; background-color: rgba(239, 68, 68, 0.15); color: #FCA5A5; display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-sm); cursor: pointer;">
                    🗑️ Hapus
                </button>
            </div>
        `;

        // Action bindings
        card.querySelector('.btn-copy-link').addEventListener('click', () => {
            if (this.onCopyClicked) this.onCopyClicked(inviteUrl);
        });

        card.querySelector('.btn-edit-action').addEventListener('click', () => {
            if (this.onEditClicked) this.onEditClicked(guest);
        });

        card.querySelector('.btn-delete-action').addEventListener('click', () => {
            if (this.onDeleteClicked) this.onDeleteClicked(guest.id);
        });

        return card;
    }

    /**
     * Format timestamp strings to localized reader layout.
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const options = { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return date.toLocaleDateString('id-ID', options);
        } catch (e) {
            return dateStr;
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Bind to window object
window.GuestTable = GuestTable;
