/**
 * Big Wheels Birthday Adventure
 * Opening Experience — Story Orchestration Engine
 *
 * Flow:
 *   Stage 1 (Intro)    → truck drives in → headline fades → auto-advance CTA
 *   Stage 2 (Package)  → package drops   → "Open Delivery" button
 *   Stage 3 (Envelope) → envelope shown  → "Open Invitation" cracks seal → card rises
 *   Stage 4 (Enter)    → loading bar     → handoff to next page
 */

'use strict';

/* ══════════════════════════════════════════
   GUEST NAME — Dynamic URL parameter
   Usage: ?name=Sarah or #name=Sarah
══════════════════════════════════════════ */
let GUEST_NAME = 'Teman';
let CHILD_NAME = 'Alfath';
let WHATSAPP_PHONE = '6281234567890';

// Background Music Configuration Variables
let bgAudio = null;
let musicEnabled = false;
let defaultVolume = 0.4;
let configuredLoadingDuration = 3000; // default loading screen duration (3s)
let countdownTarget = new Date("July 12, 2026 15:00:00 GMT+0700").getTime();

// Global Application State
const AppState = {
    settings: null,
    gallery: null,
    guest: null
};

function formatIndonesianDate(dateStr) {
    if (!dateStr) return '';
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    return `${dayName}, ${day} ${monthName} ${year}`;
}

