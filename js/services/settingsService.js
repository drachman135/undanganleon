// js/services/settingsService.js
'use strict';

/**
 * Service orchestrating settings CMS form logic and bindings.
 */
class SettingsService {
    constructor() {
        this.originalSettings = null;
        this.currentSettings = null;
        this.hasChanges = false;
        
        // Form elements mapping
        this.form = null;
        this.btnSave = null;
        this.skeleton = null;
        this.unsavedBanner = null;

        // Form Fields
        this.fields = {
            cover_title: 'settings-cover-title',
            cover_subtitle: 'settings-cover-subtitle',
            child_name: 'settings-child-name',
            child_age: 'settings-child-age',
            hero_description: 'settings-hero-description',
            event_date: 'settings-event-date',
            start_time: 'settings-start-time',
            end_time: 'settings-end-time',
            location_name: 'settings-location-name',
            full_address: 'settings-full-address',
            event_guide: 'settings-event-guide',
            footer_text: 'settings-footer-text',
            google_maps_url: 'settings-google-maps-url',
            whatsapp_number: 'settings-whatsapp-number',
            music_enabled: 'settings-music-enabled',
            music_volume: 'settings-music-volume',
            music_volume_val: 'settings-music-volume-val',
            background_music_url: 'settings-background-music-url',
            loading_duration: 'settings-loading-duration',
            theme_color: 'settings-theme-color',
            profile_enabled: 'settings-profile-enabled',
            profile_full_name: 'settings-profile-full-name',
            profile_birth_place: 'settings-profile-birth-place',
            profile_birth_date: 'settings-profile-birth-date',
            profile_description: 'settings-profile-description',
            profile_avatar_url: 'settings-profile-avatar-url',
            gallery_title: 'settings-gallery-title',
            gallery_subtitle: 'settings-gallery-subtitle'
        };

        // File upload helper states
        this.avatarFile = null;
        this.avatarLocalUrl = null;
    }

    /**
     * Initialize service, bind listeners and fetch settings from DB.
     */
    async init() {
        this.form = document.getElementById('settings-cms-form');
        this.btnSave = document.getElementById('btn-save-settings');
        this.skeleton = document.getElementById('settings-skeleton');
        this.unsavedBanner = document.getElementById('unsaved-changes-banner');

        if (!this.form) return;

        try {
            this.showLoading(true);

            // Fetch settings from Repository
            const data = await SettingsRepository.getSettings();
            if (!data) {
                throw new Error('Data settings tidak ditemukan.');
            }

            this.originalSettings = data;
            this.currentSettings = new InvitationSettings(data);

            // Bind values to inputs
            this.populateForm(this.currentSettings);

            // Setup change detection event listeners
            this.setupChangeListeners();

            // Setup avatar upload handlers
            this.setupAvatarUploadHandlers();

            // Setup color preset bubbles
            this.setupThemePresets();

            // Setup unsaved navigation guards
            this.setupNavigationGuards();

            // Bind form submit handler
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        } catch (error) {
            console.error('Failed to initialize SettingsService:', error);
            this.showToast('Gagal memuat konfigurasi. Silakan periksa koneksi internet.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Set elements values from settings model object.
     */
    populateForm(settings) {
        // Reset avatar states on populate
        this.avatarFile = null;
        if (this.avatarLocalUrl) {
            URL.revokeObjectURL(this.avatarLocalUrl);
            this.avatarLocalUrl = null;
        }
        const fileInput = document.getElementById('settings-avatar-file-input');
        if (fileInput) fileInput.value = '';

        Object.keys(this.fields).forEach(key => {
            const elementId = this.fields[key];
            const el = document.getElementById(elementId);
            if (!el) return;

            if (key === 'music_enabled' || key === 'profile_enabled') {
                el.checked = !!settings[key];
            } else if (key === 'music_volume') {
                el.value = settings[key];
                const valLabel = document.getElementById(this.fields.music_volume_val);
                if (valLabel) valLabel.textContent = Math.round(settings[key] * 100) + '%';
            } else if (key === 'music_volume_val') {
                // Label skip
            } else {
                el.value = settings[key] || '';
            }
        });

        // Populate avatar preview HTML
        const previewImg = document.getElementById('avatar-preview-image');
        const previewEmoji = document.getElementById('avatar-preview-emoji');
        const btnDelete = document.getElementById('btn-delete-avatar');

        if (previewImg && previewEmoji && btnDelete) {
            if (settings.profile_avatar_url) {
                previewImg.src = settings.profile_avatar_url;
                previewImg.style.display = 'block';
                previewEmoji.style.display = 'none';
                btnDelete.style.display = 'block';
            } else {
                previewImg.src = '';
                previewImg.style.display = 'none';
                previewEmoji.style.display = 'block';
                btnDelete.style.display = 'none';
            }
        }

        // Trigger dynamic theme background color skin on preset selections
        this.updateSelectedPresetBubble(settings.theme_color);
    }

    /**
     * Gather values from HTML form inputs.
     */
    getFormValues() {
        const values = {};
        Object.keys(this.fields).forEach(key => {
            const elementId = this.fields[key];
            const el = document.getElementById(elementId);
            if (!el) return;

            if (key === 'music_enabled' || key === 'profile_enabled') {
                values[key] = el.checked;
            } else if (key === 'music_volume') {
                values[key] = parseFloat(el.value);
            } else if (key === 'music_volume_val') {
                // skip
            } else if (key === 'loading_duration') {
                values[key] = parseInt(el.value, 10);
            } else {
                values[key] = el.value.trim();
            }
        });
        
        // Retain immutable or computed fields
        values.id = this.originalSettings.id;
        values.hero_image_url = this.originalSettings.hero_image_url;
        values.background_music_url = values.background_music_url || this.originalSettings.background_music_url;

        return new InvitationSettings(values);
    }

    /**
     * Bind form change triggers for real-time unsaved changes banner.
     */
    setupChangeListeners() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.detectFormChanges());
            input.addEventListener('change', () => this.detectFormChanges());
        });

