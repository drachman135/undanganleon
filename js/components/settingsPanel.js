// js/components/settingsPanel.js
'use strict';

/**
 * Handles the configuration form controls, label updates, and boundary validations.
 */
class SettingsPanel {
    constructor({ formEl, enabledToggle, volumeSlider, volumeLabel, durationInput, revertBtn, saveBtn, onSettingsChanged }) {
        this.form = formEl;
        this.enabledToggle = enabledToggle;
        this.volumeSlider = volumeSlider;
        this.volumeLabel = volumeLabel;
        this.durationInput = durationInput;
        
        this.revertBtn = revertBtn;
        this.saveBtn = saveBtn;
        
        this.onSettingsChanged = onSettingsChanged;
        
        this.init();
    }
    
    init() {
        if (!this.form) return;
        
        // Setup change triggers
        [this.enabledToggle, this.volumeSlider, this.durationInput].forEach(el => {
            if (el) {
                el.addEventListener('input', () => this.handleInput());
                el.addEventListener('change', () => this.handleInput());
            }
        });
        
        // Setup slider label update
        if (this.volumeSlider && this.volumeLabel) {
            this.volumeSlider.addEventListener('input', (e) => {
                const percent = Math.round(parseFloat(e.target.value) * 100);
                this.volumeLabel.textContent = `${percent}%`;
            });
        }
    }
    
    setValues({ musicEnabled, musicVolume, loadingDuration }) {
        if (this.enabledToggle) this.enabledToggle.checked = !!musicEnabled;
        if (this.volumeSlider) {
            this.volumeSlider.value = musicVolume;
            if (this.volumeLabel) {
                this.volumeLabel.textContent = `${Math.round(musicVolume * 100)}%`;
            }
        }
        if (this.durationInput) this.durationInput.value = loadingDuration;
    }
    
    getValues() {
        return {
            musicEnabled: this.enabledToggle ? this.enabledToggle.checked : false,
            musicVolume: this.volumeSlider ? parseFloat(this.volumeSlider.value) : 0.4,
            loadingDuration: this.durationInput ? parseInt(this.durationInput.value, 10) : 3000
        };
    }
    
    handleInput() {
        let isValid = true;
        const durationError = document.getElementById('loading-duration-error');
        
        if (this.durationInput) {
            const val = parseInt(this.durationInput.value, 10);
            // Validation limits: 2000ms s/d 4000ms
            if (isNaN(val) || val < 2000 || val > 4000) {
                isValid = false;
                if (durationError) {
                    durationError.textContent = 'Durasi harus bernilai antara 2000 md s/d 4000 md.';
                    durationError.style.display = 'block';
                }
                this.durationInput.classList.add('invalid');
            } else {
                if (durationError) {
                    durationError.style.display = 'none';
                }
                this.durationInput.classList.remove('invalid');
            }
        }
        
        if (this.onSettingsChanged) {
            this.onSettingsChanged(this.getValues(), isValid);
        }
    }
    
    setDisabled(isDisabled) {
        if (this.enabledToggle) this.enabledToggle.disabled = isDisabled;
        if (this.volumeSlider) this.volumeSlider.disabled = isDisabled;
        if (this.durationInput) this.durationInput.disabled = isDisabled;
    }
}

// Bind to window object
window.SettingsPanel = SettingsPanel;