function capitalizeSlug(slug) {
    if (!slug) return 'Teman';
    if (slug.toLowerCase() === 'teman') return 'Teman';
    return slug
        .replace(/[-_]+/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function adjustColorBrightness(hex, percent) {
    hex = hex.replace(/^\s*#|\s*$/g, '');
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, '$1$1');
    }
    let r = parseInt(hex.substr(0, 2), 16),
        g = parseInt(hex.substr(2, 2), 16),
        b = parseInt(hex.substr(4, 2), 16);

    r = Math.min(255, Math.max(0, parseInt(r + (r * percent / 100))));
    g = Math.min(255, Math.max(0, parseInt(g + (g * percent / 100))));
    b = Math.min(255, Math.max(0, parseInt(b + (b * percent / 100))));

    const rHex = ('0' + r.toString(16)).slice(-2);
    const gHex = ('0' + g.toString(16)).slice(-2);
    const bHex = ('0' + b.toString(16)).slice(-2);

    return `#${rHex}${gHex}${bHex}`;
}

async function fetchApplicationData() {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    // Support both 'to' and 'name' parameters
    const rawSlug = params.get('to') || params.get('name') || hashParams.get('to') || hashParams.get('name') || '';
    const slug = rawSlug.replace(/<[^>]*>/g, '').trim().slice(0, 40);

    try {
        // Run parallel queries to minimize Supabase network requests and latency
        const promises = [
            typeof db !== 'undefined' ? db.getSettings() : Promise.resolve(null),
            typeof db !== 'undefined' ? db.getGallery() : Promise.resolve(null),
            (slug && typeof db !== 'undefined') ? db.getGuestBySlug(slug) : Promise.resolve(null)
        ];

        const [settings, gallery, guest] = await Promise.all(promises);

        AppState.settings = settings;
        AppState.gallery = gallery;
        AppState.guest = guest;

        // Cache settings & gallery locally for offline/fallback stability
        if (settings) {
            localStorage.setItem('cached_settings', JSON.stringify(settings));
        }
        if (gallery) {
            localStorage.setItem('cached_gallery', JSON.stringify(gallery));
        }
    } catch (err) {
        console.error('Failed to pre-fetch application database content, loading from cache:', err);
        
        // Load fallback caches if Supabase is offline
        try {
            const cachedSettings = localStorage.getItem('cached_settings');
            const cachedGallery = localStorage.getItem('cached_gallery');
            if (cachedSettings) {
                AppState.settings = JSON.parse(cachedSettings);
                console.log('Restored settings from cache.');
            }
            if (cachedGallery) {
                AppState.gallery = JSON.parse(cachedGallery);
                console.log('Restored gallery from cache.');
            }
        } catch (cacheErr) {
            console.error('Failed to read from localStorage cache:', cacheErr);
        }
    }
}

function renderDynamicContent() {
    // 1. Resolve Dynamic Guest Profile
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    const rawSlug = params.get('to') || params.get('name') || hashParams.get('to') || hashParams.get('name') || '';
    const slug = rawSlug.replace(/<[^>]*>/g, '').trim().slice(0, 40);

    if (AppState.guest && AppState.guest.guest_name) {
        GUEST_NAME = AppState.guest.guest_name;
    } else if (slug) {
        GUEST_NAME = capitalizeSlug(slug);
    } else {
        GUEST_NAME = 'Teman';
    }
    injectGuestNames();

    // 2. Load & Override settings
    const settings = AppState.settings;
    if (settings) {
        if (settings.child_name) {
            CHILD_NAME = settings.child_name;
        }
        if (settings.whatsapp_number) {
            WHATSAPP_PHONE = settings.whatsapp_number;
        }

        const childName = settings.child_name || 'Alfath';
        const childAge = settings.child_age || 'DUA';

        // Override default style color theme dynamics
        if (settings.theme_color) {
            document.documentElement.style.setProperty('--orange', settings.theme_color);
            const darkerColor = adjustColorBrightness(settings.theme_color, -15);
            document.documentElement.style.setProperty('--orange-d', darkerColor);
        }

        // Update Cover Screen Title & Subtitle
        const introHeadline = document.getElementById('intro-headline');
        if (introHeadline) {
            const titleEl = introHeadline.querySelector('h1');
            if (titleEl && settings.cover_title) {
                const subText = settings.cover_subtitle ? `<br><em>${escapeHtml(settings.cover_subtitle)}</em>` : '';
                titleEl.innerHTML = `${escapeHtml(settings.cover_title)}${subText}`;
            }
        }

        // Update Title & SEO Meta Tags Dynamically
        const pageTitle = `Kiriman Spesial — ${childName} Genap ${childAge.toLowerCase()} Tahun 🚛`;
        document.title = pageTitle;

        // Dynamic Canonical and Open Graph URL
        const currentUrl = window.location.href;
        const canonicalLink = document.getElementById('canonical-link');
        if (canonicalLink) canonicalLink.href = currentUrl;
        
        const ogUrl = document.getElementById('og-url');
        if (ogUrl) ogUrl.content = currentUrl;
        const twitterUrl = document.getElementById('twitter-url');
        if (twitterUrl) twitterUrl.content = currentUrl;

        // Dynamic description
        const descText = settings.hero_description || `Sebuah kiriman ulang tahun spesial telah tiba untukmu. Buka undanganmu untuk bergabung di Pesta Ulang Tahun milik ${childName}.`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.content = descText;

        const ogDesc = document.getElementById('og-description');
        if (ogDesc) ogDesc.content = descText;
        const twitterDesc = document.getElementById('twitter-description');
        if (twitterDesc) twitterDesc.content = descText;

        // Dynamic Title tags
        const shareTitle = settings.cover_title || `Kiriman Ulang Tahun Spesial ${childName} 🚛`;
        const ogTitle = document.getElementById('og-title');
        if (ogTitle) ogTitle.content = shareTitle;
        const twitterTitle = document.getElementById('twitter-title');
        if (twitterTitle) twitterTitle.content = shareTitle;

        // Dynamic Image tags (Hero Image)
        const shareImage = settings.hero_image_url ? `${window.location.origin}/${settings.hero_image_url}` : `${window.location.origin}/images/hero_cake.png`;
        const ogImage = document.getElementById('og-image');
        if (ogImage) ogImage.content = shareImage;
        const twitterImage = document.getElementById('twitter-image');
        if (twitterImage) twitterImage.content = shareImage;

        // Inject Structured Metadata JSON-LD
        let structuredDataScript = document.getElementById('structured-data-event');
        if (!structuredDataScript) {
            structuredDataScript = document.createElement('script');
            structuredDataScript.id = 'structured-data-event';
            structuredDataScript.type = 'application/ld+json';
            document.head.appendChild(structuredDataScript);
        }
        
        const eventSchema = {
            "@context": "https://schema.org",
            "@type": "Event",
            "name": `Pesta Ulang Tahun ${childName} Ke-${childAge} 🚛`,
            "startDate": settings.event_date ? `${settings.event_date}T15:00:00+07:00` : "2026-07-12T15:00:00+07:00",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "eventStatus": "https://schema.org/EventScheduled",
            "location": {
                "@type": "Place",
                "name": settings.location_name || "Kediaman Alfath",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": settings.full_address || "Jl. Melati No. 24, Cilandak Barat",
                    "addressLocality": "Jakarta Selatan",
                    "addressRegion": "DKI Jakarta",
                    "addressCountry": "ID"
                }
            },
            "image": [ shareImage ],
            "description": descText
        };
        structuredDataScript.textContent = JSON.stringify(eventSchema, null, 2);

        // Update Truck SVG
        const truckText = document.querySelector('#truck-vehicle svg text');
        if (truckText) {
            truckText.textContent = childName.toUpperCase();
        }

        // Update Package Label
        const pkgLabelFrom = document.querySelector('.pkg-label-from');
        if (pkgLabelFrom) {
            pkgLabelFrom.textContent = `Dari: ${childName} 🚛`;
        }

        // Update Enter screen sub
        const enterSub = document.querySelector('.enter-sub');
        if (enterSub) {
            enterSub.textContent = `Tunggu sebentar, pesta ${childName} hampir siap!`;
        }

        // Update Hero Headline
        const hlName = document.querySelector('.hl-name');
        if (hlName) hlName.textContent = childName.toUpperCase();
        const hlNumber = document.querySelector('.hl-number');
        if (hlNumber) hlNumber.textContent = childAge.toUpperCase();

        // Update Hero Description / subheadline
        const heroSubheadline = document.querySelector('.hero-subheadline');
        if (heroSubheadline && settings.hero_description) {
            heroSubheadline.textContent = settings.hero_description;
        }

        // Update Countdown Subtitle
        const countdownSubtitle = document.querySelector('#countdown-section .sec-subtitle');
        if (countdownSubtitle) {
            countdownSubtitle.textContent = `Hitung mundur menuju perayaan ulang tahun ${childName}.`;
        }

        // Update Detail Cards
        const detailDate = document.querySelector('#details-section .detail-card:nth-child(1) .detail-value');
        if (detailDate && settings.event_date) {
            detailDate.textContent = formatIndonesianDate(settings.event_date);
        }
        const detailTime = document.querySelector('#details-section .detail-card:nth-child(2) .detail-value');
        if (detailTime && settings.event_time) {
            detailTime.textContent = settings.event_time;
        }
        const detailVenue = document.querySelector('#details-section .detail-card:nth-child(3) .detail-value');
        if (detailVenue) {
            const locName = settings.location_name || 'Kediaman Alfath';
            const fullAddr = settings.full_address || 'Jl. Melati No. 24, Jakarta Selatan';
            detailVenue.innerHTML = `${escapeHtml(locName)}<br>${escapeHtml(fullAddr)}`;
        }

        // Update Location Info
        const locVenueName = document.querySelector('.location-venue-name');
        if (locVenueName) locVenueName.textContent = settings.location_name || 'Kediaman Alfath';
        const locAddress = document.querySelector('.location-address');
        if (locAddress) locAddress.textContent = settings.full_address || 'Jl. Melati No. 24, Jakarta Selatan';

        const btnLocation = document.querySelector('.btn-location');
        if (btnLocation && settings.google_maps_url) {
            btnLocation.href = settings.google_maps_url;
        }

        const mapIframe = document.querySelector('.map-wrapper iframe');
        if (mapIframe && settings.google_maps_url && settings.google_maps_url.includes('google.com/maps/embed')) {
            mapIframe.src = settings.google_maps_url;
        }

        // Update Hero Image with validation fallback
        const heroImage = document.querySelector('.hero-image');
        if (heroImage) {
            heroImage.src = settings.hero_image_url || 'images/hero_cake.png';
        }

        // Update Countdown Target Date
        if (settings.event_date) {
            let timeStr = "15:00:00";
            if (settings.event_time) {
                const match = settings.event_time.match(/(\d{2}:\d{2})/);
                if (match) {
                    timeStr = match[1] + ":00";
                }
            }
            countdownTarget = new Date(`${settings.event_date}T${timeStr}+07:00`).getTime();
        }

        // Update Background Music settings
        musicEnabled = !!settings.music_enabled;
        defaultVolume = typeof settings.music_volume === 'number' ? settings.music_volume : 0.4;
        configuredLoadingDuration = typeof settings.loading_duration === 'number' ? settings.loading_duration : 3000;

        if (configuredLoadingDuration < 2000) configuredLoadingDuration = 2000;
        if (configuredLoadingDuration > 4000) configuredLoadingDuration = 4000;

        // Hide music controls floating button if music is disabled or URL is missing
        const musicBtn = document.getElementById('floating-music-btn');
        if (musicBtn) {
            if (!musicEnabled || !settings.background_music_url) {
                musicBtn.style.display = 'none';
            } else {
                musicBtn.style.display = 'flex';
            }
        }

        if (musicEnabled && settings.background_music_url) {
            bgAudio = new Audio(settings.background_music_url);
            bgAudio.loop = true;
            bgAudio.volume = defaultVolume;
            bgAudio.preload = 'auto';
            
            // Graceful error handling for audio load failure
            bgAudio.addEventListener('error', (e) => {
                console.warn('Background music failed to load gracefully:', e);
                const floatMusicBtn = document.getElementById('floating-music-btn');
                if (floatMusicBtn) {
                    floatMusicBtn.style.display = 'none';
                }
            });

            bgAudio.load();
        }
    }

    // 3. Load dynamic gallery images
    const images = AppState.gallery;
    if (images && images.length > 0) {
        const grid = document.querySelector('.gallery-grid');
        if (grid) {
            grid.innerHTML = '';
            images.forEach((img, idx) => {
                const title = img.image_title || `Momen Ulang Tahun ${idx + 1}`;
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.setAttribute('data-src', img.image_url);
                item.setAttribute('data-caption', title);
                item.innerHTML = `
                    <div class="gallery-img-container">
                        <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(title)}" class="gallery-img" loading="lazy">
                        <div class="gallery-overlay">
                            <span class="gallery-zoom-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    <line x1="11" y1="8" x2="11" y2="14"></line>
                                    <line x1="8" y1="11" x2="14" y2="11"></line>
                                </svg>
                            </span>
                            <h4 class="gallery-item-title">${escapeHtml(title)}</h4>
                            <p class="gallery-item-desc">Ketuk untuk memperbesar</p>
                        </div>
                    </div>
                `;
                grid.appendChild(item);
            });
        }
    }
}

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('fade-out');
        setTimeout(() => {
            preloader.remove();
        }, 600);
    }
}

