// js/components/rsvpTable.js
'use strict';

/**
 * Handles rendering of the RSVP list, switching between desktop table and mobile card layout,
 * and managing client-side pagination controls.
 */
class RSVPTable {
    constructor({
        desktopContainerEl,
        tableBodyEl,
        mobileContainerEl,
        emptyStateEl,
        paginationPanelEl,
        infoTextEl,
        buttonsContainerEl,
        onDetailClicked,
        onDeleteClicked
    }) {
        this.desktopContainer = desktopContainerEl;
        this.tableBody = tableBodyEl;
        this.mobileContainer = mobileContainerEl;
        this.emptyState = emptyStateEl;
        this.paginationPanel = paginationPanelEl;
        this.infoText = infoTextEl;
        this.buttonsContainer = buttonsContainerEl;

        this.onDetailClicked = onDetailClicked;
        this.onDeleteClicked = onDeleteClicked;

        this.rsvpData = [];
        this.currentPage = 1;
        this.pageSize = 10;
    }

    /**
     * Set active data and update view.
     * @param {Array} rsvpData 
     */
    setData(rsvpData) {
        this.rsvpData = [...rsvpData];
        this.currentPage = 1;
        this.render();
    }

    /**
     * Render the paginated data.
     */
    render() {
        if (!this.tableBody || !this.mobileContainer || !this.desktopContainer || !this.emptyState || !this.paginationPanel) return;

        // Clear layout
        this.tableBody.innerHTML = '';
        this.mobileContainer.innerHTML = '';

        if (this.rsvpData.length === 0) {
            this.desktopContainer.style.display = 'none';
            this.mobileContainer.style.display = 'none';
            this.emptyState.style.display = 'flex';
            this.paginationPanel.style.display = 'none';
            return;
        }

        this.emptyState.style.display = 'none';

        // Toggle layout displays depending on width
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            this.mobileContainer.style.display = 'flex';
            this.desktopContainer.style.display = 'none';
        } else {
            this.mobileContainer.style.display = 'none';
            this.desktopContainer.style.display = 'block';
        }

        // Calculate pages pagination
        const totalItems = this.rsvpData.length;
        const totalPages = Math.ceil(totalItems / this.pageSize);

        // Bound current page
        if (this.currentPage > totalPages) {
            this.currentPage = totalPages || 1;
        }
        if (this.currentPage < 1) {
            this.currentPage = 1;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, totalItems);
        const paginatedData = this.rsvpData.slice(startIndex, endIndex);

        // Inject content
        paginatedData.forEach(rsvp => {
            // Desktop <tr> row
            const tr = this.createDesktopRow(rsvp);
            this.tableBody.appendChild(tr);

            // Mobile Card
            const card = this.createMobileCard(rsvp);
            this.mobileContainer.appendChild(card);
        });

