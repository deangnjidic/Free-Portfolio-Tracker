// Cookie Consent Manager for Free Portfolio Tracker
// Controls cookie-based services: Google AdSense, GTM tags
// Umami Analytics is cookie-free and does not require consent

(function() {
    'use strict';

    const CONSENT_KEY = 'cookieConsent';
    const CONSENT_ACCEPTED = 'accepted';
    const CONSENT_REJECTED = 'rejected';

    // Check if user has already made a choice
    function getConsentStatus() {
        return localStorage.getItem(CONSENT_KEY);
    }

    // Save user's consent choice
    function saveConsent(choice) {
        localStorage.setItem(CONSENT_KEY, choice);
    }

    // Load Google AdSense script only after consent is given
    function loadAdSense() {
        if (document.querySelector('script[src*="pagead2.googlesyndication.com"]')) return;
        var s = document.createElement('script');
        s.async = true;
        s.crossOrigin = 'anonymous';
        s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1783396140582876';
        document.head.appendChild(s);
    }

    // Enable cookie-dependent services
    function enableCookieServices() {
        loadAdSense();
        // Signal GTM that consent was granted (for tags gated on consent)
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'cookie_consent_granted' });
    }

    // Disable / revoke cookie-dependent services
    function disableCookieServices() {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'cookie_consent_denied' });
    }

    // Create and show cookie banner
    function showCookieBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-content">
                <div class="cookie-text">
                    <strong>🍪 We use cookies</strong>
                    <p>We use cookies for analytics and to display ads via Google AdSense. Your portfolio data stays 100% local and is never tracked or shared with advertisers. <a href="privacy.html" target="_blank">Learn more</a></p>
                </div>
                <div class="cookie-buttons">
                    <button id="cookie-accept" class="cookie-btn cookie-accept">Accept</button>
                    <button id="cookie-reject" class="cookie-btn cookie-reject">Reject</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Add event listeners
        document.getElementById('cookie-accept').addEventListener('click', function() {
            saveConsent(CONSENT_ACCEPTED);
            enableCookieServices();
            banner.remove();
        });

        document.getElementById('cookie-reject').addEventListener('click', function() {
            saveConsent(CONSENT_REJECTED);
            disableCookieServices();
            banner.remove();
        });
    }

    // Initialize consent system
    function initCookieConsent() {
        const consent = getConsentStatus();

        if (consent === CONSENT_ACCEPTED) {
            enableCookieServices();
        } else if (consent === CONSENT_REJECTED) {
            disableCookieServices();
            return;
        } else {
            // No choice made yet, show banner (ads blocked until accepted)
            showCookieBanner();
        }
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCookieConsent);
    } else {
        initCookieConsent();
    }
})();