/* ══════════════════════════════════════════
   SOUND EFFECTS — Web Audio API Synthesizer
   No external files or loading required
   ══════════════════════════════════════════ */
const SoundFX = {
    ctx: null,
    engineNode: null,

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.ctx = new AudioContext();
        }
    },

    resume() {
        this.init();
        if (!this.ctx) return Promise.reject(new Error('AudioContext not supported'));
        
        // Prevent calling resume if the page has not received user activation
        if (window.navigator && navigator.userActivation && !navigator.userActivation.hasBeenActive) {
            return Promise.reject(new Error('AudioContext blocked: No user activation'));
        }
        
        if (this.ctx.state === 'suspended') {
            return this.ctx.resume();
        }
        return Promise.resolve();
    },

    playEngine() {
        if (this.engineNode) return; // already playing
        
        this.resume().then(() => {
            if (!this.ctx || this.engineNode) return;
            const ctx = this.ctx;
            
            // Low rumble oscillator
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = 45; // low frequency

            // Filter to make it a deep rumble
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 180;

            // LFO to modulate gain (engine cylinders chugging)
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 9; // 9Hz modulation

            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 0.2;

            const mainGain = ctx.createGain();
            mainGain.gain.value = 0.05; // soft volume

            lfo.connect(lfoGain);
            lfoGain.connect(mainGain.gain);

            osc.connect(filter);
            filter.connect(mainGain);
            mainGain.connect(ctx.destination);

            osc.start();
            lfo.start();

            this.engineNode = { osc, lfo, mainGain };
        }).catch(() => {});
    },

    stopEngine() {
        if (!this.engineNode) return;
        
        const mainGain = this.engineNode.mainGain;
        if (this.ctx && mainGain) {
            try {
                mainGain.gain.setValueAtTime(mainGain.gain.value, this.ctx.currentTime);
                mainGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
            } catch (e) {}
        }

        const osc = this.engineNode.osc;
        const lfo = this.engineNode.lfo;
        setTimeout(() => {
            try { osc.stop(); } catch(e) {}
            try { lfo.stop(); } catch(e) {}
        }, 500);

        this.engineNode = null;
    },

    playOpenPackage() {
        this.resume().then(() => {
            if (!this.ctx) return;
            const ctx = this.ctx;
            const now = ctx.currentTime;

            // Part 1: Crate/Box sliding sound (short noise burst)
            const bufferSize = ctx.sampleRate * 0.3; // 300ms
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 1000;
            noiseFilter.Q.value = 2;

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.04, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start(now);

            // Part 2: Magic Chime (5 quick notes)
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
            notes.forEach((freq, idx) => {
                const time = now + idx * 0.06; // 60ms delay
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time);

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.08, time + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(time);
                osc.stop(time + 0.5);
            });
        }).catch(() => {});
    },

    playOpenEnvelope() {
        this.resume().then(() => {
            if (!this.ctx) return;
            const ctx = this.ctx;
            const now = ctx.currentTime;

            // Part 1: Paper tear/rip (white noise with filter modulation)
            const bufferSize = ctx.sampleRate * 0.4; // 400ms
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(800, now);
            noiseFilter.frequency.exponentialRampToValueAtTime(2200, now + 0.3);
            noiseFilter.Q.value = 3;

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(0.06, now + 0.05);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start(now);

            // Part 2: Soft chime reveal (3 notes)
            const notes = [880.00, 1174.66, 1760.00]; // A5, D6, A6
            notes.forEach((freq, idx) => {
                const time = now + 0.15 + idx * 0.08;
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time);

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.06, time + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(time);
                osc.stop(time + 0.6);
            });
        }).catch(() => {});
    },

    playLightboxOpen() {
        this.resume().then(() => {
            if (!this.ctx) return;
            const ctx = this.ctx;
            const now = ctx.currentTime;

            // Soft elegant chime notes
            const notes = [587.33, 659.25, 880.00, 1046.50]; // D5, E5, A5, C6
            notes.forEach((freq, idx) => {
                const time = now + idx * 0.08;
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time);

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.04, time + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(time);
                osc.stop(time + 0.5);
            });
        }).catch(() => {});
    }
};

