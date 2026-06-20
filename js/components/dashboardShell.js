// js/components/dashboardShell.js
'use strict';

(function () {
    // 1. Sidebar SVG Icons definition for premium SaaS aesthetic
    const icons = {
        dashboard: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>`,
        settings: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
        hero: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
        gallery: `<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`,
        music: `<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`,
        guests: `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
        rsvp: `<svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
        logout: `<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`
    };

    // 2. Sidebar Navigation Items
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', url: './dashboard.html', icon: icons.dashboard },
        { id: 'settings', label: 'Pengaturan Acara', url: './settings.html', icon: icons.settings },
        { id: 'hero', label: 'Gambar Hero', url: './hero.html', icon: icons.hero },
        { id: 'gallery', label: 'Galeri Foto', url: './gallery.html', icon: icons.gallery },
        { id: 'music', label: 'Musik Latar', url: './music.html', icon: icons.music },
        { id: 'guests', label: 'Manajemen Tamu', url: './guests.html', icon: icons.guests },
        { id: 'rsvp', label: 'Manajemen RSVP', url: './rsvp.html', icon: icons.rsvp }
    ];

    document.addEventListener('DOMContentLoaded', () => {
        setupShellLayout();
        bindSessionDetails();
    });

    function setupShellLayout() {
        const rootContent = document.getElementById('dashboard-content');
        if (!rootContent) return;

        // Determine active item based on current page filename (supports Clean URLs & local filenames)
        const path = window.location.pathname.toLowerCase();
        let activeItem = 'dashboard';
        menuItems.forEach(item => {
            const pageName = item.url.replace('./', '').replace('.html', '').toLowerCase();
            if (path.includes('/' + pageName) || path.includes(pageName + '.html')) {
                activeItem = item.id;
            }
        });

        // Resolve page title
        const currentItem = menuItems.find(i => i.id === activeItem);
        const pageTitleText = currentItem ? currentItem.label : 'Panel Admin';

        // 1. Create Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'db-wrapper';

        // 2. Create Overlay for Mobile
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        wrapper.appendChild(overlay);

        // 3. Create Sidebar
        const sidebar = document.createElement('aside');
        sidebar.className = 'sidebar';

        let menuHtml = '';
        menuItems.forEach(item => {
            const isActive = item.id === activeItem ? 'active' : '';
            menuHtml += `
                <li class="sidebar-item ${isActive}">
                    <a href="${item.url}">
                        ${item.icon}
                        <span>${item.label}</span>
                    </a>
                </li>
            `;
        });

        sidebar.innerHTML = `
            <div class="sidebar-header">
                <span class="sidebar-logo">🚛</span>
                <h2 class="sidebar-title">Alfath <span>Admin</span></h2>
            </div>
            <ul class="sidebar-menu">
                ${menuHtml}
            </ul>
            <div class="sidebar-footer">
                <button class="btn-sidebar-logout" id="btn-shell-logout">
                    ${icons.logout}
                    <span>Keluar</span>
                </button>
            </div>
        `;
        wrapper.appendChild(sidebar);

        // 4. Create Main Content Panel
        const mainPanel = document.createElement('div');
        mainPanel.className = 'main-content';

        // 5. Create Top Navigation Bar
        const topbar = document.createElement('header');
        topbar.className = 'topbar';
        topbar.innerHTML = `
            <div class="topbar-left">
                <button class="btn-mobile-toggle" id="btn-mobile-toggle" aria-label="Buka menu navigasi">☰</button>
                <h1 class="page-title">${pageTitleText}</h1>
            </div>
            <div class="topbar-right">
                <div class="admin-profile-card">
                    <div class="admin-avatar" id="avatar-initials">-</div>
                    <div class="admin-info">
                        <span class="admin-name" id="profile-name">Memuat...</span>
                        <span class="admin-email" id="profile-email">email@admin.com</span>
                    </div>
                </div>
            </div>
        `;
        mainPanel.appendChild(topbar);

        // 6. Create Content Body and move the original content inside it
        const bodyContent = document.createElement('main');
        bodyContent.className = 'content-body';

        // Move children of rootContent to bodyContent
        while (rootContent.firstChild) {
            bodyContent.appendChild(rootContent.firstChild);
        }

        mainPanel.appendChild(bodyContent);
        wrapper.appendChild(mainPanel);

        // Replace original rootContent element with our wrapper
        rootContent.parentNode.replaceChild(wrapper, rootContent);

        // 7. Bind interactive actions (mobile toggling + logout)
        const mobileToggle = document.getElementById('btn-mobile-toggle');
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });

        const logoutBtn = document.getElementById('btn-shell-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (confirm('Apakah Anda yakin ingin keluar dari panel admin?')) {
                    if (typeof authService !== 'undefined') {
                        await authService.logout();
                    } else {
                        // fallback logout redirect
                        window.location.href = './login.html';
                    }
                }
            });
        }
    }

    async function bindSessionDetails() {
        const supabase = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;
        if (!supabase) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Set email
            const email = session.user.email;
            const profileEmail = document.getElementById('profile-email');
            if (profileEmail) profileEmail.textContent = email;

            // Query admin full name
            const { data: profile } = await supabase
                .from('admin_profiles')
                .select('full_name')
                .eq('id', session.user.id)
                .single();

            const fullName = (profile && profile.full_name) || 'Administrator';
            const profileName = document.getElementById('profile-name');
            if (profileName) profileName.textContent = fullName;

            // Set Avatar Initials
            const initials = fullName
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

            const avatarInitials = document.getElementById('avatar-initials');
            if (avatarInitials) avatarInitials.textContent = initials;
        } catch (e) {
            console.warn('Failed to load session profile details in shell:', e);
        }
    }
})();
