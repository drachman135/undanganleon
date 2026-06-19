// js/services/heroService.js
'use strict';

/**
 * Service orchestrating the Hero Image CMS operations.
 */
class HeroService {
    constructor() {
        this.originalImageUrl = null;
        this.currentImageUrl = null;
        this.selectedFile = null;
        this.selectedLocalUrl = null;
        this.hasChanges = false;

        // UI references
        this.previewContainer = null;
        this.dropZone = null;
        this.fileInput = null;
        this.btnSave = null;
        this.btnDelete = null;
        this.btnCancel = null;
        
        this.progressContainer = null;
        this.progressFill = null;
        this.unsavedBanner = null;
        this.fileInfo = null;
        this.fileNameLabel = null;
    }

    /**
     * Initialize service, query database settings, and bind hooks.
     */
    async init() {
        this.previewContainer = document.getElementById('hero-preview-container');
        this.dropZone = document.getElementById('hero-drop-zone');
        this.fileInput = document.getElementById('hero-file-input');
        this.btnSave = document.getElementById('btn-save-hero');
        this.btnDelete = document.getElementById('btn-delete-hero');
        this.btnCancel = document.getElementById('btn-cancel-hero');
        
        this.progressContainer = document.getElementById('hero-progress-container');
        this.progressFill = document.getElementById('hero-progress-fill');
        this.unsavedBanner = document.getElementById('unsaved-changes-banner');
        this.fileInfo = document.getElementById('hero-file-info');
        this.fileNameLabel = document.getElementById('hero-file-name-label');

        if (!this.previewContainer) return;

        try {
            this.showGlobalLoading(true);

            // Fetch settings configuration
            const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
            if (!supabase) throw new Error('Supabase client failed to initialize');

            const { data, error } = await supabase
                .from('invitation_settings')
                .select('hero_image_url')
                .eq('id', 1)
                .single();

            if (error) throw error;

            this.originalImageUrl = data ? data.hero_image_url : null;
            this.currentImageUrl = this.originalImageUrl;

            // Render current preview
            ImagePreviewComponent.render(this.previewContainer, this.originalImageUrl);

            // Setup drop hooks
            useImageUpload({
                dropZoneEl: this.dropZone,
                fileInputEl: this.fileInput,
                onFileSelected: (file) => this.handleFileSelected(file),
                onError: (errMessage) => this.showToast(errMessage, 'error')
            });

            // Bind click listeners
            this.btnSave.addEventListener('click', () => this.handleSave());
            this.btnDelete.addEventListener('click', () => this.handleDelete());
            if (this.btnCancel) {
                this.btnCancel.addEventListener('click', () => this.handleCancel());
            }

            // Bind unload navigation alert
            window.addEventListener('beforeunload', (e) => {
                if (this.hasChanges) {
                    e.preventDefault();
                    e.returnValue = 'Perubahan belum disimpan';
                    return 'Perubahan belum disimpan';
                }
            });

        } catch (e) {
            console.error('Failed to initialize HeroService:', e);
            this.showToast('Gagal memuat detail gambar hero.', 'error');
        } finally {
            this.showGlobalLoading(false);
        }
    }

    /**
     * Set file selection details and trigger local previews.
     */
    handleFileSelected(file) {
        this.selectedFile = file;

        // Revoke old local object URL if exists
        if (this.selectedLocalUrl) {
            URL.revokeObjectURL(this.selectedLocalUrl);
        }

        // Create temporary object URL for browser preview
        this.selectedLocalUrl = URL.createObjectURL(file);
        this.currentImageUrl = this.selectedLocalUrl;

        // Render preview
        ImagePreviewComponent.render(this.previewContainer, this.selectedLocalUrl);

        // Show selected filename
        if (this.fileNameLabel && this.fileInfo) {
            this.fileNameLabel.textContent = `${file.name} (${this.formatBytes(file.size)})`;
            this.fileInfo.style.display = 'flex';
        }

        this.detectStateChanges();
    }

    /**
     * Mark image for deletion (clear DB URL to null).
     */
    handleDelete() {
        this.selectedFile = null;
        if (this.selectedLocalUrl) {
            URL.revokeObjectURL(this.selectedLocalUrl);
            this.selectedLocalUrl = null;
        }

        if (this.fileInput) this.fileInput.value = '';

        this.currentImageUrl = null;
        ImagePreviewComponent.render(this.previewContainer, null);

        if (this.fileInfo) this.fileInfo.style.display = 'none';

        this.detectStateChanges();
        this.showToast('Gambar hero dihapus dari pratinjau. Simpan untuk menerapkan.', 'success');
    }

    /**
     * Restore back to original db image state.
     */
    handleCancel() {
        this.selectedFile = null;
        if (this.selectedLocalUrl) {
            URL.revokeObjectURL(this.selectedLocalUrl);
            this.selectedLocalUrl = null;
        }

        if (this.fileInput) this.fileInput.value = '';

        this.currentImageUrl = this.originalImageUrl;
        ImagePreviewComponent.render(this.previewContainer, this.originalImageUrl);

        if (this.fileInfo) this.fileInfo.style.display = 'none';

        this.detectStateChanges();
        this.showToast('Perubahan dibatalkan.', 'success');
    }