// Global handlers for start interaction
function handleIntroInteraction(e) {
    if (e && e.isTrusted === false) return;
    SoundFX.playEngine();
    cleanupIntroInteraction();
}
function cleanupIntroInteraction() {
    document.removeEventListener('click', handleIntroInteraction);
    document.removeEventListener('touchstart', handleIntroInteraction);
}

/* ══════════════════════════════════════════
   DOM References
══════════════════════════════════════════ */
const stages = {
    intro: document.getElementById('stage-intro'),
    package: document.getElementById('stage-package'),
    envelope: document.getElementById('stage-envelope'),
    enter: document.getElementById('stage-enter'),
};

const els = {
    // Stage 1
    truckVehicle: document.getElementById('truck-vehicle'),
    introHeadline: document.getElementById('intro-headline'),
    btnSkip: document.getElementById('btn-skip-intro'),

    // Stage 2
    pkgGuestName: document.getElementById('pkg-guest-name'),
    packageBox: document.getElementById('package-box'),
    btnOpenPkg: document.getElementById('btn-open-package'),

    // Stage 3
    invGuestName: document.getElementById('inv-guest-name'),
    theEnvelope: document.getElementById('the-envelope'),
    envFlap: document.getElementById('env-flap'),
    envSeal: document.getElementById('env-seal'),
    invCard: document.getElementById('inv-card'),
    btnOpenEnv: document.getElementById('btn-open-envelope'),
    envCtaArea: document.getElementById('env-cta-area'),
    envHint: document.getElementById('env-hint'),

    // Stage 4
    progressBar: document.getElementById('enter-progress-bar'),
};

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */

