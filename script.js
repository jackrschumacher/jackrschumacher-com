class MobileMenu {
    constructor() {
// ... (MobileMenu class remains unchanged)
        this.hamburger = document.querySelector('.hamburger');
        this.closeBtn = document.querySelector('.close-nav');
        this.nav = document.getElementById('main-nav');
        if (!this.hamburger || !this.nav)
            return;
        this.bindEvents();
    }
// ... (rest of MobileMenu methods)
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
        if (window.innerWidth >= 768)
            this.close();
    }
}

// === COMPONENT LOADER (Handles multiple paths for dynamic injection) ===
// MODIFIED: Added optional 'callback' parameter
const loadComponent = (targetElement, componentName, position, callback = () => {}) => {
    // List of possible paths to try for the component based on directory depth
    const possiblePaths = [
        `/${componentName}`, // Absolute path from root
        `../${componentName}`, // Common for 1-level deep pages (e.g., /other pages/...)
        `../../${componentName}`, // Common for 2-level deep pages (e.g., /other pages/blog pages/...)
        componentName // For root index.html
    ];

    let loaded = false;

    const tryLoad = (path) => {
        if (loaded)
            return;

        fetch(path)
                .then(response => {
                    if (!response.ok)
                        throw new Error(`HTTP ${response.status} for ${path}`);
                    return response.text();
                })
                .then(html => {
                    if (loaded)
                        return;
                    loaded = true;
                    targetElement.insertAdjacentHTML(position, html);
                    callback(); // <<< NEW: Execute callback IMMEDIATELY after inserting HTML
                })
                .catch(err => {
                    const nextIndex = possiblePaths.indexOf(path) + 1;
                    if (nextIndex < possiblePaths.length) {
                        tryLoad(possiblePaths[nextIndex]);
                    } else if (!loaded) {
                        console.error(`All paths failed for ${componentName}.`);
                    }
                });
    };

    // Start trying with the first path
    tryLoad(possiblePaths[0]);
};

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

    // Call the footer loader: This fetches the footer and injects it.
    // MODIFIED: Added callback function to run year logic
    loadComponent(document.body, 'footer.html', 'beforeend', () => {
        // This code now runs *after* footer.html is loaded
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
        }
    });

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

    // 2. MENU LOADER: Use dynamic loading for single-file maintenance
    if (header) {
        // We replicate the loadComponent logic here specifically for the menu
        // so we can bind the MobileMenu class and activate links *after* content loads.
        const componentName = 'menu.html';
        const targetElement = header;
        const position = 'afterbegin';
        const possiblePaths = [
            `/${componentName}`,
            `../${componentName}`,
            `../../${componentName}`,
            componentName
        ];

        let loaded = false;

        const tryLoadMenu = (path) => {
            if (loaded)
                return;

            fetch(path)
                    .then(response => {
                        if (!response.ok)
                            throw new Error(`HTTP ${response.status} for ${path}`);
                        return response.text();
                    })
                    .then(html => {
                        if (loaded)
                            return;
                        loaded = true;
                        targetElement.insertAdjacentHTML(position, html);

                        // --- SUCCESS HANDLER: INITIALIZE MENU AND HIGHLIGHT LINKS ---
                        new MobileMenu();

                        // Auto-highlight active page
                        const currentFile = location.pathname.split('/').pop() || 'index.html';
                        document.querySelectorAll('#main-nav a').forEach(link => {
                            const linkFile = link.getAttribute('href').split('/').pop();
                            if (linkFile === currentFile) {
                                link.classList.add('active');
                            }
                        });
                        // -----------------------------------------------------------

                    })
                    .catch(err => {
                        const nextIndex = possiblePaths.indexOf(path) + 1;
                        if (nextIndex < possiblePaths.length) {
                            tryLoadMenu(possiblePaths[nextIndex]);
                        } else if (!loaded) {
                            console.error(`All paths failed for ${componentName}.`);
                        }
                    });
        };

        // Start trying
        tryLoadMenu(possiblePaths[0]);

    } else {
        // Fallback if the header is completely missing
        new MobileMenu();
    }
});