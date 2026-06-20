// js/services/musicService.js
'use strict';

/**
 * Service orchestrating the Music CMS panel and components.
 */
class MusicService {
    constructor() {
        this.supabase = null;
        this.originalSettings = null;
        this.currentSettings = null; // tracking form changes
        this.hasChanges = false;
        
        // Components
        this.audioPlayer = null;
        this.uploader = null;
        this.settingsPanel = null;
        
        // DOM Elements
        this.skeleton = null;
        this.mainPanel = null;
        this.unsavedBanner = null;
        
        this.btnSaveSettings = null;
        this.btnRevertSettings = null;
        this.btnStickySave = null;
        this.btnDeleteMusic = null;
        
        this.statsStatus = null;
        this.statsEnabled = null;
        this.statsVolume = null;
        this.statsTrack = null;
        this.statsTrackSize = null;
        
        this.toastTimeout = null;
    }
    
    async init() {
        this.skeleton = document.getElementById('music-skeleton-container');
        this.mainPanel = document.getElementById('music-cms-panel');
        this.unsavedBanner = document.getElementById('unsaved-changes-banner');
        
        this.btnSaveSettings = document.getElementById('btn-save-settings');
        this.btnRevertSettings = document.getElementById('btn-revert-settings');
        this.btnStickySave = document.getElementById('btn-sticky-save');
        this.btnDeleteMusic = document.getElementById('btn-delete-music');
        
        this.statsStatus = document.getElementById('stats-music-status');
        this.statsEnabled = document.getElementById('stats-music-enabled');
        this.statsVolume = document.getElementById('stats-music-volume');
        this.statsTrack = document.getElementById('stats-music-track');
        this.statsTrackSize = document.getElementById('stats-track-size');
        
        try {
            this.showGlobalLoading(true);
            
            // Connect to Supabase
            this.supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
            if (!this.supabase) {
                throw new Error('Supabase client failed to initialize');
            }
            
            // Fetch initial configuration
            await this.loadSettings();
            
            // Initialize Sub-Components
            this.initAudioPlayer();
            this.initUploader();
            this.initSettingsPanel();
            
            // Bind buttons listeners
            this.btnSaveSettings.addEventListener('click', (e) => this.handleSaveSettings(e));
            this.btnRevertSettings.addEventListener('click', () => this.handleRevertSettings());
            if (this.btnStickySave) {
                this.btnStickySave.addEventListener('click', (e) => this.handleSaveSettings(e));
            }
            this.btnDeleteMusic.addEventListener('click', () => this.handleDeleteMusic());
            
            // Page navigation unload guard
            window.addEventListener('beforeunload', (e) => {
                if (this.hasChanges) {
                    e.preventDefault();
                    e.returnValue = 'Perubahan belum disimpan';
                    return 'Perubahan belum disimpan';
                }
            });
            
        } catch (e) {
            console.error('Failed to initialize MusicService:', e);
            this.showToast('Gagal memuat pengaturan musik latar.', 'error');
        } finally {
            this.showGlobalLoading(false);
        }
    }
    
    async loadSettings() {
        const { data, error } = await this.supabase
            .from('invitation_settings')
            .select('background_music_url, music_enabled, music_volume, loading_duration')
            .eq('id', 1)
            .single();
            
        if (error) throw error;
        
        this.originalSettings = {
            musicEnabled: !!data.music_enabled,
            musicVolume: typeof data.music_volume === 'number' ? data.music_volume : 0.4,
            loadingDuration: typeof data.loading_duration === 'number' ? data.loading_duration : 3000,
            backgroundMusicUrl: data.background_music_url
        };
        
        this.currentSettings = { ...this.originalSettings };
        this.hasChanges = false;
        
        this.updateUnsavedBanner();
        this.updateOverviewStats();
    }
    
    // ==========================================
    // SUB-COMPONENTS INITIALIZERS
    // ==========================================
    
