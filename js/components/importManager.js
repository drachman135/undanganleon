// js/components/importManager.js
'use strict';

/**
 * Manages the bulk import workflow, file uploads (CSV/TXT), textarea parsing, and import metrics.
 */
class ImportManager {
    constructor({
        toggleBtnEl,
        panelEl,
        dropzoneEl,
        fileInputEl,
        pasteAreaEl,
        processBtnEl,
        clearBtnEl,
        summaryPanelEl,
        countsEls, // { totalEl, successEl, failedEl, duplicateEl }
        onImportTriggered
    }) {
        this.toggleBtn = toggleBtnEl;
        this.panel = panelEl;
        this.dropzone = dropzoneEl;
        this.fileInput = fileInputEl;
        this.pasteArea = pasteAreaEl;
        this.processBtn = processBtnEl;
        this.clearBtn = clearBtnEl;
        this.summaryPanel = summaryPanelEl;
        this.counts = countsEls;
        this.onImportTriggered = onImportTriggered;

        this.bindEvents();
    }

    /**
     * Bind DOM events.
     */
    bindEvents() {
        // Toggle panel display
        if (this.toggleBtn && this.panel) {
            this.toggleBtn.addEventListener('click', () => {
                const isHidden = window.getComputedStyle(this.panel).display === 'none';
                if (isHidden) {
                    this.panel.style.display = 'block';
                    this.toggleBtn.innerHTML = '📤 Sembunyikan Impor';
                    this.toggleBtn.classList.remove('btn-secondary');
                    this.toggleBtn.classList.add('btn-primary');
                } else {
                    this.panel.style.display = 'none';
                    this.toggleBtn.innerHTML = '📥 Impor Massal';
                    this.toggleBtn.classList.remove('btn-primary');
                    this.toggleBtn.classList.add('btn-secondary');
                }
            });
        }

        // File dropzone clicks to trigger input click
        if (this.dropzone && this.fileInput) {
            this.dropzone.addEventListener('click', () => this.fileInput.click());

            // Dragover highlights
            this.dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.dropzone.classList.add('dragover');
            });

            ['dragleave', 'dragend', 'drop'].forEach(type => {
                this.dropzone.addEventListener(type, () => {
                    this.dropzone.classList.remove('dragover');
                });
            });

            this.dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    this.handleFileSelected(e.dataTransfer.files[0]);
                }
            });

            this.fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFileSelected(e.target.files[0]);
                }
            });
        }

        // Clear button
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clear());
        }

        // Process button
        if (this.processBtn) {
            this.processBtn.addEventListener('click', () => this.processImport());
        }
    }

    /**
     * Reads and parses TXT/CSV selected files, populating the textarea box.
     */
    handleFileSelected(file) {
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (fileExt !== 'csv' && fileExt !== 'txt') {
            alert('Format file tidak didukung! Harap unggah file .csv atau .txt.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            let names = [];
            
            if (fileExt === 'csv') {
                names = this.parseCsv(text);
            } else {
                names = this.parseTxt(text);
            }

            if (names.length === 0) {
                alert('Tidak ditemukan nama tamu di dalam file.');
                return;
            }

            // Append or overwrite textarea
            const existingText = this.pasteArea.value.trim();
            const delimiter = existingText ? '\n' : '';
            this.pasteArea.value = existingText + delimiter + names.join('\n');
            this.pasteArea.focus();
        };
        reader.readAsText(file);
    }

    /**
     * Parses simple text file content (one name per line).
     */
    parseTxt(text) {
        return text
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    /**
     * Parses CSV files dynamically with smart headers detect and quote escapes.
     */
    parseCsv(text) {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
        if (lines.length === 0) return [];
        
        // Find best column separator
        const delimiters = [',', ';', '\t'];
        let delimiter = ',';
        let maxCols = 0;
        
        delimiters.forEach(d => {
            const cols = lines[0].split(d);
            if (cols.length > maxCols) {
                maxCols = cols.length;
                delimiter = d;
            }
        });
        
        const firstLineCols = lines[0].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim().toLowerCase());
        
        // Check for columns matching guest name tags
        let nameColIdx = 0;
        const nameKeywords = ['nama', 'name', 'guest', 'tamu', 'fullname'];
        let headerExists = false;
        
        for (let i = 0; i < firstLineCols.length; i++) {
            if (nameKeywords.some(kw => firstLineCols[i].includes(kw))) {
                nameColIdx = i;
                headerExists = true;
                break;
            }
        }
        
        const names = [];
        const startLine = headerExists ? 1 : 0;
        
        for (let i = startLine; i < lines.length; i++) {
            const rowCols = lines[i].split(delimiter);
            if (rowCols[nameColIdx] !== undefined) {
                const name = rowCols[nameColIdx].replace(/^["']|["']$/g, '').trim();
                if (name) names.push(name);
            }
        }
        
        return names;
    }

    /**
     * Read names list from textarea and invoke trigger callback.
     */
    async processImport() {
        const text = this.pasteArea.value.trim();
        if (!text) {
            alert('Harap tempelkan daftar nama atau unggah file terlebih dahulu.');
            return;
        }

        const names = text
            .split(/\r?\n/)
            .map(n => n.trim())
            .filter(n => n.length > 0);

        if (names.length === 0) {
            alert('Tidak ditemukan nama yang valid untuk diimpor.');
            return;
        }

        if (this.processBtn) {
            this.processBtn.disabled = true;
            this.processBtn.textContent = 'Memproses...';
        }

        try {
            if (this.onImportTriggered) {
                await this.onImportTriggered(names);
            }
        } catch (e) {
            console.error('Import failed:', e);
            alert('Terjadi kesalahan saat memproses impor tamu.');
        } finally {
            if (this.processBtn) {
                this.processBtn.disabled = false;
                this.processBtn.textContent = 'Proses Impor Tamu';
            }
        }
    }

    /**
     * Show import summary details panel.
     */
    showSummary({ total, success, failed, duplicates }) {
        if (!this.summaryPanel) return;
        this.summaryPanel.style.display = 'block';

        if (this.counts.totalEl) this.counts.totalEl.textContent = total;
        if (this.counts.successEl) this.counts.successEl.textContent = success;
        if (this.counts.failedEl) this.counts.failedEl.textContent = failed;
        if (this.counts.duplicateEl) this.counts.duplicateEl.textContent = duplicates;
    }

    /**
     * Reset inputs and fields.
     */
    clear() {
        if (this.pasteArea) this.pasteArea.value = '';
        if (this.fileInput) this.fileInput.value = '';
        if (this.summaryPanel) this.summaryPanel.style.display = 'none';
    }
}

// Bind to window object
window.ImportManager = ImportManager;
