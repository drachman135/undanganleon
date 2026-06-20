// js/components/galleryGrid.js
'use strict';

/**
 * Handles rendering of the gallery grid, image card creations, and binds UI triggers.
 */
class GalleryGrid {
    constructor({ gridEl, onTitleChanged, onImageClicked, onDeleteClicked, onSelectionChanged }) {
        this.grid = gridEl;
        this.onTitleChanged = onTitleChanged;
        this.onImageClicked = onImageClicked;
        this.onDeleteClicked = onDeleteClicked;
        this.onSelectionChanged = onSelectionChanged;
        
        this.images = [];
    }
    
    setImages(images) {
        this.images = [...images];
        this.render();
    }
    
    getImages() {
        return this.images;
    }
    
    render() {
        if (!this.grid) return;
        this.grid.innerHTML = '';
        
        if (this.images.length === 0) {
            return;
        }
        
        this.images.forEach((img, idx) => {
            const card = this.createCardElement(img, idx);
            this.grid.appendChild(card);
        });
    }
    
    createCardElement(img, index) {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.setAttribute('data-id', img.id);
        card.setAttribute('data-index', index);
        
        const title = img.image_title || '';
        const uploadDateStr = this.formatDate(img.created_at);
        
        card.innerHTML = `
            <!-- Selection Checkbox -->
            <div class="gallery-card-select-overlay">
                <input type="checkbox" class="gallery-card-checkbox card-select-chk" data-id="${img.id}" aria-label="Pilih foto ini">
            </div>
            
            <!-- Badges -->
            <div class="gallery-card-badges">
                <span class="badge-sort-order">
                    <span>↕</span> <span class="order-num-text">${index + 1}</span>
                </span>
            </div>
            
            <!-- Thumbnail Image and Zoom Overlay -->
            <div class="gallery-card-img-wrapper">
                <img class="gallery-card-img" src="${this.escapeHtml(img.image_url)}" alt="${this.escapeHtml(title) || 'Foto galeri ke-' + (index + 1)}" loading="lazy">
                
                <div class="gallery-card-actions-overlay">
                    <!-- Zoom Button -->
                    <button type="button" class="btn-overlay-circle btn-card-zoom" title="Perbesar Gambar" aria-label="Perbesar gambar ${this.escapeHtml(title) || 'ke-' + (index + 1)}">
                        🔍
                    </button>
                    <!-- Drag Handle -->
                    <div class="btn-overlay-circle drag-handle" title="Tarik untuk mengubah urutan" role="button" aria-label="Tarik untuk mengubah urutan gambar ${this.escapeHtml(title) || 'ke-' + (index + 1)}" tabindex="0">
                        ☰
                    </div>
                </div>
            </div>
            
            <!-- Card Details (Title & Date) -->
            <div class="gallery-card-details">
                <div class="form-group" style="margin-bottom: 0;">
                    <input type="text" class="gallery-card-title-input card-title-input" value="${this.escapeHtml(title)}" placeholder="Tambah judul foto..." data-id="${img.id}" aria-label="Judul gambar ke-${index + 1}">
                </div>
                
                <div class="gallery-card-footer">
                    <span>${this.escapeHtml(uploadDateStr)}</span>
                    <button type="button" class="btn-delete-card btn-card-delete" data-id="${img.id}" aria-label="Hapus gambar ${this.escapeHtml(title) || 'ke-' + (index + 1)}">
                        🗑️ Hapus
                    </button>
                </div>
            </div>
        `;
        
        // Bind event listeners
        const zoomBtn = card.querySelector('.btn-card-zoom');
        zoomBtn.addEventListener('click', () => {
            if (this.onImageClicked) {
                this.onImageClicked(index);
            }
        });
        
        const deleteBtn = card.querySelector('.btn-card-delete');
        deleteBtn.addEventListener('click', () => {
            if (this.onDeleteClicked) {
                this.onDeleteClicked(img.id);
            }
        });
        
        const titleInput = card.querySelector('.card-title-input');
        titleInput.addEventListener('input', (e) => {
            const newTitle = e.target.value;
            img.image_title = newTitle;
            if (this.onTitleChanged) {
                this.onTitleChanged(img.id, newTitle);
            }
        });
        
        const selectChk = card.querySelector('.card-select-chk');
        selectChk.addEventListener('change', () => {
            if (this.onSelectionChanged) {
                this.onSelectionChanged();
            }
        });
        
        return card;
    }
    
    formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            return date.toLocaleDateString('id-ID', options);
        } catch (e) {
            return dateStr;
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
window.GalleryGrid = GalleryGrid;