        // Update pagination toolbar UI
        if (totalPages > 1) {
            this.paginationPanel.style.display = 'flex';
            this.updatePaginationControls(totalPages, totalItems, startIndex + 1, endIndex);
        } else {
            this.paginationPanel.style.display = 'none';
        }
    }

    /**
     * Build desktop row structure.
     */
    createDesktopRow(rsvp) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', rsvp.id);
        tr.style.cursor = 'pointer';

        const statusClass = rsvp.attendance_status === 'hadir' ? 'badge-hadir' : 'badge-tidak_hadir';
        const statusLabel = rsvp.attendance_status === 'hadir' ? '🟢 Hadir' : '🔴 Absen';
        const count = rsvp.guest_count || 0;
        const message = rsvp.message || '-';
        const dateStr = this.formatDate(rsvp.created_at);
        const escapedName = this.escapeHtml(rsvp.guest_name);

        tr.innerHTML = `
            <td style="font-weight: 600; color: var(--white);">${escapedName}</td>
            <td><span class="badge ${statusClass}">${statusLabel}</span></td>
            <td style="font-family: monospace; font-weight: bold; font-size: 0.95rem;">${count}</td>
            <td class="message-cell" title="${this.escapeHtml(message)}">${this.escapeHtml(message)}</td>
            <td style="color: var(--slate); font-size: 0.85rem;">${this.escapeHtml(dateStr)}</td>
            <td style="text-align: right;" onclick="event.stopPropagation();">
                <button type="button" class="btn-action-icon btn-detail-action" title="Rincian RSVP" aria-label="Rincian RSVP dari ${escapedName}" style="margin-right: 8px;">
                    👁️
                </button>
                <button type="button" class="btn-action-icon btn-delete-action btn-delete" title="Hapus RSVP" aria-label="Hapus RSVP dari ${escapedName}">
                    🗑️
                </button>
            </td>
        `;

        // Direct row click triggers detail modal open
        tr.addEventListener('click', () => {
            if (this.onDetailClicked) this.onDetailClicked(rsvp);
        });

        // Action bindings
        tr.querySelector('.btn-detail-action').addEventListener('click', () => {
            if (this.onDetailClicked) this.onDetailClicked(rsvp);
        });

        tr.querySelector('.btn-delete-action').addEventListener('click', () => {
            if (this.onDeleteClicked) this.onDeleteClicked(rsvp.id);
        });

        return tr;
    }

    /**
     * Build mobile card element.
     */
    createMobileCard(rsvp) {
        const card = document.createElement('div');
        card.className = 'mobile-rsvp-card';
        card.setAttribute('data-id', rsvp.id);

        const statusClass = rsvp.attendance_status === 'hadir' ? 'badge-hadir' : 'badge-tidak_hadir';
        const statusLabel = rsvp.attendance_status === 'hadir' ? '🟢 Hadir' : '🔴 Absen';
        const count = rsvp.guest_count || 0;
        const message = rsvp.message || '-';
        const dateStr = this.formatDate(rsvp.created_at);
        const escapedName = this.escapeHtml(rsvp.guest_name);

        card.innerHTML = `
            <div class="mobile-card-header">
                <div class="mobile-guest-name">${escapedName}</div>
                <span class="badge ${statusClass}">${statusLabel}</span>
            </div>
            <div class="mobile-card-body">
                <div class="mobile-card-row">
                    <span class="mobile-row-label">Kapasitas Tamu</span>
                    <span style="font-family: monospace; font-weight: bold;">${count} Orang</span>
                </div>
                <div class="mobile-card-row" style="margin-top: 6px;">
                    <span class="mobile-row-label">Isi Ucapan</span>
                    <p style="font-size: 0.85rem; color: var(--slate); margin: 2px 0 0 0; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                        ${this.escapeHtml(message)}
                    </p>
                </div>
                <div class="mobile-card-row" style="margin-top: 6px;">
                    <span class="mobile-row-label">Tanggal Kirim</span>
                    <span style="font-size: 0.85rem; color: var(--slate);">${this.escapeHtml(dateStr)}</span>
                </div>
            </div>
            <div class="mobile-card-footer">
                <button type="button" class="btn btn-secondary btn-detail-action" aria-label="Rincian RSVP dari ${escapedName}" style="padding: 6px 12px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                    👁️ Rincian
                </button>
                <button type="button" class="btn-delete-action" aria-label="Hapus RSVP dari ${escapedName}" style="padding: 6px 12px; font-size: 0.75rem; background-color: rgba(239, 68, 68, 0.15); color: #FCA5A5; display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-sm); cursor: pointer;">
                    🗑️ Hapus
                </button>
            </div>
        `;

        // Card clicks or footer buttons trigger detail
        card.addEventListener('click', (e) => {
            // Avoid triggering if delete was clicked
            if (e.target.closest('.btn-delete-action')) return;
            if (this.onDetailClicked) this.onDetailClicked(rsvp);
        });

        card.querySelector('.btn-detail-action').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onDetailClicked) this.onDetailClicked(rsvp);
        });

        card.querySelector('.btn-delete-action').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onDeleteClicked) this.onDeleteClicked(rsvp.id);
        });

        return card;
    }

    /**
     * Redraw pagination toolbar indicators and numbers buttons.
     */
    updatePaginationControls(totalPages, totalItems, fromItem, toItem) {
        // Info text
        if (this.infoText) {
            this.infoText.textContent = `Menampilkan ${fromItem} - ${toItem} dari ${totalItems} data`;
        }

        if (!this.buttonsContainer) return;
        this.buttonsContainer.innerHTML = '';

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn-pagination';
        prevBtn.innerHTML = '←';
        prevBtn.setAttribute('aria-label', 'Halaman sebelumnya');
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            this.currentPage--;
            this.render();
        });
        this.buttonsContainer.appendChild(prevBtn);

        // Page buttons numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let p = startPage; p <= endPage; p++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `btn-pagination ${p === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = p;
            pageBtn.setAttribute('aria-label', `Halaman ${p}`);
            pageBtn.addEventListener('click', () => {
                this.currentPage = p;
                this.render();
            });
            this.buttonsContainer.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn-pagination';
        nextBtn.innerHTML = '→';
        nextBtn.setAttribute('aria-label', 'Halaman berikutnya');
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            this.currentPage++;
            this.render();
        });
        this.buttonsContainer.appendChild(nextBtn);
    }

    /**
     * Localize timestamps into clean Indonesian layout.
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
window.RSVPTable = RSVPTable;