/**
 * Switch active stage with a cross-fade overlay.
 * @param {HTMLElement} fromStage
 * @param {HTMLElement} toStage
 * @param {Function}    onReady  called once toStage is visible
 */
function switchStage(fromStage, toStage, onReady) {
    // Fade out current
    fromStage.classList.add('fade-out');
    fromStage.classList.remove('active');

    setTimeout(() => {
        fromStage.classList.remove('fade-out');
        toStage.classList.add('active');
        if (typeof onReady === 'function') onReady();
    }, 650);
}

/** Prevent double-triggers */
function once(fn) {
    let called = false;
    return function (...args) {
        if (called) return;
        called = true;
        fn.apply(this, args);
    };
}

/* ══════════════════════════════════════════
   INJECT GUEST NAMES
══════════════════════════════════════════ */
function injectGuestNames() {
    if (els.pkgGuestName) els.pkgGuestName.textContent = GUEST_NAME;
    if (els.invGuestName) els.invGuestName.textContent = GUEST_NAME;
    const rsvpInput = document.getElementById('rsvp-name');
    if (rsvpInput && GUEST_NAME && GUEST_NAME !== 'Teman') {
        rsvpInput.value = GUEST_NAME;
    }
}

/* ══════════════════════════════════════════
   STAGE 1 — CINEMATIC INTRO
══════════════════════════════════════════ */
function initStageIntro() {
    // Start engine sound on first click/interaction anywhere in intro
    document.addEventListener('click', handleIntroInteraction);
    document.addEventListener('touchstart', handleIntroInteraction);

    // The truck animation starts via CSS (animation on .truck-vehicle)
    // We only need to wire up the CTA that appears after the headline

    // After truck finishes + headline fades in → attach a "tap anywhere" CTA
    // The headline has animation-delay: 4.2s, so we add a click CTA ~5s in
    const advanceIntro = once(goToPackage);

    // "Tap anywhere" after 5.5s
    const tapTimer = setTimeout(() => {
        // Add subtle nudge text below headline
        const nudge = document.createElement('p');
        nudge.className = 'tap-nudge';
        nudge.textContent = 'Ketuk di mana saja untuk mengambil kirimanmu →';
        nudge.style.cssText = `
            position: absolute;
            bottom: 14%;
            left: 50%;
            transform: translateX(-50%);
            font-family: 'Inter', sans-serif;
            font-size: 0.85rem;
            color: rgba(148,163,184,0.9);
            letter-spacing: 0.5px;
            white-space: nowrap;
            animation: hintBlink 2s ease-in-out infinite;
            cursor: pointer;
        `;
        stages.intro.appendChild(nudge);
        nudge.addEventListener('click', advanceIntro, { once: true });
        stages.intro.addEventListener('click', advanceIntro, { once: true });
    }, 5500);

    // Skip button
    els.btnSkip.addEventListener('click', once(() => {
        clearTimeout(tapTimer);
        goToPackage();
    }), { once: true });
}

