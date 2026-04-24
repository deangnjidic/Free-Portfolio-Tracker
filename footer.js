// Site-wide footer injector. Adds a consistent footer with content + policy links
// to every page so reviewers (and users) can find Privacy, Terms, About, Contact,
// Guide, FAQ, Updates from anywhere on the site.
(() => {
    if (document.querySelector('.site-footer')) return;

    const year = new Date().getFullYear();

    const html = `
        <footer class="site-footer" role="contentinfo">
          <div class="site-footer-inner">
            <div class="site-footer-col">
              <h4>Free Portfolio Tracker</h4>
              <p>A free, privacy-first portfolio tracker for stocks, crypto, precious metals, and savings. Your data stays on your device — we never store, sell, or share your holdings.</p>
            </div>
            <div class="site-footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="app.html">Portfolio</a></li>
                <li><a href="history.html">History</a></li>
                <li><a href="charts.html">Charts</a></li>
                <li><a href="compare.html">Compare</a></li>
                <li><a href="news.html">Market News</a></li>
                <li><a href="import-csv.html">Import CSV</a></li>
              </ul>
            </div>
            <div class="site-footer-col">
              <h4>Learn</h4>
              <ul>
                <li><a href="guide.html">User Guide</a></li>
                <li><a href="faq.html">FAQ</a></li>
                <li><a href="updates.html">Release Notes</a></li>
                <li><a href="about.html">About</a></li>
              </ul>
            </div>
            <div class="site-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a href="privacy.html">Privacy Policy</a></li>
                <li><a href="terms.html">Terms of Service</a></li>
                <li><a href="contact.html">Contact</a></li>
                <li><a href="#" id="open-cookie-settings">Cookie Settings</a></li>
              </ul>
            </div>
          </div>
          <div class="site-footer-bottom">
            <p>&copy; ${year} Free Portfolio Tracker. Educational use only — not financial advice. Always do your own research before investing.</p>
          </div>
        </footer>`;

    document.body.insertAdjacentHTML('beforeend', html);

    const settingsLink = document.getElementById('open-cookie-settings');
    if (settingsLink) {
        settingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.CookieConsent?.openSettings) {
                window.CookieConsent.openSettings();
            }
        });
    }
})();
