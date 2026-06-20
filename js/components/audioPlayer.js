// js/components/audioPlayer.js
'use strict';

/**
 * Custom audio player UI component wrapping native HTML5 Audio element.
 */
class AudioPlayerComponent {
    constructor({ toggleBtn, timelineTrack, timelineFill, timeCurrent, timeDuration, muteBtn, volumeSlider }) {
        this.toggleBtn = toggleBtn;
        this.timelineTrack = timelineTrack;
        this.timelineFill = timelineFill;
        this.timeCurrent = timeCurrent;
        this.timeDuration = timeDuration;
        this.muteBtn = muteBtn;
        this.volumeSlider = volumeSlider;
        
        this.audio = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.preMuteVolume = 0.4;
        
        this.init();
    }
    
    init() {
        if (!this.toggleBtn) return;
        
        // Play/Pause button
        this.toggleBtn.addEventListener('click', () => this.togglePlay());
        
        // Mute button
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        
        // Volume slider
        this.volumeSlider.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            this.setVolume(vol);
        });
        
        // Seek Timeline click
        this.timelineTrack.addEventListener('click', (e) => this.handleSeek(e));
    }
    
    load(audioUrl) {
        // Stop and clear previous audio instance
        this.unload();
        
        if (!audioUrl) {
            this.setDisabled(true);
            return;
        }
        
        this.audio = new Audio(audioUrl);
        this.audio.preload = 'metadata';
        
        // Bind audio element events
        this.audio.addEventListener('loadedmetadata', () => {
            this.timeDuration.textContent = this.formatTime(this.audio.duration);
        });
        
        this.audio.addEventListener('timeupdate', () => {
            if (!this.audio) return;
            const current = this.audio.currentTime;
            const duration = this.audio.duration || 0;
            
            // Format labels
            this.timeCurrent.textContent = this.formatTime(current);
            if (duration > 0) {
                this.timeDuration.textContent = this.formatTime(duration);
                const percent = (current / duration) * 100;
                this.timelineFill.style.width = `${percent}%`;
            }
        });
        
        this.audio.addEventListener('ended', () => {
            this.setPlayingState(false);
            if (this.timelineFill) this.timelineFill.style.width = '0%';
            if (this.timeCurrent) this.timeCurrent.textContent = '0:00';
        });
        
        // Set default volume
        const vol = parseFloat(this.volumeSlider.value);
        this.audio.volume = vol;
        this.audio.muted = this.isMuted;
        
        this.setDisabled(false);
    }
    
    unload() {
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        this.setPlayingState(false);
        if (this.timelineFill) this.timelineFill.style.width = '0%';
        if (this.timeCurrent) this.timeCurrent.textContent = '0:00';
        if (this.timeDuration) this.timeDuration.textContent = '0:00';
    }
    
    togglePlay() {
        if (!this.audio) return;
        
        if (this.isPlaying) {
            this.audio.pause();
            this.setPlayingState(false);
        } else {
            this.audio.play()
                .then(() => {
                    this.setPlayingState(true);
                })
                .catch(e => {
                    console.error('Audio playback failed:', e);
                });
        }
    }
    
    setPlayingState(isPlaying) {
        this.isPlaying = isPlaying;
        if (this.toggleBtn) {
            this.toggleBtn.textContent = isPlaying ? '❚❚' : '▶';
        }
    }
    
    toggleMute() {
        if (!this.audio) return;
        
        this.isMuted = !this.isMuted;
        this.audio.muted = this.isMuted;
        
        this.updateVolumeUI();
    }
    
    setVolume(vol) {
        if (vol > 0) {
            this.isMuted = false;
        }
        
        if (this.audio) {
            this.audio.volume = vol;
            this.audio.muted = this.isMuted;
        }
        
        this.volumeSlider.value = vol;
        this.updateVolumeUI();
    }
    
    updateVolumeUI() {
        const vol = parseFloat(this.volumeSlider.value);
        
        if (this.isMuted || vol === 0) {
            this.muteBtn.textContent = '🔇';
        } else if (vol < 0.5) {
            this.muteBtn.textContent = '🔉';
        } else {
            this.muteBtn.textContent = '🔊';
        }
    }
    
    handleSeek(e) {
        if (!this.audio || !this.audio.duration) return;
        
        const rect = this.timelineTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        
        const percent = clickX / width;
        const seekTime = percent * this.audio.duration;
        
        this.audio.currentTime = seekTime;
        this.timelineFill.style.width = `${percent * 100}%`;
    }
    
    setDisabled(isDisabled) {
        if (this.toggleBtn) this.toggleBtn.disabled = isDisabled;
        if (this.muteBtn) this.muteBtn.disabled = isDisabled;
        if (this.volumeSlider) this.volumeSlider.disabled = isDisabled;
        
        if (isDisabled) {
            this.setPlayingState(false);
            if (this.timelineTrack) this.timelineTrack.style.pointerEvents = 'none';
        } else {
            if (this.timelineTrack) this.timelineTrack.style.pointerEvents = 'all';
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds) || seconds === Infinity) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
}

// Bind to window object
window.AudioPlayerComponent = AudioPlayerComponent;
