// js/admin.js
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Supabase Credentials inputs
    const inputSbUrl = document.getElementById('admin-sb-url');
    const inputSbKey = document.getElementById('admin-sb-key');
    const btnConnect = document.getElementById('btn-connect-supabase');
    const formMusic = document.getElementById('admin-music-form');

    // Form inputs
    const toggleEnabled = document.getElementById('music-enabled-toggle');
    const sliderVolume = document.getElementById('music-volume-slider');
    const labelVolume = document.getElementById('volume-val');
    const inputDuration = document.getElementById('loading-duration-input');

    // File inputs
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const labelFileName = document.getElementById('file-name-label');
    const btnDeleteAudio = document.getElementById('btn-delete-audio');
    const uploadProgressContainer = document.getElementById('upload-progress-container');
    const uploadProgressFill = document.getElementById('upload-progress-fill');

    // Preview player
    const previewContainer = document.getElementById('audio-preview-container');
    const previewPlayer = document.getElementById('audio-preview-player');

    // Dynamic state
    let supabase = null;
    let selectedFile = null;
    let currentMusicUrl = null;

    // Toast notifications
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        const text = document.getElementById('toast-message');

        toast.className = 'toast show ' + type;
        icon.textContent = type === 'success' ? '✓' : '✗';
        text.textContent = message;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }

    // Auto-load credentials if saved previously
    const savedUrl = localStorage.getItem('supabase_url');
    const savedKey = localStorage.getItem('supabase_anon_key');
    if (savedUrl) inputSbUrl.value = savedUrl;
    if (savedKey) inputSbKey.value = savedKey;

    if (savedUrl && savedKey) {
        connectSupabase(savedUrl, savedKey, true);
    }

    btnConnect.addEventListener('click', () => {
        const url = inputSbUrl.value.trim();
        const key = inputSbKey.value.trim();

        if (!url || !key) {
            showToast('Silakan isi Supabase URL dan Anon Key!', 'error');
            return;
        }

        connectSupabase(url, key);
    });

    async function connectSupabase(url, key, isAuto = false) {
        btnConnect.textContent = 'Menghubungkan...';
        btnConnect.disabled = true;

        try {
            // Temporarily set keys in localStorage for client initialization
            localStorage.setItem('supabase_url', url);
            localStorage.setItem('supabase_anon_key', key);
            
            // Re-initialize config client
            supabase = getSupabaseClient();

            if (!supabase) {
                throw new Error('Supabase client failed to initialize');
            }

            // Test connection by fetching configuration row
            const { data, error } = await supabase
                .from('invitation_settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (error) {
                // If table is missing, try creating or show error message
                throw error;
            }

            // Connection succeeded
            btnConnect.textContent = 'Terhubung ✓';
            btnConnect.style.background = '#10B981';
            btnConnect.disabled = true;

            formMusic.style.display = 'block';
            if (!isAuto) showToast('Koneksi Supabase Berhasil!');

            loadMusicSettings(data);

        } catch (e) {
            localStorage.removeItem('supabase_url');
            localStorage.removeItem('supabase_anon_key');
            supabase = null;
            btnConnect.textContent = 'Hubungkan Supabase';
            btnConnect.disabled = false;
            btnConnect.style.background = '';
            formMusic.style.display = 'none';

            console.error(e);
            showToast('Koneksi Gagal! Pastikan tabel invitation_settings sudah dibuat.', 'error');
        }
    }

    function loadMusicSettings(settings) {
        if (!settings) return;

        toggleEnabled.checked = !!settings.music_enabled;
        sliderVolume.value = typeof settings.music_volume === 'number' ? settings.music_volume : 0.4;
        labelVolume.textContent = Math.round(sliderVolume.value * 100) + '%';
        inputDuration.value = typeof settings.loading_duration === 'number' ? settings.loading_duration : 3000;
        
        currentMusicUrl = settings.background_music_url;

        if (currentMusicUrl) {
            // Extract filename from URL
            const filename = currentMusicUrl.split('/').pop().split('?')[0];
            labelFileName.textContent = decodeURIComponent(filename) || 'File Aktif di Supabase';
            fileInfo.style.display = 'flex';
            
            previewPlayer.src = currentMusicUrl;
            previewContainer.style.display = 'flex';
        } else {
            fileInfo.style.display = 'none';
            previewContainer.style.display = 'none';
            previewPlayer.src = '';
        }
    }

    // Volume Slider listener
    sliderVolume.addEventListener('input', () => {
        labelVolume.textContent = Math.round(sliderVolume.value * 100) + '%';
    });

    // Drop Zone Listeners
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    ['dragleave', 'dragend'].forEach(type => {
        dropZone.addEventListener(type, () => {
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelection(e.target.files[0]);
        }
    });

    function handleFileSelection(file) {
        const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/x-m4a', 'audio/mp4'];
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        const isValidType = validTypes.includes(file.type) || ['mp3', 'm4a'].includes(fileExt);

        if (!isValidType) {
            showToast('Format file ditolak! Hanya mendukung file MP3 atau M4A.', 'error');
            return;
        }

        // Limit size to 15MB
        if (file.size > 15 * 1024 * 1024) {
            showToast('Ukuran file terlalu besar! Maksimal ukuran file 15MB.', 'error');
            return;
        }

        selectedFile = file;
        labelFileName.textContent = file.name + ' (Siap diunggah)';
        fileInfo.style.display = 'flex';

        // Set local object URL to preview before uploading
        const objectUrl = URL.createObjectURL(file);
        previewPlayer.src = objectUrl;
        previewContainer.style.display = 'flex';
    }

    // Delete selected or active audio
    btnDeleteAudio.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        
        if (previewPlayer.src.startsWith('blob:')) {
            URL.revokeObjectURL(previewPlayer.src);
        }

        if (currentMusicUrl) {
            currentMusicUrl = null;
            showToast('Audio dihapus. Klik Simpan untuk memperbarui database.');
        } else {
            showToast('Pilihan audio dibatalkan.');
        }

        fileInfo.style.display = 'none';
        previewContainer.style.display = 'none';
        previewPlayer.src = '';
    });

    // Save Form Config
    formMusic.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!supabase) {
            showToast('Koneksi Supabase hilang. Silakan hubungkan ulang.', 'error');
            return;
        }

        const btnSave = document.getElementById('btn-save-settings');
        btnSave.textContent = 'Menyimpan...';
        btnSave.disabled = true;

        try {
            let musicUrl = currentMusicUrl;

            // Upload selected file if exists
            if (selectedFile) {
                uploadProgressContainer.style.display = 'block';
                uploadProgressFill.style.width = '10%';

                const timestamp = Date.now();
                const fileExt = selectedFile.name.split('.').pop();
                const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                const filePath = `background_music_${timestamp}.${fileExt}`;

                uploadProgressFill.style.width = '35%';

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('music')
                    .upload(filePath, selectedFile, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                uploadProgressFill.style.width = '70%';

                // Get Public URL
                const { data: urlData } = supabase.storage
                    .from('music')
                    .getPublicUrl(filePath);

                musicUrl = urlData.publicUrl;
                currentMusicUrl = musicUrl;
                selectedFile = null;
                fileInput.value = '';

                uploadProgressFill.style.width = '100%';
                setTimeout(() => {
                    uploadProgressContainer.style.display = 'none';
                }, 800);
            }

            // Duration boundaries check
            let duration = parseInt(inputDuration.value, 10) || 3000;
            if (duration < 2000) duration = 2000;
            if (duration > 4000) duration = 4000;
            inputDuration.value = duration;

            // Save Settings details row to database
            const { error: updateError } = await supabase
                .from('invitation_settings')
                .update({
                    music_enabled: toggleEnabled.checked,
                    music_volume: parseFloat(sliderVolume.value),
                    loading_duration: duration,
                    background_music_url: musicUrl,
                    music_updated_at: new Date().toISOString()
                })
                .eq('id', 1);

            if (updateError) throw updateError;

            showToast('Konfigurasi musik latar berhasil disimpan!');
            
            // Reload configuration data preview
            const filename = musicUrl ? musicUrl.split('/').pop().split('?')[0] : '';
            labelFileName.textContent = decodeURIComponent(filename) || 'File Aktif di Supabase';
            
            if (musicUrl) {
                previewPlayer.src = musicUrl;
                previewContainer.style.display = 'flex';
            }

        } catch (error) {
            console.error('Save configuration failed:', error);
            showToast('Gagal menyimpan konfigurasi: ' + error.message, 'error');
            uploadProgressContainer.style.display = 'none';
        } finally {
            btnSave.textContent = 'Simpan Konfigurasi';
            btnSave.disabled = false;
        }
    });
});
