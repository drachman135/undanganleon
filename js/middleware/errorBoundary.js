// js/middleware/errorBoundary.js
'use strict';

(function () {
    // Prevent multiple definitions
    if (window.GlobalErrorBoundary) return;

    const GlobalErrorBoundary = {
        /**
         * Initialize error trapping.
         */
        init() {
            window.addEventListener('error', (event) => {
                // Ignore CSS/asset loading errors from stylesheet/images if they don't break JS
                if (event.target && (event.target.tagName === 'LINK' || event.target.tagName === 'IMG')) {
                    return;
                }
                
                console.error('Captured by GlobalErrorBoundary:', event.error || event.message);
                this.showErrorOverlay(event.error || new Error(event.message || 'Kesalahan Script Tidak Terduga'));
            });

            window.addEventListener('unhandledrejection', (event) => {
                console.error('Captured Unhandled Rejection by GlobalErrorBoundary:', event.reason);
                
                // Extract error message
                let errorObj = event.reason;
                if (!(errorObj instanceof Error)) {
                    errorObj = new Error(String(event.reason || 'Koneksi database terputus atau API ditolak'));
                }
                this.showErrorOverlay(errorObj);
            });

            console.log('Global Error Boundary is armed and active 🛡️');
        },

        /**
         * Draw and inject the error alert fullscreen modal.
         */
        showErrorOverlay(error) {
            // Check if overlay is already displayed
            if (document.getElementById('critical-error-overlay')) return;

            const overlay = document.createElement('div');
            overlay.id = 'critical-error-overlay';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background-color: #0F172A;
                background-image: radial-gradient(at 0% 0%, rgba(239, 68, 68, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(249, 115, 22, 0.08) 0px, transparent 50%);
                color: #FAFAF9;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: 'Inter', sans-serif;
                padding: 20px;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;

            const card = document.createElement('div');
            card.style.cssText = `
                background-color: rgba(30, 41, 59, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border-radius: 20px;
                padding: 40px 32px;
                max-width: 480px;
                width: 100%;
                text-align: center;
                box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            `;

            // Identify if this is likely a Supabase / DB / Network issue
            const isDbError = error.message && (
                error.message.includes('fetch') || 
                error.message.includes('Supabase') || 
                error.message.includes('database') || 
                error.message.includes('API') || 
                error.message.includes('network') ||
                error.message.includes('client is not initialized')
            );

            const title = isDbError ? 'Gangguan Jaringan & Koneksi' : 'Kesalahan Sistem Internal';
            const icon = isDbError ? '🔌' : '⚠️';
            const desc = isDbError 
                ? 'Terjadi kegagalan komunikasi saat menghubungkan ke database Supabase. Periksa koneksi internet Anda atau coba muat ulang halaman.' 
                : 'Sistem mengalami kesalahan internal saat memproses instruksi skrip halaman.';

            card.innerHTML = `
                <div style="font-size: 3.5rem; margin-bottom: 20px; line-height: 1;">${icon}</div>
                <h1 style="font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 1.8rem; margin-bottom: 12px; line-height: 1.3;">
                    <span style="background: linear-gradient(135deg, #EF4444, #F97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${title}</span>
                </h1>
                <p style="color: #94A3B8; font-size: 0.9rem; line-height: 1.6; margin-bottom: 24px;">${desc}</p>
                
                <div style="background-color: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 8px; padding: 12px; margin-bottom: 30px; font-family: monospace; font-size: 0.8rem; color: #FCA5A5; text-align: left; overflow-x: auto; white-space: pre-wrap; word-break: break-all; max-height: 120px;">
                    <strong>Error Log:</strong><br>${error.message || error}
                </div>

                <div style="display: flex; gap: 12px; justify-content: center; width: 100%;">
                    <button id="error-btn-reload" style="cursor: pointer; padding: 12px 24px; background: linear-gradient(135deg, #F97316, #EA6500); border: none; border-radius: 30px; color: white; font-family: 'Poppins', sans-serif; font-size: 0.9rem; font-weight: 600; box-shadow: 0 8px 20px rgba(249, 115, 22, 0.25); transition: all 0.2s ease;">
                        Muat Ulang Halaman
                    </button>
                </div>
            `;

            overlay.appendChild(card);
            document.body.appendChild(overlay);

            // Trigger animation fade-in
            overlay.offsetHeight;
            overlay.style.opacity = '1';
            card.style.transform = 'scale(1)';

            // Bind reload button click
            const reloadBtn = document.getElementById('error-btn-reload');
            if (reloadBtn) {
                reloadBtn.addEventListener('click', () => {
                    window.location.reload();
                });
            }
        }
    };

    window.GlobalErrorBoundary = GlobalErrorBoundary;
    GlobalErrorBoundary.init();
})();
