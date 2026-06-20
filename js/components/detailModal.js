// js/components/detailModal.js
'use strict';

/**
 * Handles displaying comprehensive details for a clicked RSVP record in a lightbox modal.
 */
class DetailModal {
    constructor({
        modalEl,
        closeBtnEl,
        closeFooterBtnEl,
        nameEl,
        badgeEl,
        countEl,
        messageEl,
        dateEl
    }) {
        this.modal = modalEl;
        this.closeBtn = closeBtnEl;
        this.closeFooterBtn = closeFooterBtnEl;

        this.nameEl = nameEl;
        this.badgeEl = badgeEl;
        this.countEl = countEl;
        this.messageEl = messageEl;
        this.dateEl = dateEl;

        this.bindEvents();
    }

    /**
     * Set up close handlers.
     */
    bindEvents() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        if (this.closeFooterBtn) {
            this.closeFooterBtn.addEventListener('click', () => this.close());
        }
        // Clicking overlay outside the modal content closes it
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }
    }

    /**
     * Populate details and open modal layout.
     * @param {object} rsvp 
     */
    open(rsvp) {
        if (!rsvp) return;

        // Set Name
        if (this.nameEl) {
            this.nameEl.textContent = rsvp.guest_name || '-';
        }

        // Set Attendance Badge
        if (this.badgeEl) {
            const isHadir = rsvp.attendance_status === 'hadir';
            this.badgeEl.className = `badge ${isHadir ? 'badge-hadir' : 'badge-tidak_hadir'}`;
            this.badgeEl.textContent = isHadir ? '🟢 Hadir' : '🔴 Absen';
        }

        // Set Guest Count
        if (this.countEl) {
            this.countEl.textContent = `${rsvp.guest_count || 0} Orang`;
        }

        // Set Message/Greetings
        if (this.messageEl) {
            this.messageEl.textContent = rsvp.message || '-';
        }

        // Set Date
        if (this.dateEl) {
            this.dateEl.textContent = this.formatDate(rsvp.created_at);
        }

        // Show Modal
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.modal.offsetHeight; // force DOM repaint
            this.modal.classList.add('show');
        }
    }

    /**
     * Hide modal overlay.
     */
    close() {
        if (this.modal) {
            this.modal.classList.remove('show');
            setTimeout(() => {
                this.modal.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Formats submission timestamp.
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const options = { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            return `${date.toLocaleDateString('id-ID', options)} WIB`;
        } catch (e) {
            return dateStr;
        }
    }
}

// Bind to window object
window.DetailModal = DetailModal;
