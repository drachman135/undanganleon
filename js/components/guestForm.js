// js/components/guestForm.js
'use strict';

/**
 * Handles guest creation and update modal workflows, validation displays, and auto slug mappings.
 */
class GuestForm {
    constructor({ modalEl, formEl, onSubmit }) {
        this.modal = modalEl;
        this.form = formEl;
        this.onSubmit = onSubmit;

        // Form Inputs
        this.idInput = document.getElementById('form-guest-id');
        this.nameInput = document.getElementById('form-guest-name');
        this.slugInput = document.getElementById('form-guest-slug');
        this.previewInput = document.getElementById('form-guest-url-preview');

        // Error message elements
        this.nameError = document.getElementById('form-guest-name-error');
        this.slugError = document.getElementById('form-guest-slug-error');

        // Controls & triggers
        this.cancelBtn = document.getElementById('btn-modal-cancel-form');
        this.closeBtn = document.getElementById('btn-modal-close-form');
        this.titleEl = document.getElementById('modal-form-title');
        this.saveBtn = document.getElementById('btn-modal-save-form');

        this.isSlugManuallyEdited = false;
        this.bindEvents();
    }

    /**
     * Set up domestic form event listeners.
     */
    bindEvents() {
        if (!this.form) return;

        // Auto-generation of slug while typing name
        this.nameInput.addEventListener('input', (e) => {
            const name = e.target.value;
            this.hideError(this.nameInput, this.nameError);

            if (!this.isSlugManuallyEdited) {
                const autoSlug = LinkGenerator.generateSlug(name);
                this.slugInput.value = autoSlug;
                this.updateUrlPreview(autoSlug);
            }
        });

        // Slug manual edits tracking
        this.slugInput.addEventListener('input', (e) => {
            const rawSlug = e.target.value;
            this.hideError(this.slugInput, this.slugError);

            // Sanitize as they type to make it URL-safe
            const sanitizedSlug = LinkGenerator.generateSlug(rawSlug);
            this.slugInput.value = sanitizedSlug;
            this.isSlugManuallyEdited = true;

            // If user cleared it, reset manual tracking so auto-generation resumes
            if (!rawSlug.trim()) {
                this.isSlugManuallyEdited = false;
            }

            this.updateUrlPreview(sanitizedSlug);
        });

        // Submit form
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });

        // Close triggers
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.close());
        }
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
    }

    /**
     * Validate and dispatch form data.
     */
    async handleSubmit() {
        const id = this.idInput.value || null;
        const name = this.nameInput.value.trim();
        const slug = this.slugInput.value.trim();

        let isValid = true;

        if (!name) {
            this.showError(this.nameInput, this.nameError, 'Nama tidak boleh kosong');
            isValid = false;
        }

        if (!slug) {
            this.showError(this.slugInput, this.slugError, 'Slug tidak boleh kosong');
            isValid = false;
        }

        if (!isValid) return;

        // Disable save button to indicate processing
        if (this.saveBtn) {
            this.saveBtn.disabled = true;
            this.saveBtn.textContent = 'Menyimpan...';
        }

        try {
            // Resolve unique slug dynamically against the DB (resolves budi-santoso-2 etc. if duplicate)
            const finalSlug = await LinkGenerator.resolveUniqueSlugDb(slug, id);
            const invitationUrl = LinkGenerator.generateInvitationUrl(finalSlug);

            const guestPayload = {
                id,
                guest_name: name,
                guest_slug: finalSlug,
                invitation_url: invitationUrl
            };

            if (this.onSubmit) {
                await this.onSubmit(guestPayload);
            }
            
            this.close();
        } catch (error) {
            console.error('Error submitting guest form:', error);
            this.showError(this.slugInput, this.slugError, 'Gagal memvalidasi keunikan slug');
        } finally {
            if (this.saveBtn) {
                this.saveBtn.disabled = false;
                this.saveBtn.textContent = 'Simpan Tamu';
            }
        }
    }

    /**
     * Open form modal for insert or update layout.
     * @param {object|null} guest 
     */
    open(guest = null) {
        this.resetErrors();
        this.isSlugManuallyEdited = false;

        if (guest) {
            // Edit Mode
            this.titleEl.textContent = 'Edit Tamu Undangan';
            this.idInput.value = guest.id || '';
            this.nameInput.value = guest.guest_name || '';
            this.slugInput.value = guest.guest_slug || '';
            this.updateUrlPreview(guest.guest_slug);
            this.isSlugManuallyEdited = true; // prevent automatic editing of slugs
        } else {
            // Create Mode
            this.titleEl.textContent = 'Tambah Tamu Undangan';
            this.idInput.value = '';
            this.nameInput.value = '';
            this.slugInput.value = '';
            this.updateUrlPreview('');
        }

        if (this.modal) {
            this.modal.style.display = 'flex';
            // Force redraw before adding class for smooth transition
            this.modal.offsetHeight;
            this.modal.classList.add('show');

            // Add escape key handler
            this._escHandler = (e) => {
                if (e.key === 'Escape') this.close();
            };
            document.addEventListener('keydown', this._escHandler);
        }
    }

    /**
     * Close modal window.
     */
    close() {
        if (this.modal) {
            this.modal.classList.remove('show');
            // Remove escape key handler
            if (this._escHandler) {
                document.removeEventListener('keydown', this._escHandler);
                this._escHandler = null;
            }
            // Hide after animation finishes
            setTimeout(() => {
                this.modal.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Live update the preview link field value.
     */
    updateUrlPreview(slug) {
        if (this.previewInput) {
            this.previewInput.value = slug ? LinkGenerator.generateInvitationUrl(slug) : '-';
        }
    }

    showError(inputEl, errorEl, message) {
        if (inputEl) inputEl.style.borderColor = 'var(--red)';
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    hideError(inputEl, errorEl) {
        if (inputEl) inputEl.style.borderColor = '';
        if (errorEl) errorEl.style.display = 'none';
    }

    resetErrors() {
        this.hideError(this.nameInput, this.nameError);
        this.hideError(this.slugInput, this.slugError);
    }
}

// Bind to window object
window.GuestForm = GuestForm;
