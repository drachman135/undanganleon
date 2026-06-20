// js/services/galleryService.js
'use strict';

/**
 * Service orchestrating the Gallery CMS operations.
 */
class GalleryService {
    constructor() {
        this.supabase = null;
        this.originalImages = []; // original state from DB
        this.currentImages = [];  // working copy with drag & title changes
        this.hasChanges = false;
        
        // Components
        this.uploadZone = null;
        this.galleryGrid = null;
        this.previewModal = null;
        this.dragDropManager = null;
        this.bulkActionManager = null;
        
        // DOM Element references
        this.skeleton = null;
        this.activeGrid = null;
        this.emptyState = null;
        
        this.btnSaveOrder = null;
        this.btnRevertOrder = null;
        this.btnStickySave = null;
        this.unsavedBanner = null;
        
        this.statsTotal = null;
        this.statsLatestName = null;
        this.statsLatestDate = null;
    }
    
    async init() {
        // Resolve DOM elements
        this.skeleton = document.getElementById('gallery-grid-skeleton');
        this.activeGrid = document.getElementById('gallery-grid-active');
        this.emptyState = document.getElementById('gallery-empty-state');
        
        this.btnSaveOrder = document.getElementById('btn-save-order');
        this.btnRevertOrder = document.getElementById('btn-revert-order');
        this.btnStickySave = document.getElementById('btn-sticky-save');
        this.unsavedBanner = document.getElementById('unsaved-changes-banner');
        
        this.statsTotal = document.getElementById('stats-total-images');
        this.statsLatestName = document.getElementById('stats-latest-upload');
        this.statsLatestDate = document.getElementById('stats-latest-date');
        
        try {
            this.showGlobalLoading(true);
            
            // Connect to Supabase
            this.supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
            if (!this.supabase) {
                throw new Error('Supabase client failed to initialize');
            }
            
            // Fetch gallery images
            await this.loadGallery();
            
            // Initialize Sub-Components
            this.initUploadZone();
            this.initGalleryGrid();
            this.initPreviewModal();
            this.initDragDrop();
            this.initBulkActions();
            
            // Bind buttons
            this.btnSaveOrder.addEventListener('click', () => this.handleSaveOrder());
            this.btnRevertOrder.addEventListener('click', () => this.handleRevertOrder());
            if (this.btnStickySave) {
                this.btnStickySave.addEventListener('click', () => this.handleSaveOrder());
            }
            
            // Beforeunload navigation warning guard
            window.addEventListener('beforeunload', (e) => {
                if (this.hasChanges) {
                    e.preventDefault();
                    e.returnValue = 'Perubahan belum disimpan';
                    return 'Perubahan belum disimpan';
                }
            });
            
        } catch (e) {
            console.error('Failed to initialize GalleryService:', e);
            this.showToast('Gagal memuat galeri. Periksa koneksi Supabase Anda.', 'error');
        } finally {
            this.showGlobalLoading(false);
        }
    }
    
    async loadGallery() {
        const { data, error } = await this.supabase
            .from('gallery_images')
            .select('*')
            .order('sort_order', { ascending: true });
            
        if (error) throw error;
        
        // Deep copy original items
        this.originalImages = JSON.parse(JSON.stringify(data || []));
        this.currentImages = JSON.parse(JSON.stringify(data || []));
        
        this.hasChanges = false;
        this.updateUnsavedBanner();
        this.updateOverviewStats();
        
        // Toggle view
        if (this.currentImages.length === 0) {
            if (this.activeGrid) this.activeGrid.style.display = 'none';
            if (this.emptyState) this.emptyState.style.display = 'flex';
        } else {
            if (this.activeGrid) this.activeGrid.style.display = 'grid';
            if (this.emptyState) this.emptyState.style.display = 'none';
        }
    }
    
    // ==========================================
    // SUB-COMPONENTS INITIALIZERS
    // ==========================================
    
    initUploadZone() {
        const dropZoneEl = document.getElementById('gallery-dropzone');
        const fileInputEl = document.getElementById('gallery-file-input');
        const statusListEl = document.getElementById('upload-status-list');
        
        this.uploadZone = new UploadZone({
            dropZoneEl,
            fileInputEl,
            statusListEl,
            onFilesSelected: (files) => this.handleFilesUpload(files),
            onError: (errStr) => this.showToast(errStr, 'error')
        });
    }
    
