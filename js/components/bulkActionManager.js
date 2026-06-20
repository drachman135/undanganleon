// js/components/bulkActionManager.js
'use strict';

/**
 * Manages bulk select states, select all checkboxes, selection counter updates, and bulk delete dispatching.
 */
class BulkActionManager {
    constructor({ selectAllChk, selectAllLabel, bulkDeleteBtn, selectedCountEl, gridContainerEl, onBulkDelete }) {
        this.selectAllChk = selectAllChk;
        this.selectAllLabel = selectAllLabel;
        this.bulkDeleteBtn = bulkDeleteBtn;
        this.selectedCountEl = selectedCountEl;
        this.gridContainer = gridContainerEl;
        this.onBulkDelete = onBulkDelete;
        
        this.init();
    }
    
    init() {
        if (!this.selectAllChk || !this.bulkDeleteBtn) return;
        
        // Select all listener
        this.selectAllChk.addEventListener('change', () => {
            const isChecked = this.selectAllChk.checked;
            const checkboxes = this.gridContainer.querySelectorAll('.card-select-chk');
            
            checkboxes.forEach(chk => {
                chk.checked = isChecked;
            });
            
            this.updateSelectionState();
        });
        
        // Bulk delete listener
        this.bulkDeleteBtn.addEventListener('click', () => {
            const selectedIds = this.getSelectedIds();
            if (selectedIds.length > 0 && this.onBulkDelete) {
                this.onBulkDelete(selectedIds);
            }
        });
    }
    
    /**
     * Call this when individual checkboxes change or when grid re-renders.
     */
    updateSelectionState() {
        const checkboxes = Array.from(this.gridContainer.querySelectorAll('.card-select-chk'));
        const totalCount = checkboxes.length;
        const selectedCount = checkboxes.filter(chk => chk.checked).length;
        
        // Update label count
        if (this.selectedCountEl) {
            this.selectedCountEl.textContent = selectedCount;
        }
        
        // Update Select All checkbox state
        if (this.selectAllChk) {
            this.selectAllChk.checked = totalCount > 0 && selectedCount === totalCount;
            // Indeterminate state if some but not all selected
            this.selectAllChk.indeterminate = selectedCount > 0 && selectedCount < totalCount;
        }
        
        // Toggle visibility of Bulk Controls
        if (totalCount > 0) {
            if (this.selectAllLabel) this.selectAllLabel.style.display = 'flex';
            if (this.bulkDeleteBtn) this.bulkDeleteBtn.style.display = 'inline-flex';
        } else {
            if (this.selectAllLabel) this.selectAllLabel.style.display = 'none';
            if (this.bulkDeleteBtn) this.bulkDeleteBtn.style.display = 'none';
        }
        
        // Enable/Disable bulk delete button
        if (this.bulkDeleteBtn) {
            this.bulkDeleteBtn.disabled = selectedCount === 0;
        }
    }
    
    getSelectedIds() {
        const checkboxes = Array.from(this.gridContainer.querySelectorAll('.card-select-chk'));
        return checkboxes
            .filter(chk => chk.checked)
            .map(chk => chk.getAttribute('data-id'));
    }
    
    reset() {
        if (this.selectAllChk) {
            this.selectAllChk.checked = false;
            this.selectAllChk.indeterminate = false;
        }
        this.updateSelectionState();
    }
}

// Bind to window object
window.BulkActionManager = BulkActionManager;