function goToPackage() {
    cleanupIntroInteraction();
    SoundFX.stopEngine();
    switchStage(stages.intro, stages.package, () => {
        // Trigger package drop animation
        if (els.packageBox) {
            els.packageBox.style.animation = 'packageDrop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
        }
    });
}

/* ══════════════════════════════════════════
   STAGE 2 — PACKAGE REVEAL
══════════════════════════════════════════ */
function initStagePackage() {

    const openPackage = once(() => {
        // Play unwrap & magic chime sound
        SoundFX.playOpenPackage();

        // Haptic feedback on mobile
        if ('vibrate' in navigator) navigator.vibrate([30, 20, 50]);

        // Lid lift animation
        if (els.packageBox) {
            const lid = els.packageBox.querySelector('.pkg-lid');
            if (lid) {
                lid.style.cssText += `
                    transform-origin: top center;
                    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    transform: translateY(-60px) rotateX(-40deg);
                    opacity: 0.6;
                `;
            }
        }

        // A brief pause then transition to envelope
        setTimeout(() => {
            switchStage(stages.package, stages.envelope, () => {
                // Envelope entrance bounce is handled by CSS
                // Enable the envelope interactions
            });
        }, 700);
    });

    if (els.btnOpenPkg) {
        els.btnOpenPkg.addEventListener('click', openPackage, { once: true });
    }
}

/* ══════════════════════════════════════════
   STAGE 3 — ENVELOPE REVEAL
══════════════════════════════════════════ */
function initStageEnvelope() {

    let isOpened = false;

    function openEnvelope() {
        if (isOpened) return;
        isOpened = true;

        // Play paper tear & reveal chime sound
        SoundFX.playOpenEnvelope();

        if ('vibrate' in navigator) navigator.vibrate([20, 10, 40]);

        // 1. Crack / remove seal
        if (els.envSeal) {
            els.envSeal.classList.add('cracked');
        }

        // 2. Flap opens (after 300ms)
        setTimeout(() => {
            if (els.envFlap) {
                els.envFlap.classList.add('opened');
            }
        }, 300);

        // 3. Card rises (after 900ms)
        setTimeout(() => {
            if (els.invCard) {
                els.invCard.classList.add('revealed');
            }
        }, 900);

        // 4. Hide hint & button, show "entering" message (after 1800ms)
        setTimeout(() => {
            if (els.envCtaArea) {
                els.envCtaArea.style.opacity = '0';
                els.envCtaArea.style.pointerEvents = 'none';
            }

            // Show a brief message then go to enter stage
            const readyMsg = document.createElement('p');
            readyMsg.textContent = "Undanganmu sudah siap! 🎉";
            readyMsg.style.cssText = `
                font-family: 'Poppins', sans-serif;
                font-size: 1.1rem;
                font-weight: 600;
                color: #FAFAF9;
                text-align: center;
                animation: headlineFadeIn 0.6s ease-out forwards;
                margin-top: 20px;
            `;
            const scene = document.querySelector('.env-scene');
            if (scene) scene.appendChild(readyMsg);

        }, 1800);

        // 5. Transition to enter stage
        setTimeout(() => {
            switchStage(stages.envelope, stages.enter, startEnterAnimation);
        }, 2600);
    }

    // Button click
    if (els.btnOpenEnv) {
        els.btnOpenEnv.addEventListener('click', once(openEnvelope), { once: true });
    }

    // Tapping the envelope itself also works
    if (els.theEnvelope) {
        els.theEnvelope.addEventListener('click', once(openEnvelope), { once: true });
    }
}

/* ══════════════════════════════════════════
   STAGE 4 — ENTER / LOADING TRANSITION
══════════════════════════════════════════ */
/* ══════════════════════════════════════════
   STAGE 4 — ENTER / LOADING TRANSITION
   ══════════════════════════════════════════ */
function startEnterAnimation() {
    const bar = els.progressBar;
    if (!bar) return;

    let progress = 0;
    const startTime = Date.now();
    const duration = configuredLoadingDuration; // Configurable duration from Supabase

    function updateProgress() {
        const elapsed = Date.now() - startTime;
        progress = Math.min((elapsed / duration) * 100, 100);
        bar.style.width = progress + '%';

        if (progress < 100) {
            requestAnimationFrame(updateProgress);
        } else {
            setTimeout(handOff, 400); // short premium pause
        }
    }

    requestAnimationFrame(updateProgress);
}

