// js/components/imagePreviewModal.js
'use strict';

/**
 * Manages the image preview modal lightbox (Zoom, Close, Navigation, Keyboard hotkeys).
 */
class ImagePreviewModal {
    constructor({ modalEl, imgEl, captionEl, closeBtn, zoomBtn, prevBtn, nextBtn }) {
        this.modal = modalEl;
        this.img = imgEl;
        this.caption = captionEl;
        this.closeBtn = closeBtn;
        this.zoomBtn = zoomBtn;
        this.prevBtn = prevBtn;
        this.nextBtn = nextBtn;
        
        this.images = [];
        this.currentIndex = 0;
        this.isZoomed = false;
        
        this.init();
    }
    
    init() {
        if (!this.modal) return;
        
        // Close modal listeners
        this.closeBtn.addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            // Close if clicking outside the image container / arrows
            if (e.target === this.modal || e.target.classList.contains('lightbox-content-wrapper')) {
                this.close();
            }
        });
        
        // Navigation listeners
        this.prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigate(-1);
        });
        this.nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigate(1);
        });
        
        // Zoom listener
        this.zoomBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleZoom();
        });
        
        // Double click image to zoom
        if (this.img) {
            this.img.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.toggleZoom();
            });
        }
        
        // Keyboard event bindings
        this.keydownHandler = (e) => {
            if (!this.modal.classList.contains('show')) return;
            
            if (e.key === 'Escape') {
                this.close();
            } else if (e.key === 'ArrowLeft') {
                this.navigate(-1);
            } else if (e.key === 'ArrowRight') {
                this.navigate(1);
            }
        };
    }
    
    open(images, startIndex) {
        this.images = images;
        this.currentIndex = startIndex;
        this.isZoomed = false;
        
        if (this.img) {
            this.img.style.transform = 'scale(1)';
        }
        
        this.updateContent();
        
        this.modal.style.display = 'flex';
        // Trigger reflow for transition
        void this.modal.offsetWidth;
        this.modal.classList.add('show');
        
        window.addEventListener('keydown', this.keydownHandler);
    }
    
    close() {
        this.modal.classList.remove('show');
        this.isZoomed = false;
        if (this.img) {
            this.img.style.transform = 'scale(1)';
        }
        
        setTimeout(() => {
            if (!this.modal.classList.contains('show')) {
                this.modal.style.display = 'none';
            }
        }, 300);
        
        window.removeEventListener('keydown', this.keydownHandler);
    }
    
    navigate(direction) {
        if (this.images.length <= 1) return;
        
        this.currentIndex += direction;
        
        // Loop around indexes
        if (this.currentIndex < 0) {
            this.currentIndex = this.images.length - 1;
        } else if (this.currentIndex >= this.images.length) {
            this.currentIndex = 0;
        }
        
        // Reset zoom state on navigation
        if (this.isZoomed) {
            this.toggleZoom();
        }
        
        this.updateContent();
    }
    
    toggleZoom() {
        this.isZoomed = !this.isZoomed;
        if (this.img) {
            if (this.isZoomed) {
                this.img.style.transform = 'scale(2)';
                this.img.style.cursor = 'zoom-out';
                this.zoomBtn.textContent = '🔍';
                this.zoomBtn.style.backgroundColor = 'var(--orange)';
            } else {
                this.img.style.transform = 'scale(1)';
                this.img.style.cursor = 'zoom-in';
                this.zoomBtn.textContent = '🔍';
                this.zoomBtn.style.backgroundColor = '';
            }
        }
    }
    
    updateContent() {
        const activeImg = this.images[this.currentIndex];
        if (!activeImg) return;
        
        if (this.img) {
            this.img.src = activeImg.image_url;
            this.img.style.cursor = 'zoom-in';
        }
        
        if (this.caption) {
            this.caption.textContent = activeImg.image_title || `Foto ${this.currentIndex + 1}`;
        }
        
        // Toggle arrow visibility if only 1 image exists
        const showArrows = this.images.length > 1;
        this.prevBtn.style.display = showArrows ? 'flex' : 'none';
        this.nextBtn.style.display = showArrows ? 'flex' : 'none';
    }
}

// Bind to window object
window.ImagePreviewModal = ImagePreviewModal;
