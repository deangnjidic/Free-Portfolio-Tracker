(() => {
    if (document.querySelector('.nav-bar')) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isHomePage = currentPage === 'index.html';
    const primaryLinks = [
        { href: 'app.html', label: 'Portfolio' },
        { href: 'history.html', label: 'History' },
        { href: 'charts.html', label: 'Charts' },
        { href: 'compare.html', label: 'Compare' },
        { href: 'import-csv.html', label: 'Import' }
    ];
    const secondaryLinks = [
        { href: 'guide.html', label: 'Guide' },
        { href: 'faq.html', label: 'FAQ' },
        { href: 'updates.html', label: 'Updates' },
        { href: 'contact.html', label: 'Contact' },
        { href: 'about.html', label: 'About' }
    ];

    const renderLink = ({ href, label }) => {
        const isActive = currentPage === href;
        return `<li><a href="${href}" class="nav-link${isActive ? ' active' : ''}"${isActive ? ' aria-current="page"' : ''}>${label}</a></li>`;
    };

    const secondaryActive = secondaryLinks.some(({ href }) => href === currentPage);
    const navHTML = `
        <nav class="nav-bar${isHomePage ? ' nav-home' : ''}" aria-label="Primary navigation">
            <div class="nav-container">
                <a href="index.html" class="nav-logo" aria-label="Free Portfolio Tracker home">
                    <img src="favicon.svg" alt="">
                    <span class="nav-logo-text">Free Portfolio Tracker</span>
                    <span class="nav-version">2.0</span>
                </a>

                <button class="nav-menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav-panel" aria-label="Open navigation">
                    <span></span><span></span><span></span>
                </button>

                <div class="nav-panel" id="site-nav-panel">
                    <ul class="nav-links">
                        ${primaryLinks.map(renderLink).join('')}
                        <li class="nav-more">
                            <button class="nav-more-toggle${secondaryActive ? ' active' : ''}" type="button" aria-expanded="false">
                                More
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m3 4.5 3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </button>
                            <div class="nav-more-menu">
                                ${secondaryLinks.map(({ href, label }) => {
                                    const isActive = currentPage === href;
                                    return `<a href="${href}" class="${isActive ? 'active' : ''}"${isActive ? ' aria-current="page"' : ''}>${label}</a>`;
                                }).join('')}
                            </div>
                        </li>
                    </ul>

                    <div class="nav-actions">
                        <a href="https://ko-fi.com/dekara" class="nav-support" target="_blank" rel="noopener noreferrer" aria-label="Support Free Portfolio Tracker on Ko-fi">
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 4.25h9.5v5.25A3.5 3.5 0 0 1 8 13H5.5A3.5 3.5 0 0 1 2 9.5V4.25Z" stroke="currentColor" stroke-width="1.3"/><path d="M11.5 5.5H13a1.75 1.75 0 1 1 0 3.5h-1.5M4.4 6.5c.65-.85 1.8-.46 2.1.35.3-.81 1.45-1.2 2.1-.35.9 1.18-.55 2.25-2.1 3.25C4.95 8.75 3.5 7.68 4.4 6.5Z" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Buy me a coffee
                        </a>
                    </div>
                </div>
            </div>
        </nav>
        <div class="app-launch-overlay" id="app-launch-transition" hidden aria-live="polite" aria-label="Opening your portfolio">
            <div class="app-launch-card">
                <img src="favicon.svg" alt="">
                <span class="app-launch-kicker">Free Portfolio Tracker</span>
                <strong>Opening your portfolio</strong>
                <span class="app-launch-copy">Preparing your local dashboard…</span>
                <span class="app-launch-progress" aria-hidden="true"></span>
            </div>
        </div>`;

    const noscript = document.querySelector('body > noscript');
    if (noscript) {
        noscript.insertAdjacentHTML('afterend', navHTML);
    } else {
        document.body.insertAdjacentHTML('afterbegin', navHTML);
    }

    const nav = document.querySelector('.nav-bar');
    const menuToggle = nav.querySelector('.nav-menu-toggle');
    const more = nav.querySelector('.nav-more');
    const moreToggle = nav.querySelector('.nav-more-toggle');
    const overlay = document.getElementById('app-launch-transition');
    let moreCloseTimer = null;

    const cancelMoreClose = () => {
        if (moreCloseTimer !== null) {
            window.clearTimeout(moreCloseTimer);
            moreCloseTimer = null;
        }
    };

    const setMoreOpen = (open) => {
        if (open) cancelMoreClose();
        more.classList.toggle('open', open);
        moreToggle.setAttribute('aria-expanded', String(open));
    };

    const closeMenus = () => {
        cancelMoreClose();
        nav.classList.remove('menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open navigation');
        setMoreOpen(false);
    };

    menuToggle.addEventListener('click', () => {
        const willOpen = !nav.classList.contains('menu-open');
        closeMenus();
        if (willOpen) {
            nav.classList.add('menu-open');
            menuToggle.setAttribute('aria-expanded', 'true');
            menuToggle.setAttribute('aria-label', 'Close navigation');
        }
    });

    moreToggle.addEventListener('click', () => {
        const willOpen = !more.classList.contains('open');
        setMoreOpen(willOpen);
    });

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        more.addEventListener('mouseenter', () => setMoreOpen(true));
        more.addEventListener('mouseleave', () => {
            cancelMoreClose();
            moreCloseTimer = window.setTimeout(() => {
                moreCloseTimer = null;
                setMoreOpen(false);
            }, 320);
        });
    }

    document.addEventListener('click', (event) => {
        if (!nav.contains(event.target)) closeMenus();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenus();
    });

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;

        const destination = new URL(link.href, window.location.href);
        const isAppLink = destination.origin === window.location.origin && destination.pathname.endsWith('/app.html');
        const alreadyInApp = window.location.pathname.endsWith('/app.html');
        if (!isAppLink || alreadyInApp) return;

        event.preventDefault();
        overlay.hidden = false;
        requestAnimationFrame(() => overlay.classList.add('is-visible'));

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.setTimeout(() => window.location.assign(destination.href), reduceMotion ? 80 : 520);
    });

    window.addEventListener('pageshow', () => {
        overlay.classList.remove('is-visible');
        overlay.hidden = true;
        closeMenus();
    });
})();
