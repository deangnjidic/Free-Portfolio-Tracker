// Optional ad-network loader for Ezoic.
// Loads only when the user has consented to advertising and when an Ezoic site ID is configured.
(() => {
    'use strict';

    const CONSENT_KEY = 'cookieConsentV2';
    const POLICY_VERSION = 1;

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

    const siteId = window.APP_CONFIG?.EZOIC_SITE_ID || window.EZOIC_SITE_ID;
    if (!siteId) return;

    const shouldLoad = () => {
        const choice = readConsent();
        if (!choice) return false;
        return !!choice.ads;
    };

    const loadEzoic = () => {
        if (window.__EZOIC_LOADED__) return;

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.ezoic.net/ps/ezoic/ads.js?site_id=${encodeURIComponent(siteId)}`;
        script.setAttribute('data-ezoic-site-id', siteId);
        document.head.appendChild(script);
        window.__EZOIC_LOADED__ = true;

        const placeholder = document.createElement('div');
        placeholder.className = 'ezoic-placeholder';
        placeholder.setAttribute('data-ezoic-placeholder', 'true');
        placeholder.innerHTML = '<p style="text-align:center;color:#8b949e;font-size:12px;margin:16px 0;">Advertisement placeholder — Ezoic will replace this once the site is approved.</p>';

        const target = document.querySelector('[data-ad-slot="ezoic"]');
        if (target) {
            target.appendChild(placeholder);
        }
    };

    if (shouldLoad()) {
        loadEzoic();
    }

    window.addEventListener('cookieConsentUpdated', () => {
        if (shouldLoad()) {
            loadEzoic();
        }
    });
})();
