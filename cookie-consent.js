// Cookie Consent Manager for Free Portfolio Tracker
// Handles GDPR-compliant cookie consent for Google Analytics

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

    // Load Google Analytics
    function loadGoogleAnalytics() {
        // Initialize dataLayer first
        window.dataLayer = window.dataLayer || [];
        
        // Define gtag function globally
        window.gtag = function(){dataLayer.push(arguments);}
        
        // Google Tag Manager
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-PWHJ9WLH');

        // Google Analytics 4
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-X00WL6B8W3';
        document.head.appendChild(gaScript);

        gaScript.onload = function() {
            window.gtag('js', new Date());
            window.gtag('config', 'G-X00WL6B8W3', { 
                'anonymize_ip': true,
                'cookie_flags': 'SameSite=None;Secure'
            });
        };

        // GTM noscript fallback
        const noscript = document.createElement('noscript');
        const iframe = document.createElement('iframe');
        iframe.src = 'https://www.googletagmanager.com/ns.html?id=GTM-PWHJ9WLH';
        iframe.height = '0';
        iframe.width = '0';
        iframe.style.display = 'none';
        iframe.style.visibility = 'hidden';
        noscript.appendChild(iframe);
        document.body.insertBefore(noscript, document.body.firstChild);
    }

    // Create and show cookie banner
    function showCookieBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-content">
                <div class="cookie-text">
                    <strong>🍪 We use cookies</strong>
                    <p>We use Google Analytics to understand how you use our site. Your portfolio data stays 100% local and is never tracked. <a href="privacy.html" target="_blank">Learn more</a></p>
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
            loadGoogleAnalytics();
            banner.remove();
        });

        document.getElementById('cookie-reject').addEventListener('click', function() {
            saveConsent(CONSENT_REJECTED);
            banner.remove();
        });
    }

    // Initialize consent system
    function initCookieConsent() {
        const consent = getConsentStatus();

        if (consent === CONSENT_ACCEPTED) {
            // User already accepted, load analytics
            loadGoogleAnalytics();
        } else if (consent === CONSENT_REJECTED) {
            // User rejected, do nothing
            return;
        } else {
            // No choice made yet, show banner
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