    /**
     * Check if current layout differs from original DB details.
     */
    detectStateChanges() {
        // If there's a selected file, state has changed
        let changed = false;
        if (this.selectedFile) {
            changed = true;
        } else if (this.currentImageUrl !== this.originalImageUrl) {
            // covers deletion (original was something, current is null)
            changed = true;
        }

        this.hasChanges = changed;

        // Toggle sticky alert banner
        if (this.hasChanges) {
            this.unsavedBanner.classList.add('show');
            if (this.btnCancel) this.btnCancel.style.display = 'inline-flex';
        } else {
            this.unsavedBanner.classList.remove('show');
            if (this.btnCancel) this.btnCancel.style.display = 'none';
        }
    }

    /**
     * Upload asset to storage and persist URL back to settings database.
     */
    async handleSave() {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) return;

        try {
            this.toggleFormDisabled(true);
            let finalImageUrl = this.currentImageUrl;

            // 1. Upload new image if selected
            if (this.selectedFile) {
                if (this.progressContainer && this.progressFill) {
                    this.progressContainer.style.display = 'block';
                    this.progressFill.style.width = '15%';
                }

                const timestamp = Date.now();
                const fileExt = this.selectedFile.name.split('.').pop();
                const filePath = `hero_image_${timestamp}.${fileExt}`;

                if (this.progressFill) this.progressFill.style.width = '45%';

                // Upload to bucket 'hero-images'
                const publicUrl = await StorageService.uploadFile('hero-images', filePath, this.selectedFile);
                finalImageUrl = publicUrl;

                if (this.progressFill) this.progressFill.style.width = '80%';

                // Clean up old image if there was one
                if (this.originalImageUrl && this.originalImageUrl.includes('/hero-images/')) {
                    await StorageService.deleteFile('hero-images', this.originalImageUrl);
                }

                // Revoke selected local object URL
                if (this.selectedLocalUrl) {
                    URL.revokeObjectURL(this.selectedLocalUrl);
                    this.selectedLocalUrl = null;
                }
                this.selectedFile = null;
                if (this.fileInput) this.fileInput.value = '';
            } 
            // 2. Delete file if current image is null
            else if (this.currentImageUrl === null && this.originalImageUrl) {
                if (this.originalImageUrl.includes('/hero-images/')) {
                    await StorageService.deleteFile('hero-images', this.originalImageUrl);
                }
                finalImageUrl = null;
            }

            if (this.progressFill) this.progressFill.style.width = '95%';

            // 3. Save final url inside settings table row 1
            const { error: dbError } = await supabase
                .from('invitation_settings')
                .update({
                    hero_image_url: finalImageUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1);

            if (dbError) throw dbError;

            if (this.progressFill) this.progressFill.style.width = '100%';

            this.originalImageUrl = finalImageUrl;
            this.currentImageUrl = finalImageUrl;
            this.hasChanges = false;
            this.unsavedBanner.classList.remove('show');
            if (this.btnCancel) this.btnCancel.style.display = 'none';
            if (this.fileInfo) this.fileInfo.style.display = 'none';

            setTimeout(() => {
                if (this.progressContainer) this.progressContainer.style.display = 'none';
            }, 800);

            // Re-render
            ImagePreviewComponent.render(this.previewContainer, finalImageUrl);

            this.showToast('Hero image berhasil diperbarui', 'success');

        } catch (error) {
            console.error('Failed to save hero settings:', error);
            this.showToast('Gagal mengunggah gambar. Periksa koneksi internet.', 'error');
            if (this.progressContainer) this.progressContainer.style.display = 'none';
        } finally {
            this.toggleFormDisabled(false);
        }
    }

    /**
     * Disable/Enable form operations.
     */
    toggleFormDisabled(isDisabled) {
        this.btnSave.disabled = isDisabled;
        this.btnDelete.disabled = isDisabled;
        if (this.btnCancel) this.btnCancel.disabled = isDisabled;
        this.btnSave.textContent = isDisabled ? 'Menyimpan...' : 'Simpan Hero Image';
    }

    /**
     * Show full loader template.
     */
    showGlobalLoading(isLoading) {
        const skeleton = document.getElementById('hero-skeleton');
        const content = document.getElementById('hero-cms-panel');
        if (!skeleton || !content) return;

        if (isLoading) {
            skeleton.style.display = 'block';
            content.style.display = 'none';
        } else {
            skeleton.style.display = 'none';
            content.style.display = 'block';
        }
    }

    /**
     * Format file size.
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Trigger Toast popups.
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        const text = document.getElementById('toast-message');

        if (!toast || !icon || !text) return;

        toast.className = 'toast show ' + type;
        icon.textContent = type === 'success' ? '✓' : '✗';
        text.textContent = message;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('hero-cms-panel')) {
        const heroService = new HeroService();
        heroService.init();
        window.heroService = heroService;
    }
});
