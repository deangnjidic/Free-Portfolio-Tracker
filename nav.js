(() => {
    // Don't inject if nav already exists on the page
    if (document.querySelector('.nav-bar')) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const links = [
        { href: 'app.html', icon: '💼', label: 'Portfolio' },
        { href: 'history.html', icon: '📈', label: 'History' },
        { href: 'charts.html', icon: '📊', label: 'Charts' },
        { href: 'compare.html', icon: '⚖️', label: 'Compare' },
        { href: 'news.html', icon: '📰', label: 'News' },
        { href: 'import-csv.html', icon: '📥', label: 'Import' },
        { href: 'guide.html', icon: '📖', label: 'Guide' },
        { href: 'faq.html', icon: '❓', label: 'FAQ' },
        { href: 'updates.html', icon: '📝', label: 'Updates' },
        { href: 'contact.html', icon: '📬', label: 'Contact' },
        { href: 'about.html', icon: 'ℹ️', label: 'About' }
    ];

    const linkItems = links.map(({ href, icon, label }) => {
        const activeClass = currentPage === href ? ' active' : '';
        return `<li><a href="${href}" class="nav-link${activeClass}"><span class="nav-icon">${icon}</span> ${label}</a></li>`;
    }).join('');

    const navHTML = `
        <nav class="nav-bar">
            <div class="nav-container">
                <a href="index.html" class="nav-logo">
                    <img src="favicon.svg" alt="Logo">
                    <span class="nav-logo-text">Free Portfolio Tracker</span>
                </a>
                <ul class="nav-links">${linkItems}</ul>
            </div>
        </nav>`;

    // Insert nav as first visible element (after any noscript tags)
    const noscript = document.querySelector('body > noscript');
    if (noscript) {
        noscript.insertAdjacentHTML('afterend', navHTML);
    } else {
        document.body.insertAdjacentHTML('afterbegin', navHTML);
    }
})();