    initGalleryGrid() {
        this.galleryGrid = new GalleryGrid({
            gridEl: this.activeGrid,
            onTitleChanged: (id, newTitle) => this.handleTitleChanged(id, newTitle),
            onImageClicked: (idx) => this.handleImagePreview(idx),
            onDeleteClicked: (id) => this.handleSingleDelete(id),
            onSelectionChanged: () => this.handleSelectionChanged()
        });
        this.galleryGrid.setImages(this.currentImages);
    }
    
    initPreviewModal() {
        const modalEl = document.getElementById('lightbox-modal');
        const imgEl = document.getElementById('lightbox-image');
        const captionEl = document.getElementById('lightbox-caption');
        const closeBtn = document.getElementById('btn-lightbox-close');
        const zoomBtn = document.getElementById('btn-lightbox-zoom');
        const prevBtn = document.getElementById('btn-lightbox-prev');
        const nextBtn = document.getElementById('btn-lightbox-next');
        
        this.previewModal = new ImagePreviewModal({
            modalEl,
            imgEl,
            captionEl,
            closeBtn,
            zoomBtn,
            prevBtn,
            nextBtn
        });
    }
    
    initDragDrop() {
        this.dragDropManager = new DragDropManager({
            gridEl: this.activeGrid,
            dragHandleClass: 'drag-handle',
            onOrderChanged: (orderedIds) => this.handleOrderChanged(orderedIds)
        });
        this.dragDropManager.init();
    }
    
    initBulkActions() {
        const selectAllChk = document.getElementById('chk-select-all');
        const selectAllLabel = document.getElementById('bulk-select-label');
        const bulkDeleteBtn = document.getElementById('btn-bulk-delete');
        const selectedCountEl = document.getElementById('selected-count');
        
        this.bulkActionManager = new BulkActionManager({
            selectAllChk,
            selectAllLabel,
            bulkDeleteBtn,
            selectedCountEl,
            gridContainerEl: this.activeGrid,
            onBulkDelete: (ids) => this.handleBulkDelete(ids)
        });
        this.bulkActionManager.updateSelectionState();
    }
    
    // ==========================================
    // UPLOAD FLOW
    // ==========================================
    
    async handleFilesUpload(files) {
        let maxSortOrder = 0;
        if (this.originalImages.length > 0) {
            maxSortOrder = Math.max(...this.originalImages.map(img => img.sort_order || 0));
        }
        
        // Show loading status
        this.showToast('Mengunggah foto...', 'success');
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileId = `file_${Date.now()}_${i}`;
            
            try {
                this.uploadZone.renderProgress(fileId, file.name, 10);
                
                const timestamp = Date.now();
                const fileExt = file.name.split('.').pop();
                const randomPart = Math.floor(Math.random() * 1000);
                const filePath = `gallery_${timestamp}_${randomPart}.${fileExt}`;
                
                this.uploadZone.renderProgress(fileId, file.name, 40);
                
                // Upload to Supabase Storage bucket 'gallery-images'
                const publicUrl = await StorageService.uploadFile('gallery-images', filePath, file);
                
                this.uploadZone.renderProgress(fileId, file.name, 80);
                
                // Get filename without extension for default title
                const defaultTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                const assignedSortOrder = maxSortOrder + i + 1;
                
                // Insert database record
                const { error: dbError } = await this.supabase
                    .from('gallery_images')
                    .insert([
                        {
                            image_url: publicUrl,
                            image_title: defaultTitle,
                            sort_order: assignedSortOrder
                        }
                    ]);
                    
                if (dbError) throw dbError;
                
                this.uploadZone.renderProgress(fileId, file.name, 100);
                
                // Cleanup progress card
                setTimeout(() => {
                    this.uploadZone.removeProgress(fileId);
                }, 1000);
                
            } catch (err) {
                console.error(`Failed to upload ${file.name}:`, err);
                this.showToast(`Upload gagal: ${file.name}`, 'error');
                this.uploadZone.removeProgress(fileId);
            }
        }
        