        // Volume range input slider specific event listener
        const volumeSlider = document.getElementById(this.fields.music_volume);
        const volumeVal = document.getElementById(this.fields.music_volume_val);
        if (volumeSlider && volumeVal) {
            volumeSlider.addEventListener('input', () => {
                volumeVal.textContent = Math.round(parseFloat(volumeSlider.value) * 100) + '%';
            });
        }
    }

    /**
     * Set dynamic themes pre-select bubble highlights.
     */
    setupThemePresets() {
        const bubbles = document.querySelectorAll('.theme-preset-bubble');
        const colorInput = document.getElementById(this.fields.theme_color);

        bubbles.forEach(bubble => {
            bubble.addEventListener('click', () => {
                const colorValue = bubble.getAttribute('data-color');
                if (colorInput) {
                    colorInput.value = colorValue;
                    // Trigger input event to update detection
                    colorInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                this.updateSelectedPresetBubble(colorValue);
            });
        });

        if (colorInput) {
            colorInput.addEventListener('input', () => {
                this.updateSelectedPresetBubble(colorInput.value);
            });
        }
    }

    /**
     * Highlight bubble if current color matches preset.
     */
    updateSelectedPresetBubble(hexColor) {
        const bubbles = document.querySelectorAll('.theme-preset-bubble');
        bubbles.forEach(bubble => {
            const presetColor = bubble.getAttribute('data-color');
            if (presetColor.toLowerCase() === hexColor.toLowerCase()) {
                bubble.classList.add('active');
            } else {
                bubble.classList.remove('active');
            }
        });
    }

    /**
     * Check if form details differ from original DB loaded values.
     */
    detectFormChanges() {
        const current = this.getFormValues();
        
        let changed = false;
        // Fields to compare
        const keysToCompare = [
            'cover_title', 'cover_subtitle', 'child_name', 'child_age', 
            'hero_description', 'event_date', 'start_time', 'end_time', 
            'location_name', 'full_address', 'event_guide', 'footer_text', 'google_maps_url', 'whatsapp_number', 
            'music_enabled', 'music_volume', 'loading_duration', 'theme_color', 'background_music_url',
            'profile_enabled', 'profile_full_name', 'profile_birth_place', 'profile_birth_date', 'profile_description',
            'profile_avatar_url'
        ];

        for (const key of keysToCompare) {
            if (key === 'music_volume') {
                if (Math.abs(current[key] - this.originalSettings[key]) > 0.01) {
                    changed = true;
                    break;
                }
            } else {
                if (String(current[key] || '') !== String(this.originalSettings[key] || '')) {
                    changed = true;
                    break;
                }
            }
        }

        if (this.avatarFile !== null) {
            changed = true;
        }

        this.hasChanges = changed;
        this.currentSettings = current;

        // Toggle warning banner
        if (this.hasChanges) {
            this.unsavedBanner.classList.add('show');
        } else {
            this.unsavedBanner.classList.remove('show');
        }
    }

    /**
     * Block navigation if unsaved changes exist.
     */
    setupNavigationGuards() {
        window.addEventListener('beforeunload', (e) => {
            if (this.hasChanges) {
                e.preventDefault();
                e.returnValue = 'Perubahan belum disimpan';
                return 'Perubahan belum disimpan';
            }
        });
    }

    /**
     * Bind click and change listeners for the profile avatar upload field.
     */
    setupAvatarUploadHandlers() {
        this.avatarFileInput = document.getElementById('settings-avatar-file-input');
        this.avatarUrlInput = document.getElementById('settings-profile-avatar-url');
        this.btnSelectAvatar = document.getElementById('btn-select-avatar');
        this.btnDeleteAvatar = document.getElementById('btn-delete-avatar');
        this.avatarPreviewEmoji = document.getElementById('avatar-preview-emoji');
        this.avatarPreviewImage = document.getElementById('avatar-preview-image');

        if (!this.avatarFileInput || !this.btnSelectAvatar) return;

        // Trigger file input click
        this.btnSelectAvatar.addEventListener('click', () => {
            this.avatarFileInput.click();
        });

        // Handle file selection
        this.avatarFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file size (max 2 MB)
            if (file.size > 2 * 1024 * 1024) {
                this.showToast('Ukuran foto profil maksimal 2 MB!', 'error');
                this.avatarFileInput.value = '';
                return;
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                this.showToast('Format foto harus JPG, PNG, atau WEBP!', 'error');
                this.avatarFileInput.value = '';
                return;
            }

            this.avatarFile = file;

            // Revoke old local object URL if exists
            if (this.avatarLocalUrl) {
                URL.revokeObjectURL(this.avatarLocalUrl);
            }

            this.avatarLocalUrl = URL.createObjectURL(file);
            
            // Render local preview
            if (this.avatarPreviewImage) {
                this.avatarPreviewImage.src = this.avatarLocalUrl;
                this.avatarPreviewImage.style.display = 'block';
            }
            if (this.avatarPreviewEmoji) {
                this.avatarPreviewEmoji.style.display = 'none';
            }
            if (this.btnDeleteAvatar) {
                this.btnDeleteAvatar.style.display = 'block';
            }

            this.detectFormChanges();
        });

        // Handle file deletion (reset to emoji)
        if (this.btnDeleteAvatar) {
            this.btnDeleteAvatar.addEventListener('click', () => {
                this.avatarFile = null;
                if (this.avatarLocalUrl) {
                    URL.revokeObjectURL(this.avatarLocalUrl);
                    this.avatarLocalUrl = null;
                }
                this.avatarFileInput.value = '';

                if (this.avatarUrlInput) {
                    this.avatarUrlInput.value = '';
                }

                if (this.avatarPreviewImage) {
                    this.avatarPreviewImage.src = '';
                    this.avatarPreviewImage.style.display = 'none';
                }
                if (this.avatarPreviewEmoji) {
                    this.avatarPreviewEmoji.style.display = 'block';
                }
                this.btnDeleteAvatar.style.display = 'none';

                this.detectFormChanges();
            });
        }
    }

    /**
     * Show loader templates.
     */
    showLoading(isLoading) {
        if (isLoading) {
            this.skeleton.style.display = 'block';
            this.form.style.display = 'none';
        } else {
            this.skeleton.style.display = 'none';
            this.form.style.display = 'block';
        }
    }

    /**
     * Save form handler.
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        // Remove old error highlights
        this.clearValidationErrors();

        // Get latest model state
        const targetSettings = this.getFormValues();

        // Validate values
        const validation = SettingsValidator.validate(targetSettings);
        if (!validation.isValid) {
            this.displayValidationErrors(validation.errors);
            this.showToast('Periksa kembali input form Anda!', 'error');
            return;
        }

        try {
            this.btnSave.disabled = true;
            this.btnSave.textContent = 'Menyimpan...';

            // 1. Upload new avatar if selected
            if (this.avatarFile) {
                const timestamp = Date.now();
                const fileExt = this.avatarFile.name.split('.').pop();
                const filePath = `profile_avatar_${timestamp}.${fileExt}`;

                // Upload to bucket 'hero-images'
                const publicUrl = await StorageService.uploadFile('hero-images', filePath, this.avatarFile);
                targetSettings.profile_avatar_url = publicUrl;

                // Clean up old avatar if there was one
                if (this.originalSettings.profile_avatar_url && this.originalSettings.profile_avatar_url.includes('/hero-images/')) {
                    await StorageService.deleteFile('hero-images', this.originalSettings.profile_avatar_url);
                }

                // Revoke selected local object URL
                if (this.avatarLocalUrl) {
                    URL.revokeObjectURL(this.avatarLocalUrl);
                    this.avatarLocalUrl = null;
                }
                this.avatarFile = null;
                const fileInput = document.getElementById('settings-avatar-file-input');
                if (fileInput) fileInput.value = '';
            } 
            // 2. Delete file if avatar was deleted by admin
            else if (!targetSettings.profile_avatar_url && this.originalSettings.profile_avatar_url) {
                if (this.originalSettings.profile_avatar_url.includes('/hero-images/')) {
                    await StorageService.deleteFile('hero-images', this.originalSettings.profile_avatar_url);
                }
                targetSettings.profile_avatar_url = null;
            }

            // Send queries update to Supabase
            const updated = await SettingsRepository.updateSettings(targetSettings);

            this.originalSettings = updated;
            this.currentSettings = new InvitationSettings(updated);

            // Re-populate values and reset helper states
            this.populateForm(this.currentSettings);

            this.hasChanges = false;
            this.unsavedBanner.classList.remove('show');

            this.showToast('Perubahan berhasil disimpan', 'success');

        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showToast('Gagal menyimpan data. Periksa koneksi internet.', 'error');
        } finally {
            this.btnSave.disabled = false;
            this.btnSave.textContent = 'Simpan Konfigurasi';
        }
    }

    /**
     * Remove all previous red helper text elements.
     */
    clearValidationErrors() {
        const errorMsgs = this.form.querySelectorAll('.error-msg');
        errorMsgs.forEach(msg => {
            msg.textContent = '';
            msg.style.display = 'none';
        });

        const inputs = this.form.querySelectorAll('.form-input, textarea, input');
        inputs.forEach(input => {
            input.classList.remove('invalid');
        });
    }

    /**
     * Map model validation error strings to specific form field helpers.
     */
    displayValidationErrors(errors) {
        Object.keys(errors).forEach(key => {
            const elementId = this.fields[key];
            const inputEl = document.getElementById(elementId);
            if (inputEl) {
                inputEl.classList.add('invalid');
            }

            const errorLabel = document.getElementById(`${elementId}-error`);
            if (errorLabel) {
                errorLabel.textContent = errors[key];
                errorLabel.style.display = 'block';
            }
        });
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

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Only run if we are on the settings page
    if (document.getElementById('settings-cms-form')) {
        const settingsService = new SettingsService();
        settingsService.init();
        window.settingsService = settingsService;
    }
});
