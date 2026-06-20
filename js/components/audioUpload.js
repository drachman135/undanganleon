// js/components/audioUpload.js
'use strict';

/**
 * Handles the drag-and-drop zone and click triggers for uploading audio files.
 */
class UploadComponent {
    constructor({ dropZoneEl, fileInputEl, fileBadgeEl, fileNameEl, cancelBtn, progressContainer, progressFill, onFileSelected, onError }) {
        this.dropZone = dropZoneEl;
        this.fileInput = fileInputEl;
        this.fileBadge = fileBadgeEl;
        this.fileName = fileNameEl;
        this.cancelBtn = cancelBtn;
        
        this.progressContainer = progressContainer;
        this.progressFill = progressFill;
        
        this.onFileSelected = onFileSelected;
        this.onError = onError;
        
        this.selectedFile = null;
        
        this.init();
    }
    
    init() {
        if (!this.dropZone || !this.fileInput) return;
        
        // Open file picker on dropzone click
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        
        // Drag over animations
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });
        
        ['dragleave', 'dragend', 'drop'].forEach(type => {
            this.dropZone.addEventListener(type, () => {
                this.dropZone.classList.remove('dragover');
            });
        });
        
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                this.handleFile(e.dataTransfer.files[0]);
            }
        });
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });
        
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.clearSelection());
        }
    }
    
    handleFile(file) {
        // Validate file type & size using validation layer
        const validation = typeof ValidationLayer !== 'undefined' 
            ? ValidationLayer.validateAudio(file) 
            : { isValid: true, error: null };
            
        if (!validation.isValid) {
            if (this.onError) this.onError(validation.error);
            this.fileInput.value = '';
            return;
        }
        
        this.selectedFile = file;
        
        if (this.fileName && this.fileBadge) {
            this.fileName.textContent = `${file.name} (${this.formatBytes(file.size)})`;
            this.fileBadge.style.display = 'flex';
        }
        
        if (this.onFileSelected) {
            this.onFileSelected(file);
        }
    }
    
    clearSelection() {
        this.selectedFile = null;
        this.fileInput.value = '';
        if (this.fileBadge) {
            this.fileBadge.style.display = 'none';
        }
        this.hideProgress();
    }
    
    showProgress(percent) {
        if (this.progressContainer && this.progressFill) {
            this.progressContainer.style.display = 'block';
            this.progressFill.style.width = `${percent}%`;
        }
    }
    
    hideProgress() {
        if (this.progressContainer) {
            this.progressContainer.style.display = 'none';
        }
        if (this.progressFill) {
            this.progressFill.style.width = '0%';
        }
    }
    
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

// Bind to window object
window.UploadComponent = UploadComponent;