    initAudioPlayer() {
        const toggleBtn = document.getElementById('btn-player-toggle');
        const timelineTrack = document.getElementById('timeline-track');
        const timelineFill = document.getElementById('timeline-fill');
        const timeCurrent = document.getElementById('player-time-current');
        const timeDuration = document.getElementById('player-time-duration');
        const muteBtn = document.getElementById('btn-player-mute');
        const volumeSlider = document.getElementById('player-volume-slider');
        
        this.audioPlayer = new AudioPlayerComponent({
            toggleBtn,
            timelineTrack,
            timelineFill,
            timeCurrent,
            timeDuration,
            muteBtn,
            volumeSlider
        });
        
        // Load active music preview
        if (this.originalSettings.backgroundMusicUrl) {
            this.audioPlayer.load(this.originalSettings.backgroundMusicUrl);
            if (this.btnDeleteMusic) this.btnDeleteMusic.disabled = false;
        } else {
            this.audioPlayer.unload();
            this.audioPlayer.setDisabled(true);
            if (this.btnDeleteMusic) this.btnDeleteMusic.disabled = true;
        }
    }
    
    initUploader() {
        const dropZoneEl = document.getElementById('music-dropzone');
        const fileInputEl = document.getElementById('music-file-input');
        const fileBadgeEl = document.getElementById('audio-file-badge');
        const fileNameEl = document.getElementById('audio-file-name');
        const cancelBtn = document.getElementById('btn-cancel-upload');
        const progressContainer = document.getElementById('audio-progress-container');
        const progressFill = document.getElementById('audio-progress-fill');
        
        this.uploader = new UploadComponent({
            dropZoneEl,
            fileInputEl,
            fileBadgeEl,
            fileNameEl,
            cancelBtn,
            progressContainer,
            progressFill,
            onFileSelected: (file) => this.handleMusicUpload(file),
            onError: (errStr) => this.showToast(errStr, 'error')
        });
    }
    
    initSettingsPanel() {
        const formEl = document.getElementById('music-settings-form');
        const enabledToggle = document.getElementById('music-enabled');
        const volumeSlider = document.getElementById('music-volume');
        const volumeLabel = document.getElementById('music-volume-val');
        const durationInput = document.getElementById('loading-duration');
        
        this.settingsPanel = new SettingsPanel({
            formEl,
            enabledToggle,
            volumeSlider,
            volumeLabel,
            durationInput,
            revertBtn: this.btnRevertSettings,
            saveBtn: this.btnSaveSettings,
            onSettingsChanged: (values, isValid) => this.handleSettingsChanged(values, isValid)
        });
        
        this.settingsPanel.setValues(this.originalSettings);
        this.settingsPanel.setDisabled(false);
    }
    
    // ==========================================
    // UPLOAD & REPLACE FLOW
    // ==========================================
    
