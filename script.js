class MobileMenu {
    constructor() {
        this.hamburger = document.querySelector('.hamburger');
        this.closeBtn = document.querySelector('.close-nav');
        this.nav = document.getElementById('main-nav');
        if (!this.hamburger || !this.nav) return;
        this.bindEvents();
    }

    bindEvents() {
        this.hamburger.addEventListener('click', () => this.toggle());
        this.closeBtn?.addEventListener('click', () => this.close());

        // Close menu when clicking a link (only if navigating away)
        this.nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                const href = link.getAttribute('href');
                const currentPage = location.pathname.split('/').pop();
                if (href && href !== currentPage && href !== '#' && !href.startsWith('#')) {
                    this.close();
                }
            });
        });

        window.addEventListener('resize', () => this.reset());
    }

    toggle() {
        const isOpen = this.nav.classList.toggle('open');
        this.hamburger.classList.toggle('active', isOpen);
        this.hamburger.setAttribute('aria-expanded', isOpen);
    }

    close() {
        this.nav.classList.remove('open');
        this.hamburger.classList.remove('active');
        this.hamburger.setAttribute('aria-expanded', 'false');
    }

    reset() {
        if (window.innerWidth >= 768) this.close();
    }
}

// === RESIZE DEBOUNCE ===
let resizeTimer;
window.addEventListener('resize', () => {
    document.body.classList.add('resize-animation-stopper');
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        document.body.classList.remove('resize-animation-stopper');
    }, 400);
});

// === MAIN INIT ===
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');
    const header = document.querySelector('.site-header');
    const html = document.documentElement;

    // 1. Theme Toggle
    const toggle = document.querySelector('.theme-toggle');
    const saved = localStorage.getItem('theme');
    if (saved) {
        html.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.setAttribute('data-theme', 'dark');
    }

    toggle?.addEventListener('click', () => {
        const current = html.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });

    // 2. SMART MENU LOADER — Tries multiple paths
    if (header && !header.querySelector('.hamburger')) {
        const possiblePaths = [
            'menu.html',
            '../menu.html',
            '../../menu.html',
            '../../../menu.html',
            '/menu.html'
        ];

        let loaded = false;
        let attempts = 0;

        const tryLoad = (path) => {
            if (loaded) return;
            attempts++;
            console.log(`Trying menu path: ${path}`);

            fetch(path)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.text();
                })
                .then(menuHTML => {
                    if (loaded) return;
                    loaded = true;

                    header.insertAdjacentHTML('afterbegin', menuHTML);
                    console.log(`Menu loaded from: ${path}`);

                    // Re-init menu
                    new MobileMenu();

                    // Auto-highlight active page
                    const currentFile = location.pathname.split('/').pop() || 'index.html';
                    document.querySelectorAll('#main-nav a').forEach(link => {
                        const linkFile = link.getAttribute('href').split('/').pop();
                        if (linkFile === currentFile) {
                            link.classList.add('active');
                        }
                    });
                })
                .catch(err => {
                    console.warn(`Failed: ${path}`, err);
                    // Try next path
                    const nextIndex = possiblePaths.indexOf(path) + 1;
                    if (nextIndex < possiblePaths.length) {
                        setTimeout(() => tryLoad(possiblePaths[nextIndex]), 100);
                    } else if (!loaded) {
                        console.error('All menu paths failed.');
                        header.innerHTML = `
                            <div style="
                                background: #ff4444; 
                                color: white; 
                                padding: 1rem; 
                                text-align: center; 
                                font-weight: bold;
                                border-radius: 8px;
                                margin: 1rem;
                            ">
                                Menu failed to load. Check console.
                            </div>`;
                    }
                });
        };

        // Start trying
        tryLoad(possiblePaths[0]);

        // Fallback after 3 seconds
        setTimeout(() => {
            if (!loaded && header) {
                header.innerHTML = `
                    <div style="
                        background: orange; 
                        color: black; 
                        padding: 1rem; 
                        text-align: center; 
                        font-weight: bold;
                    ">
                        Loading menu... (Check console)
                    </div>`;
            }
        }, 3000);
    } else {
        // Menu already in HTML
        new MobileMenu();
    }
});