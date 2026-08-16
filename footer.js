// Shared footer for application and information pages.
(() => {
    if (document.querySelector('.site-footer') || document.querySelector('.home-footer')) return;

    const year = new Date().getFullYear();
    const html = `
        <footer class="site-footer" role="contentinfo">
          <div class="site-footer-inner">
            <div class="site-footer-col">
              <h4>Free Portfolio Tracker</h4>
              <p>A free, local-first tracker for individual and joint stocks, crypto, precious metals, and savings. Portfolio holdings stay in your browser.</p>
              <a class="site-footer-support" href="https://ko-fi.com/dekara" target="_blank" rel="noopener noreferrer">Buy me a coffee</a>
            </div>
            <div class="site-footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="app.html">Portfolio</a></li>
                <li><a href="history.html">History</a></li>
                <li><a href="charts.html">Charts</a></li>
                <li><a href="compare.html">Compare</a></li>
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
            <p>&copy; ${year} Free Portfolio Tracker. Educational use only — not financial advice.</p>
          </div>
        </footer>`;

    document.body.insertAdjacentHTML('beforeend', html);

    const settingsLink = document.getElementById('open-cookie-settings');
    if (settingsLink) {
        settingsLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (window.CookieConsent?.openSettings) window.CookieConsent.openSettings();
        });
    }
})();
