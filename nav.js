(function() {
    // Don't inject if nav already exists on the page
    if (document.querySelector('.nav-bar')) return;

    var currentPage = window.location.pathname.split('/').pop() || 'index.html';

    var links = [
        { href: 'app.html', icon: '💼', label: 'Portfolio' },
        { href: 'history.html', icon: '📈', label: 'History' },
        { href: 'charts.html', icon: '📊', label: 'Charts' },
        { href: 'compare.html', icon: '⚖️', label: 'Compare' },
        { href: 'news.html', icon: '📰', label: 'News' },
        { href: 'import-csv.html', icon: '📥', label: 'Import' },
        { href: 'faq.html', icon: '❓', label: 'FAQ' },
        { href: 'contact.html', icon: '📬', label: 'Contact' },
        { href: 'about.html', icon: 'ℹ️', label: 'About' }
    ];

    var navHTML = '<nav class="nav-bar"><div class="nav-container">' +
        '<a href="index.html" class="nav-logo">' +
        '<img src="favicon.svg" alt="Logo">' +
        '<span class="nav-logo-text">Free Portfolio Tracker</span>' +
        '</a><ul class="nav-links">';

    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var isActive = currentPage === link.href ? ' active' : '';
        navHTML += '<li><a href="' + link.href + '" class="nav-link' + isActive + '">' +
            '<span class="nav-icon">' + link.icon + '</span> ' + link.label + '</a></li>';
    }

    navHTML += '</ul></div></nav>';

    // Insert nav as first visible element (after any noscript tags)
    var noscript = document.querySelector('body > noscript');
    if (noscript) {
        noscript.insertAdjacentHTML('afterend', navHTML);
    } else {
        document.body.insertAdjacentHTML('afterbegin', navHTML);
    }
})();