        // Refresh grid
        try {
            this.showGlobalLoading(true);
            await this.loadGallery();
            this.galleryGrid.setImages(this.currentImages);
            this.bulkActionManager.reset();
            this.dragDropManager.destroy();
            this.dragDropManager.init();
            
            this.showToast('Foto berhasil diunggah', 'success');
        } catch (e) {
            console.error('Refresh post-upload failed:', e);
        } finally {
            this.showGlobalLoading(false);
        }
    }
    
    // ==========================================
    // CHANGE DETECTION & SAVE ORDER
    // ==========================================
    
    handleTitleChanged(id, newTitle) {
        const image = this.currentImages.find(img => img.id === id);
        if (image) {
            image.image_title = newTitle;
        }
        this.detectStateChanges();
    }
    
    handleOrderChanged(orderedIds) {
        // Map currentImages to new order
        const reorderedImages = [];
        orderedIds.forEach((id, idx) => {
            const image = this.currentImages.find(img => img.id === id);
            if (image) {
                image.sort_order = idx + 1;
                reorderedImages.push(image);
            }
        });
        
        this.currentImages = reorderedImages;
        this.detectStateChanges();
    }
    
    detectStateChanges() {
        let changed = false;
        
        // Check array lengths
        if (this.currentImages.length !== this.originalImages.length) {
            changed = true;
        } else {
            // Check titles & IDs ordering
            for (let i = 0; i < this.currentImages.length; i++) {
                const current = this.currentImages[i];
                const original = this.originalImages[i];
                
                if (current.id !== original.id || current.image_title !== original.image_title) {
                    changed = true;
                    break;
                }
            }
        }
        
        this.hasChanges = changed;
        this.updateUnsavedBanner();
    }
    
    updateUnsavedBanner() {
        if (this.hasChanges) {
            if (this.unsavedBanner) this.unsavedBanner.classList.add('show');
            if (this.btnSaveOrder) this.btnSaveOrder.disabled = false;
            if (this.btnRevertOrder) this.btnRevertOrder.disabled = false;
        } else {
            if (this.unsavedBanner) this.unsavedBanner.classList.remove('show');
            if (this.btnSaveOrder) this.btnSaveOrder.disabled = true;
            if (this.btnRevertOrder) this.btnRevertOrder.disabled = true;
        }
    }
    
    async handleSaveOrder() {
        this.showToast('Menyimpan urutan galeri...', 'success');
        
        this.btnSaveOrder.disabled = true;
        this.btnSaveOrder.textContent = 'Menyimpan...';
        if (this.btnStickySave) {
            this.btnStickySave.disabled = true;
            this.btnStickySave.textContent = 'Menyimpan...';
        }
        
        try {
            // Update database records row by row
            const updatePromises = this.currentImages.map((img, idx) => {
                return this.supabase
                    .from('gallery_images')
                    .update({
                        sort_order: idx + 1,
                        image_title: img.image_title
                    })
                    .eq('id', img.id);
            });
            
            const results = await Promise.all(updatePromises);
            
            // Check if any errors occurred
            const error = results.find(res => res.error);
            if (error) throw error.error;
            
            this.showToast('Urutan galeri berhasil disimpan', 'success');
            
            // Reload gallery
            await this.loadGallery();
            this.galleryGrid.setImages(this.currentImages);
            this.bulkActionManager.reset();
            
        } catch (error) {
            console.error('Failed to save order/titles:', error);
            this.showToast('Urutan galeri gagal disimpan', 'error');
        } finally {
            this.btnSaveOrder.textContent = 'Simpan Urutan Galeri';
            this.btnSaveOrder.disabled = !this.hasChanges;
            if (this.btnStickySave) {
                this.btnStickySave.textContent = 'Simpan Perubahan';
                this.btnStickySave.disabled = !this.hasChanges;
            }
        }
    }
    
    handleRevertOrder() {
        // Deep copy original
        this.currentImages = JSON.parse(JSON.stringify(this.originalImages));
        this.galleryGrid.setImages(this.currentImages);
        this.bulkActionManager.reset();
        
        // Re-init sortable elements ordering
        this.dragDropManager.destroy();
        this.dragDropManager.init();
        
        this.hasChanges = false;
        this.updateUnsavedBanner();
        this.showToast('Perubahan urutan dibatalkan.', 'success');
    }
    
    // ==========================================
    // DELETION OPERATIONS
    // ==========================================
    
    async handleSingleDelete(id) {
        const image = this.currentImages.find(img => img.id === id);
        if (!image) return;
        
        if (confirm('Apakah Anda yakin ingin menghapus foto ini?')) {
            this.showToast('Menghapus...', 'success');
            try {
                this.showGlobalLoading(true);
                
                // 1. Delete from Supabase Storage
                await StorageService.deleteFile('gallery-images', image.image_url);
                
                // 2. Delete database record
                const { error } = await this.supabase
                    .from('gallery_images')
                    .delete()
                    .eq('id', id);
                    
                if (error) throw error;
                
                this.showToast('Foto berhasil dihapus', 'success');
                
                // Reload
                await this.loadGallery();
                this.galleryGrid.setImages(this.currentImages);
                this.bulkActionManager.reset();
                this.dragDropManager.destroy();
                this.dragDropManager.init();
                
            } catch (err) {
                console.error('Delete photo failed:', err);
                this.showToast('Foto gagal dihapus', 'error');
            } finally {
                this.showGlobalLoading(false);
            }
        }
    }
    
    async handleBulkDelete(ids) {
        if (ids.length === 0) return;
        
        if (confirm(`Apakah Anda yakin ingin menghapus ${ids.length} foto terpilih?`)) {
            this.showToast('Menghapus...', 'success');
            
            try {
                this.showGlobalLoading(true);
                
                // Perform deletion in sequence / parallel
                for (const id of ids) {
                    const image = this.originalImages.find(img => img.id === id) || this.currentImages.find(img => img.id === id);
                    if (image) {
                        // Delete from Storage
                        await StorageService.deleteFile('gallery-images', image.image_url);
                        
                        // Delete from DB
                        const { error } = await this.supabase
                            .from('gallery_images')
                            .delete()
                            .eq('id', id);
                            
                        if (error) throw error;
                    }
                }
                
                this.showToast('Foto berhasil dihapus', 'success');
                
                // Reload
                await this.loadGallery();
                this.galleryGrid.setImages(this.currentImages);
                this.bulkActionManager.reset();
                this.dragDropManager.destroy();
                this.dragDropManager.init();
                
            } catch (err) {
                console.error('Bulk deletion failed:', err);
                this.showToast('Foto gagal dihapus', 'error');
            } finally {
                this.showGlobalLoading(false);
            }
        }
    }
    
    handleSelectionChanged() {
        if (this.bulkActionManager) {
            this.bulkActionManager.updateSelectionState();
        }
    }
    
    // ==========================================
    // IMAGE PREVIEW MODAL
    // ==========================================
    
    handleImagePreview(index) {
        if (this.previewModal) {
            this.previewModal.open(this.currentImages, index);
        }
    }
    
    // ==========================================
    // STATS & UTILS DISPLAY
    // ==========================================
    
    updateOverviewStats() {
        if (this.statsTotal) {
            this.statsTotal.textContent = this.originalImages.length;
        }
        
        if (this.originalImages.length > 0) {
            // Find latest upload (using created_at timestamp descending)
            const sortedByDate = [...this.originalImages].sort((a, b) => {
                return new Date(b.created_at) - new Date(a.created_at);
            });
            const latest = sortedByDate[0];
            
            if (this.statsLatestName && latest) {
                const urlParts = latest.image_url.split('/');
                const filename = decodeURIComponent(urlParts[urlParts.length - 1]);
                this.statsLatestName.textContent = filename.length > 18 ? filename.substring(0, 15) + '...' : filename;
            }
            
            if (this.statsLatestDate && latest) {
                try {
                    const date = new Date(latest.created_at);
                    this.statsLatestDate.textContent = `Unggahan: ${date.toLocaleDateString('id-ID')} ${date.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WIB`;
                } catch (e) {
                    this.statsLatestDate.textContent = latest.created_at;
                }
            }
        } else {
            if (this.statsLatestName) this.statsLatestName.textContent = '-';
            if (this.statsLatestDate) this.statsLatestDate.textContent = 'Belum ada aktivitas';
        }
    }
    
    showGlobalLoading(isLoading) {
        if (this.skeleton && this.activeGrid && this.emptyState) {
            if (isLoading) {
                this.skeleton.style.display = 'grid';
                this.activeGrid.style.display = 'none';
                this.emptyState.style.display = 'none';
            } else {
                this.skeleton.style.display = 'none';
                if (this.currentImages.length === 0) {
                    this.activeGrid.style.display = 'none';
                    this.emptyState.style.display = 'flex';
                } else {
                    this.activeGrid.style.display = 'grid';
                    this.emptyState.style.display = 'none';
                }
            }
        }
    }
    
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        const text = document.getElementById('toast-message');
        
        if (!toast || !icon || !text) return;
        
        toast.className = 'toast show ' + type;
        icon.textContent = type === 'success' ? '✓' : '✗';
        text.textContent = message;
        
        // Remove old timeout if exists
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we are on the gallery settings page
    if (document.getElementById('gallery-dropzone')) {
        const galleryService = new GalleryService();
        galleryService.init();
        window.galleryService = galleryService;
    }
});
