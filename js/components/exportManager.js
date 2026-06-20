// js/components/exportManager.js
'use strict';

/**
 * Manages exporting RSVP data to CSV and Microsoft Excel (.xlsx) files.
 * Dynamically lazy-loads SheetJS library on-demand to optimize initial load times.
 */
class ExportManager {
    constructor({
        toggleBtnEl,
        panelEl,
        cancelBtnEl,
        processBtnEl,
        formatRadioName,
        filterSelectEl,
        onExportDataNeeded,
        onShowToast
    }) {
        this.toggleBtn = toggleBtnEl;
        this.panel = panelEl;
        this.cancelBtn = cancelBtnEl;
        this.processBtn = processBtnEl;
        this.formatRadioName = formatRadioName;
        this.filterSelect = filterSelectEl;
        this.onExportDataNeeded = onExportDataNeeded;
        this.onShowToast = onShowToast;

        this.bindEvents();
    }

    /**
     * Bind click and change triggers.
     */
    bindEvents() {
        if (this.toggleBtn && this.panel) {
            this.toggleBtn.addEventListener('click', () => {
                const isHidden = window.getComputedStyle(this.panel).display === 'none';
                if (isHidden) {
                    this.panel.style.display = 'block';
                    this.toggleBtn.innerHTML = '📤 Sembunyikan Ekspor';
                    this.toggleBtn.classList.remove('btn-secondary');
                    this.toggleBtn.classList.add('btn-primary');
                } else {
                    this.panel.style.display = 'none';
                    this.toggleBtn.innerHTML = '📤 Ekspor RSVP';
                    this.toggleBtn.classList.remove('btn-primary');
                    this.toggleBtn.classList.add('btn-secondary');
                }
            });
        }

        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.close());
        }

        if (this.processBtn) {
            this.processBtn.addEventListener('click', () => this.handleExport());
        }
    }

    /**
     * Close the expandable panel.
     */
    close() {
        if (this.panel) {
            this.panel.style.display = 'none';
        }
        if (this.toggleBtn) {
            this.toggleBtn.innerHTML = '📤 Ekspor RSVP';
            this.toggleBtn.classList.remove('btn-primary');
            this.toggleBtn.classList.add('btn-secondary');
        }
    }

    /**
     * Collect data, apply formats, and download files.
     */
    async handleExport() {
        if (!this.onExportDataNeeded) return;

        const formatEl = document.querySelector(`input[name="${this.formatRadioName}"]:checked`);
        const format = formatEl ? formatEl.value : 'xlsx';
        const filterVal = this.filterSelect ? this.filterSelect.value : 'all';

        // Set Loading state on process button
        if (this.processBtn) {
            this.processBtn.disabled = true;
            this.processBtn.textContent = 'Mengekspor...';
        }

        try {
            // Get full source data
            const rawData = await this.onExportDataNeeded();
            
            // Filter based on export preference
            let exportData = [...rawData];
            if (filterVal !== 'all') {
                exportData = exportData.filter(r => r.attendance_status === filterVal);
            }

            if (exportData.length === 0) {
                this.showToast('Tidak ada data rsvp untuk diekspor pada filter terpilih.', 'error');
                return;
            }

            // Map and format rows for spreadsheet presentation
            const formattedRows = exportData.map(r => ({
                'Nama Tamu': r.guest_name,
                'Status Kehadiran': r.attendance_status === 'hadir' ? 'Hadir' : 'Tidak Hadir',
                'Jumlah Tamu': r.guest_count || 0,
                'Pesan Ucapan': r.message || '-',
                'Tanggal Kirim': this.formatTimestamp(r.created_at)
            }));

            const timestampFilename = new Date().toISOString().slice(0,10);
            const filename = `rsvp_report_${filterVal}_${timestampFilename}`;

            if (format === 'csv') {
                this.exportToCSV(formattedRows, `${filename}.csv`);
            } else {
                await this.exportToExcel(formattedRows, `${filename}.xlsx`);
            }

            this.showToast('Data berhasil diekspor! 📥', 'success');
            this.close();

        } catch (e) {
            console.error('Export failed:', e);
            this.showToast('Gagal mengekspor data.', 'error');
        } finally {
            if (this.processBtn) {
                this.processBtn.disabled = false;
                this.processBtn.textContent = 'Unduh Berkas';
            }
        }
    }

    /**
     * Compiles JSON rows into CSV file format.
     */
    exportToCSV(rows, filename) {
        const headers = Object.keys(rows[0]);
        const csvContent = [];
        
        // Push Header row
        csvContent.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

        // Push Data rows
        rows.forEach(row => {
            const values = headers.map(header => {
                const val = String(row[header] || '');
                return `"${val.replace(/"/g, '""')}"`;
            });
            csvContent.push(values.join(','));
        });

        // Add UTF-8 BOM so Excel opens special symbols correctly
        const blob = new Blob(['\uFEFF' + csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
        
        // Trigger client download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Compile JSON rows into Excel file format using SheetJS (lazy-loaded).
     */
    async exportToExcel(rows, filename) {
        // Load SheetJS from CDN dynamically if not present
        if (typeof XLSX === 'undefined') {
            await this.loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
        }

        if (typeof XLSX === 'undefined') {
            throw new Error('Gagal memuat library Excel ekspor (SheetJS)');
        }

        // Convert array of objects to worksheet
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        
        // Append worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'RSVP Submissions');
        
        // Auto-fit columns width
        const colWidths = Object.keys(rows[0]).map(header => {
            const headerLen = header.length;
            const maxValLen = rows.reduce((max, row) => {
                const val = String(row[header] || '');
                return Math.max(max, val.length);
            }, 0);
            return { wch: Math.max(headerLen, maxValLen) + 3 };
        });
        worksheet['!cols'] = colWidths;

        // Trigger SheetJS file download
        XLSX.writeFile(workbook, filename);
    }

    /**
     * Appends a script tag dynamically to head and waits for resolution.
     */
    loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    formatTimestamp(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return `${date.toLocaleDateString('id-ID')} ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
        } catch (e) {
            return dateStr;
        }
    }

    showToast(message, type = 'success') {
        if (this.onShowToast) {
            this.onShowToast(message, type);
        } else {
            alert(message);
        }
    }
}

// Bind to window object
window.ExportManager = ExportManager;
