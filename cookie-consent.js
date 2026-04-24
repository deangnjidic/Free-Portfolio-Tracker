// Cookie Consent Manager — Google Consent Mode v2 implementation
// for Free Portfolio Tracker (https://freeportfoliotracker.com)
//
// What this does:
//  1. Reads the user's saved consent (or shows a banner on first visit).
//  2. Issues `gtag('consent', 'update', ...)` so Google AdSense, GTM, and
//     any other Google tag respects the user's choice (Consent Mode v2).
//  3. The Consent Mode *default* (denied) is set inline in the <head> of
//     every page BEFORE this file loads, so Google tags are blocked
//     until/unless the user accepts.
//  4. Exposes window.CookieConsent.openSettings() so a "Cookie Settings"
//     link in the footer can re-open the banner anytime.
//
// Categories:
//   - necessary       (always on)
//   - analytics       (Umami is cookie-free, but we still respect this)
//   - ads             (Google AdSense personalization + ad storage)

(() => {
    'use strict';

    const CONSENT_KEY = 'cookieConsentV2';
    const POLICY_VERSION = 1;

    function gtag() {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(arguments);
    }

    const readConsent = () => {
        try {
            const raw = localStorage.getItem(CONSENT_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || data.version !== POLICY_VERSION) return null;
            return data;
        } catch (e) {
            return null;
        }
    };

    const saveConsent = (choice) => {
        try {
            localStorage.setItem(CONSENT_KEY, JSON.stringify({
                version: POLICY_VERSION,
                analytics: !!choice.analytics,
                ads: !!choice.ads,
                timestamp: Date.now()
            }));
        } catch (e) { /* ignore quota errors */ }
    };

    const applyConsent = (choice) => {
        const ads = choice.ads ? 'granted' : 'denied';
        const analytics = choice.analytics ? 'granted' : 'denied';

        gtag('consent', 'update', {
            ad_storage: ads,
            ad_user_data: ads,
            ad_personalization: ads,
            analytics_storage: analytics
        });

        gtag({ event: choice.ads ? 'cookie_consent_granted' : 'cookie_consent_denied' });
    };

    const removeBanner = () => {
        const b = document.getElementById('cookie-consent-banner');
        if (b) b.remove();
    };

    // -------- Banner UI --------
    const buildBanner = (existingChoice) => {
        removeBanner();

        const checked = existingChoice || { analytics: false, ads: false };

        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-live', 'polite');
        banner.setAttribute('aria-label', 'Cookie consent');
        banner.innerHTML = `
            <div class="cc-content">
              <div class="cc-header">
                <strong>🍪 Your privacy matters</strong>
                <p>We use a few optional services to keep this site free. Your portfolio data always stays on <em>your</em> device — we never see, store, or share it. Choose what you allow:</p>
              </div>
              <div class="cc-options">
                <label class="cc-option">
                  <input type="checkbox" checked disabled>
                  <span><strong>Strictly necessary</strong> — required for the site to work (always on).</span>
                </label>
                <label class="cc-option">
                  <input type="checkbox" id="cc-analytics"${checked.analytics ? ' checked' : ''}>
                  <span><strong>Analytics</strong> — anonymous, cookie-free Umami stats so we can see which pages help users most.</span>
                </label>
                <label class="cc-option">
                  <input type="checkbox" id="cc-ads"${checked.ads ? ' checked' : ''}>
                  <span><strong>Advertising</strong> — Google AdSense ads (helps fund the project). Personalised in the EEA only with your consent.</span>
                </label>
              </div>
              <div class="cc-buttons">
                <button type="button" class="cc-btn cc-btn-secondary" id="cc-reject">Reject all</button>
                <button type="button" class="cc-btn cc-btn-secondary" id="cc-save">Save choices</button>
                <button type="button" class="cc-btn cc-btn-primary" id="cc-accept">Accept all</button>
              </div>
              <p class="cc-fineprint">See our <a href="privacy.html">Privacy Policy</a> for details. You can change these choices anytime via the "Cookie Settings" link in the footer.</p>
            </div>`;

        document.body.appendChild(banner);

        document.getElementById('cc-accept').addEventListener('click', () => {
            const c = { analytics: true, ads: true };
            saveConsent(c); applyConsent(c); removeBanner();
        });
        document.getElementById('cc-reject').addEventListener('click', () => {
            const c = { analytics: false, ads: false };
            saveConsent(c); applyConsent(c); removeBanner();
        });
        document.getElementById('cc-save').addEventListener('click', () => {
            const c = {
                analytics: document.getElementById('cc-analytics').checked,
                ads: document.getElementById('cc-ads').checked
            };
            saveConsent(c); applyConsent(c); removeBanner();
        });
    };

    // Public API for the footer "Cookie Settings" link
    window.CookieConsent = {
        openSettings: () => buildBanner(readConsent())
    };

    const init = () => {
        const choice = readConsent();
        if (choice) {
            applyConsent(choice);
        } else {
            buildBanner(null);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