    async handleMusicUpload(file) {
        this.showToast('Mengunggah musik latar...', 'success');
        this.settingsPanel.setDisabled(true);
        if (this.btnDeleteMusic) this.btnDeleteMusic.disabled = true;
        
        try {
            this.uploader.showProgress(15);
            
            const timestamp = Date.now();
            const fileExt = file.name.split('.').pop();
            const filePath = `bgmusic_${timestamp}.${fileExt}`;
            
            this.uploader.showProgress(45);
            
            // Upload to Supabase Storage bucket 'music'
            const publicUrl = await StorageService.uploadFile('music', filePath, file);
            
            this.uploader.showProgress(80);
            
            const oldMusicUrl = this.originalSettings.backgroundMusicUrl;
            
            // Save URL to invitation_settings.background_music_url immediately
            const { error: dbError } = await this.supabase
                .from('invitation_settings')
                .update({
                    background_music_url: publicUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1);
                
            if (dbError) throw dbError;
            
            this.uploader.showProgress(100);
            
            // Clean up old file in storage if it exists to avoid leakage
            if (oldMusicUrl && oldMusicUrl.includes('/music/')) {
                try {
                    await StorageService.deleteFile('music', oldMusicUrl);
                } catch (e) {
                    console.warn('Failed to delete old music file (non-blocking):', e);
                }
            }
            
            this.showToast('Musik berhasil diunggah', 'success');
            
            // Clear progress overlay
            setTimeout(() => {
                this.uploader.clearSelection();
            }, 1000);
            
            // Reload configuration
            await this.loadSettings();
            
            // Update audio player preview & settings panel values
            this.audioPlayer.load(this.originalSettings.backgroundMusicUrl);
            this.settingsPanel.setValues(this.originalSettings);
            if (this.btnDeleteMusic) this.btnDeleteMusic.disabled = false;
            
        } catch (error) {
            console.error('Failed to upload/replace music:', error);
            this.showToast('Gagal mengunggah musik', 'error'); // Matches "Gagal mengunggah musik" error feedback
            this.uploader.clearSelection();
            if (this.originalSettings.backgroundMusicUrl && this.btnDeleteMusic) {
                this.btnDeleteMusic.disabled = false;
            }
        } finally {
            this.settingsPanel.setDisabled(false);
        }
    }
    
    // ==========================================
    // SETTINGS CONTROL FLOW
    // ==========================================
    
    handleSettingsChanged(values, isValid) {
        this.currentSettings = { ...this.currentSettings, ...values };
        
        // Detect changes
        let changed = false;
        if (this.currentSettings.musicEnabled !== this.originalSettings.musicEnabled) changed = true;
        if (Math.abs(this.currentSettings.musicVolume - this.originalSettings.musicVolume) > 0.01) changed = true;
        if (this.currentSettings.loadingDuration !== this.originalSettings.loadingDuration) changed = true;
        
        this.hasChanges = changed && isValid;
        this.updateUnsavedBanner();
        
        // Live Preview: Update player default volume directly on sliders input
        if (this.audioPlayer) {
            this.audioPlayer.setVolume(this.currentSettings.musicVolume);
        }
    }
    
    updateUnsavedBanner() {
        if (this.hasChanges) {
            if (this.unsavedBanner) this.unsavedBanner.classList.add('show');
            if (this.btnSaveSettings) this.btnSaveSettings.disabled = false;
            if (this.btnRevertSettings) this.btnRevertSettings.disabled = false;
        } else {
            if (this.unsavedBanner) this.unsavedBanner.classList.remove('show');
            if (this.btnSaveSettings) this.btnSaveSettings.disabled = true;
            if (this.btnRevertSettings) this.btnRevertSettings.disabled = true;
        }
    }
    
    async handleSaveSettings(e) {
        if (e) e.preventDefault();
        
        this.showToast('Menyimpan pengaturan...', 'success');
        this.settingsPanel.setDisabled(true);
        this.btnSaveSettings.disabled = true;
        this.btnSaveSettings.textContent = 'Menyimpan...';
        
        try {
            const { error: dbError } = await this.supabase
                .from('invitation_settings')
                .update({
                    music_enabled: this.currentSettings.musicEnabled,
                    music_volume: this.currentSettings.musicVolume,
                    loading_duration: this.currentSettings.loadingDuration,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1);
                
            if (dbError) throw dbError;
            
            this.showToast('Pengaturan musik berhasil disimpan', 'success'); // Matches "Pengaturan musik berhasil disimpan" success feedback
            
            // Reload configuration
            await this.loadSettings();
            this.settingsPanel.setValues(this.originalSettings);
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showToast('Gagal menyimpan pengaturan.', 'error');
        } finally {
            this.settingsPanel.setDisabled(false);
            this.btnSaveSettings.textContent = 'Simpan Pengaturan';
            this.btnSaveSettings.disabled = !this.hasChanges;
        }
    }
    
    handleRevertSettings() {
        this.currentSettings = { ...this.originalSettings };
        this.settingsPanel.setValues(this.originalSettings);
        
        // Restore player preview volume
        if (this.audioPlayer) {
            this.audioPlayer.setVolume(this.originalSettings.musicVolume);
        }
        
        this.hasChanges = false;
        this.updateUnsavedBanner();
        this.showToast('Perubahan dibatalkan.', 'success');
    }
    
    // ==========================================
    // DELETE FLOW
    // ==========================================
    
    async handleDeleteMusic() {
        const musicUrl = this.originalSettings.backgroundMusicUrl;
        if (!musicUrl) return;
        
        if (confirm('Apakah Anda yakin ingin menghapus musik latar ini?')) {
            this.showToast('Menghapus...', 'success');
            this.settingsPanel.setDisabled(true);
            if (this.btnDeleteMusic) this.btnDeleteMusic.disabled = true;
            
            try {
                // 1. Delete from Supabase Storage
                if (musicUrl.includes('/music/')) {
                    await StorageService.deleteFile('music', musicUrl);
                }
                
                // 2. Set background_music_url = null in invitation_settings row
                const { error: dbError } = await this.supabase
                    .from('invitation_settings')
                    .update({
                        background_music_url: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', 1);
                    
                if (dbError) throw dbError;
                
                this.showToast('Musik berhasil dihapus', 'success'); // Matches "Musik berhasil dihapus" success feedback
                
                // Reload configuration
                await this.loadSettings();
                
                // Update player & settings values
                this.audioPlayer.unload();
                this.audioPlayer.setDisabled(true);
                this.settingsPanel.setValues(this.originalSettings);
                
            } catch (error) {
                console.error('Failed to delete music:', error);
                this.showToast('Gagal menghapus musik.', 'error');
                if (this.btnDeleteMusic) this.btnDeleteMusic.disabled = false;
            } finally {
                this.settingsPanel.setDisabled(false);
            }
        }
    }
    
    // ==========================================
    // OVERVIEWS & UTILS
    // ==========================================
    
    updateOverviewStats() {
        if (this.statsStatus) {
            this.statsStatus.textContent = this.originalSettings.backgroundMusicUrl ? 'Tersedia' : 'Kosong';
            this.statsStatus.style.color = this.originalSettings.backgroundMusicUrl ? 'var(--green)' : 'var(--red)';
        }
        
        if (this.statsEnabled) {
            this.statsEnabled.textContent = this.originalSettings.musicEnabled ? 'Aktif' : 'Nonaktif';
            this.statsEnabled.style.color = this.originalSettings.musicEnabled ? 'var(--green)' : 'var(--slate)';
        }
        
        if (this.statsVolume) {
            this.statsVolume.textContent = `${Math.round(this.originalSettings.musicVolume * 100)}%`;
        }
        
        if (this.statsTrack) {
            if (this.originalSettings.backgroundMusicUrl) {
                const parts = this.originalSettings.backgroundMusicUrl.split('/');
                const filename = decodeURIComponent(parts[parts.length - 1]);
                this.statsTrack.textContent = filename.length > 20 ? filename.substring(0, 17) + '...' : filename;
                if (this.statsTrackSize) this.statsTrackSize.textContent = 'Audio aktif di Supabase';
            } else {
                this.statsTrack.textContent = 'Belum ada trek';
                if (this.statsTrackSize) this.statsTrackSize.textContent = 'Silakan unggah MP3';
            }
        }
    }
    
    showGlobalLoading(isLoading) {
        if (isLoading) {
            if (this.skeleton) this.skeleton.style.display = 'block';
            if (this.mainPanel) this.mainPanel.style.display = 'none';
        } else {
            if (this.skeleton) this.skeleton.style.display = 'none';
            if (this.mainPanel) this.mainPanel.style.display = 'grid';
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
        
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we are on the music settings page
    if (document.getElementById('music-dropzone')) {
        const musicService = new MusicService();
        musicService.init();
        window.musicService = musicService;
    }
});
