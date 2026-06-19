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
            google_maps_url: 'settings-google-maps-url',
            whatsapp_number: 'settings-whatsapp-number',
            music_enabled: 'settings-music-enabled',
            music_volume: 'settings-music-volume',
            music_volume_val: 'settings-music-volume-val',
            background_music_url: 'settings-background-music-url',
            loading_duration: 'settings-loading-duration',
            theme_color: 'settings-theme-color'
        };
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
        Object.keys(this.fields).forEach(key => {
            const elementId = this.fields[key];
            const el = document.getElementById(elementId);
            if (!el) return;

            if (key === 'music_enabled') {
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

            if (key === 'music_enabled') {
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
            'location_name', 'full_address', 'google_maps_url', 'whatsapp_number', 
            'music_enabled', 'music_volume', 'loading_duration', 'theme_color', 'background_music_url'
        ];

        for (const key of keysToCompare) {
            if (key === 'music_volume') {
                if (Math.abs(current[key] - this.originalSettings[key]) > 0.01) {
                    changed = true;
                    break;
                }
            } else {
                if (String(current[key]) !== String(this.originalSettings[key])) {
                    changed = true;
                    break;
                }
            }
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

            // Send queries update to Supabase
            const updated = await SettingsRepository.updateSettings(targetSettings);

            this.originalSettings = updated;
            this.currentSettings = new InvitationSettings(updated);
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