/**
 * Hand-off: this is where you'd reveal the full invitation content.
 * Currently it scrolls past the opening experience.
 * Replace this with your navigation / reveal logic.
 */
function handOff() {
    // Start playback attempt for background music synchronized with fade-in
    if (bgAudio && musicEnabled) {
        const isSessionPaused = sessionStorage.getItem('music_paused') === 'true';
        if (!isSessionPaused) {
            playMusicSilently();
        }
    }

    // 1. Fade out the stage-enter loading stage
    const enterStage = stages.enter;
    if (enterStage) {
        enterStage.classList.add('fade-out');
        enterStage.classList.remove('active');
    }

    // 2. Reveal the main invitation content after a short fade-out transition delay
    setTimeout(() => {
        const mainInvite = document.getElementById('main-invitation');
        if (mainInvite) {
            mainInvite.classList.add('visible');
            
            // Restore natural scrolling on the body once the opening experience is complete
            document.body.style.overflow = 'auto';
            document.body.style.height = 'auto';
            
            // Focus on the main content area for accessibility
            mainInvite.focus();
        }
    }, 650);
}

/* ══════════════════════════════════════════
   BACKGROUND MUSIC ENGINE (SUPABASE INTEGRATED)
   ══════════════════════════════════════════ */
async function initBackgroundMusic() {
    // Background music initialization has been moved into loadDatabaseContent to optimize performance and prevent duplicate network queries.
}

function playMusicSilently() {
    if (!bgAudio) return;
    bgAudio.play().then(() => {
        const btn = document.getElementById('floating-music-btn');
        if (btn) {
            btn.classList.add('playing');
            btn.classList.remove('paused');
            btn.setAttribute('aria-pressed', 'true');
        }
    }).catch(err => {
        console.warn('Autoplay blocked. User gesture is required to start audio:', err);
        // Show paused state on the control button
        const btn = document.getElementById('floating-music-btn');
        if (btn) {
            btn.classList.add('paused');
            btn.classList.remove('playing');
            btn.setAttribute('aria-pressed', 'false');
        }
    });
}

function initFloatingMusicButton() {
    const btn = document.getElementById('floating-music-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (!bgAudio) return;

        if (bgAudio.paused) {
            bgAudio.play().then(() => {
                btn.classList.add('playing');
                btn.classList.remove('paused');
                btn.querySelector('.music-icon').textContent = '🔊';
                btn.setAttribute('aria-label', 'Matikan Musik');
                btn.setAttribute('aria-pressed', 'true');
                sessionStorage.setItem('music_paused', 'false');
            }).catch(err => {
                console.error('Play request failed:', err);
            });
        } else {
            bgAudio.pause();
            btn.classList.add('paused');
            btn.classList.remove('playing');
            btn.querySelector('.music-icon').textContent = '🔇';
            btn.setAttribute('aria-label', 'Putar Musik');
            btn.setAttribute('aria-pressed', 'false');
            sessionStorage.setItem('music_paused', 'true');
        }
    });
}

/** Simple HTML escape to prevent XSS from URL params */
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ══════════════════════════════════════════
   COUNTDOWN TIMER
   Target: Sunday, July 12, 2026 15:00:00 GMT+0700 (WIB)
   ══════════════════════════════════════════ */
function initCountdown() {
    const elDays = document.getElementById('timer-days');
    const elHours = document.getElementById('timer-hours');
    const elMinutes = document.getElementById('timer-minutes');
    const elSeconds = document.getElementById('timer-seconds');
    
    if (!elDays || !elHours || !elMinutes || !elSeconds) return;

    function updateTimer() {
        const now = new Date().getTime();
        const distance = countdownTarget - now;

        if (distance < 0) {
            elDays.textContent = "00";
            elHours.textContent = "00";
            elMinutes.textContent = "00";
            elSeconds.textContent = "00";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        elDays.textContent = String(days).padStart(2, '0');
        elHours.textContent = String(hours).padStart(2, '0');
        elMinutes.textContent = String(minutes).padStart(2, '0');
        elSeconds.textContent = String(seconds).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

/* ══════════════════════════════════════════
   SCROLL REVEAL OBSERVER
   ══════════════════════════════════════════ */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════════
   GALLERY LIGHTBOX
   ══════════════════════════════════════════ */
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (!lightbox || !lightboxImg || !lightboxCaption || !closeBtn) return;

    function openLightbox(item) {
        const src = item.getAttribute('data-src');
        const caption = item.getAttribute('data-caption');

        lightboxImg.src = src;
        lightboxCaption.textContent = caption;
        
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Play sound fx
        SoundFX.playLightboxOpen();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        
        // Restore standard scrolling (only if main invitation is active/visible)
        const mainInvite = document.getElementById('main-invitation');
        if (mainInvite && mainInvite.classList.contains('visible')) {
            document.body.style.overflow = 'auto';
        }
    }

    galleryItems.forEach(item => {
        if (item.getAttribute('data-lightbox-bound') !== 'true') {
            item.addEventListener('click', () => openLightbox(item));
            item.setAttribute('data-lightbox-bound', 'true');
        }
    });

    if (!window.lightboxEventsInitialized) {
        closeBtn.addEventListener('click', closeLightbox);

        // Close on backdrop click
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Close on Escape key press
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });
        window.lightboxEventsInitialized = true;
    }
}

