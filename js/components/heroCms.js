// js/components/heroCms.js
'use strict';

/**
 * Validation Layer for uploaded image files.
 */
const ValidationLayer = {
    validateImage(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
        const fileExt = file.name.split('.').pop().toLowerCase();

        // Reject forbidden types (gif, svg, pdf, videos)
        const forbiddenTypes = ['image/gif', 'image/svg+xml', 'application/pdf', 'video/mp4', 'video/quicktime'];
        if (forbiddenTypes.includes(file.type) || ['gif', 'svg', 'pdf', 'mp4', 'mov'].includes(fileExt)) {
            return {
                isValid: false,
                error: 'Format file tidak didukung! Hanya mendukung format JPG, JPEG, PNG, dan WEBP.'
            };
        }

        if (!allowedTypes.includes(file.type) && !allowedExts.includes(fileExt)) {
            return {
                isValid: false,
                error: 'Format file tidak didukung! Hanya mendukung format JPG, JPEG, PNG, dan WEBP.'
            };
        }

        // Limit size to 5MB
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                isValid: false,
                error: 'Ukuran file terlalu besar! Maksimal ukuran file 5MB.'
            };
        }

        return { isValid: true, error: null };
    }
};

/**
 * Preview Component to render the current selected image or fallback placeholders.
 */
const ImagePreviewComponent = {
    render(containerEl, imageUrl) {
        if (!containerEl) return;
        
        containerEl.innerHTML = '';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'hero-preview-wrapper';

        // Prefix relative database image URLs (e.g. 'images/hero_cake.png') to display correctly in /admin/
        let resolvedUrl = imageUrl;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('../')) {
            resolvedUrl = `../${imageUrl}`;
        }

        const img = document.createElement('img');
        img.className = 'hero-preview-img';
        img.src = resolvedUrl || '../images/hero_cake.png'; // default fallback cake
        img.alt = 'Pratinjau Hero Image';
        wrapper.appendChild(img);
        
        if (!imageUrl) {
            const overlay = document.createElement('div');
            overlay.className = 'preview-placeholder-overlay';
            overlay.innerHTML = `
                <span class="preview-placeholder-emoji">🎂</span>
                <span class="preview-placeholder-text">Menggunakan Gambar Kue Default</span>
            `;
            wrapper.appendChild(overlay);
        }
        
        containerEl.appendChild(wrapper);
    }
};

/**
 * Reusable Upload Hook linking dropzones and file inputs.
 */
function useImageUpload({ dropZoneEl, fileInputEl, onFileSelected, onError }) {
    if (!dropZoneEl || !fileInputEl) return;

    // Trigger click on zone
    dropZoneEl.addEventListener('click', () => fileInputEl.click());

    // Drag and Drop highlights
    dropZoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZoneEl.classList.add('dragover');
    });

    ['dragleave', 'dragend', 'drop'].forEach(type => {
        dropZoneEl.addEventListener(type, () => {
            dropZoneEl.classList.remove('dragover');
        });
    });

    dropZoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    });

    fileInputEl.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    });

    function processFile(file) {
        const validation = ValidationLayer.validateImage(file);
        if (!validation.isValid) {
            if (typeof onError === 'function') onError(validation.error);
            return;
        }
        if (typeof onFileSelected === 'function') onFileSelected(file);
    }
}

// Export to window
window.ValidationLayer = ValidationLayer;
window.ImagePreviewComponent = ImagePreviewComponent;
window.useImageUpload = useImageUpload;
