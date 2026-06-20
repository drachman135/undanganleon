// js/components/dragDropManager.js
'use strict';

/**
 * Orchestrates SortableJS drag-and-drop bindings on the gallery grid container.
 */
class DragDropManager {
    constructor({ gridEl, dragHandleClass, onOrderChanged }) {
        this.grid = gridEl;
        this.dragHandleClass = dragHandleClass;
        this.onOrderChanged = onOrderChanged;
        this.sortable = null;
    }
    
    init() {
        if (!this.grid || typeof Sortable === 'undefined') {
            console.warn('SortableJS is not loaded or grid element is missing.');
            return;
        }
        
        // Create sortable instance
        this.sortable = new Sortable(this.grid, {
            handle: `.${this.dragHandleClass}`,
            animation: 200,
            ghostClass: 'dragging',
            onEnd: () => this.handleDragEnd()
        });
    }
    
    handleDragEnd() {
        // Fetch ordered image IDs based on current DOM sequence
        const cards = Array.from(this.grid.querySelectorAll('.gallery-card'));
        const orderedIds = cards.map(card => card.getAttribute('data-id'));
        
        // Visually update sort order labels on cards instantly to match new position
        cards.forEach((card, index) => {
            const badgeText = card.querySelector('.order-num-text');
            if (badgeText) {
                badgeText.textContent = index + 1;
            }
            card.setAttribute('data-index', index);
        });
        
        if (this.onOrderChanged) {
            this.onOrderChanged(orderedIds);
        }
    }
    
    destroy() {
        if (this.sortable) {
            this.sortable.destroy();
            this.sortable = null;
        }
    }
}

// Bind to window object
window.DragDropManager = DragDropManager;