/* ══════════════════════════════════════════
   RSVP FORM
   ══════════════════════════════════════════ */
function initRSVP() {
    const form = document.getElementById('rsvp-form');
    const inputName = document.getElementById('rsvp-name');
    const selectGuests = document.getElementById('rsvp-guests');

    if (!form || !inputName || !selectGuests) return;

    // Auto-fill guest name if it's dynamic (and not the fallback "Teman")
    if (GUEST_NAME && GUEST_NAME !== 'Teman') {
        inputName.value = GUEST_NAME;
    }

    // Input handlers to clear error states on user modification
    inputName.addEventListener('input', () => {
        const group = inputName.closest('.form-group');
        if (group && group.classList.contains('has-error')) {
            group.classList.remove('has-error');
            const error = document.getElementById('name-error');
            if (error) error.style.display = 'none';
        }
    });

    selectGuests.addEventListener('change', () => {
        const group = selectGuests.closest('.form-group');
        if (group && group.classList.contains('has-error')) {
            group.classList.remove('has-error');
            const error = document.getElementById('guests-error');
            if (error) error.style.display = 'none';
        }
    });

    // Form submit listener
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameValue = inputName.value.trim();
        const guestsValue = selectGuests.value;

        let hasError = false;

        // Validate Name
        if (!nameValue) {
            hasError = true;
            const group = inputName.closest('.form-group');
            if (group) group.classList.add('has-error');
            const error = document.getElementById('name-error');
            if (error) error.style.display = 'flex';
        }

        // Validate Guests
        if (!guestsValue) {
            hasError = true;
            const group = selectGuests.closest('.form-group');
            if (group) group.classList.add('has-error');
            const error = document.getElementById('guests-error');
            if (error) error.style.display = 'flex';
        }

        if (hasError) return;

        // Disable button & change text to show progress
        const btnSubmit = document.getElementById('btn-submit-rsvp');
        const originalText = btnSubmit.querySelector('.btn-text').textContent;
        btnSubmit.disabled = true;
        btnSubmit.querySelector('.btn-text').textContent = 'Mengirim...';

        try {
            // Extract numeric guest count (e.g. "1 Orang" -> 1)
            const countMatch = guestsValue.match(/\d+/);
            const guestCount = countMatch ? parseInt(countMatch[0], 10) : 1;

            if (typeof db !== 'undefined') {
                await db.submitRSVP(nameValue, guestCount);
            }
        } catch (dbErr) {
            console.warn('Failed to insert RSVP to Supabase:', dbErr);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.querySelector('.btn-text').textContent = originalText;
        }

        // Build pre-filled message
        const message = `Halo, saya ${nameValue}. Saya ingin mengonfirmasi kehadiran di pesta ulang tahun ${CHILD_NAME || 'Alfath'} bersama ${guestsValue}. Sampai jumpa! 🎉`;
        
        // WhatsApp URL Redirection
        const waUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`;
        
        window.open(waUrl, '_blank', 'noopener,noreferrer');
    });
}

/* ══════════════════════════════════════════
   BOOT — Inject names & initialise all stages
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

    // 1. Fetch settings, gallery, guest in parallel and initialize AppState
    await fetchApplicationData();

    // 2. Render all dynamics (if DB offline, falls back to original page content safely)
    renderDynamicContent();

    // 3. Remove initial preloader overlay
    hidePreloader();

    // 4. Initialize elements and controls
    initStageIntro();
    initStagePackage();
    initStageEnvelope();
    
    initCountdown();
    initScrollReveal();
    initLightbox();
    initRSVP();
    initFloatingMusicButton();

    // Stage 1 is already .active via HTML class
    // All others start hidden (opacity: 0, pointer-events: none)

});