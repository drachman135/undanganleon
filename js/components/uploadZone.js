// js/components/uploadZone.js
'use strict';

/**
 * Handles the Drag and Drop upload zone, file validation, and file progress rendering.
 */
class UploadZone {
    constructor({ dropZoneEl, fileInputEl, statusListEl, onFilesSelected, onError }) {
        this.dropZone = dropZoneEl;
        this.fileInput = fileInputEl;
        this.statusList = statusListEl;
        this.onFilesSelected = onFilesSelected;
        this.onError = onError;
        
        this.init();
    }
    
    init() {
        if (!this.dropZone || !this.fileInput) return;
        
        // Trigger file picker on zone click
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        
        // Dragover highlights
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
                this.processFiles(e.dataTransfer.files);
            }
        });
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.processFiles(e.target.files);
                this.fileInput.value = ''; // clear value so same file can be selected again
            }
        });
    }
    
    validateFile(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(file.type) && !allowedExts.includes(fileExt)) {
            return {
                isValid: false,
                error: 'Format file tidak didukung' // matches "Format file tidak didukung" error feedback requirement
            };
        }
        
        // Limit size to 5MB
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                isValid: false,
                error: 'Ukuran file terlalu besar' // matches "Ukuran file terlalu besar" error feedback requirement
            };
        }
        
        return { isValid: true, error: null };
    }
    
    processFiles(fileList) {
        const validFiles = [];
        const errors = [];
        
        Array.from(fileList).forEach(file => {
            const validation = this.validateFile(file);
            if (validation.isValid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        });
        
        if (errors.length > 0) {
            if (this.onError) {
                // Return the first error or combined errors
                this.onError(errors.join('\n'));
            }
        }
        
        if (validFiles.length > 0 && this.onFilesSelected) {
            this.onFilesSelected(validFiles);
        }
    }
    
    renderProgress(fileId, name, progress) {
        let statusItem = document.getElementById(`upload-status-${fileId}`);
        if (!statusItem && this.statusList) {
            statusItem = document.createElement('div');
            statusItem.id = `upload-status-${fileId}`;
            statusItem.className = 'upload-status-item';
            statusItem.innerHTML = `
                <div class="upload-status-info" style="flex-direction: column; align-items: flex-start; width: 100%;">
                    <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 4px;">
                        <span class="upload-status-name" style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">${this.escapeHtml(name)}</span>
                        <span class="upload-status-progress" id="upload-progress-percent-${fileId}" style="font-weight: 600; color: var(--gold);">0%</span>
                    </div>
                    <div class="upload-progress-bar-wrapper" style="width: 100%; height: 6px; background-color: rgba(255, 255, 255, 0.08); border-radius: 4px; overflow: hidden;">
                        <div class="upload-progress-bar-fill" id="upload-progress-fill-${fileId}" style="height: 100%; width: 0%; background: linear-gradient(90deg, var(--orange), var(--gold)); border-radius: 4px; transition: width 0.2s ease;"></div>
                    </div>
                </div>
            `;
            this.statusList.appendChild(statusItem);
        }
        
        const fill = document.getElementById(`upload-progress-fill-${fileId}`);
        const percent = document.getElementById(`upload-progress-percent-${fileId}`);
        if (fill && percent) {
            fill.style.width = `${progress}%`;
            percent.textContent = `${progress}%`;
        }
    }
    
    removeProgress(fileId) {
        const statusItem = document.getElementById(`upload-status-${fileId}`);
        if (statusItem) {
            // Fade out animation before removing
            statusItem.style.transition = 'opacity 0.5s ease';
            statusItem.style.opacity = '0';
            setTimeout(() => {
                statusItem.remove();
            }, 500);
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
window.UploadZone = UploadZone;
