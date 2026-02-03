// Google Consent Mode v2 Initialization
// Must load BEFORE GTM script in <head>

// Initialize dataLayer
window.dataLayer = window.dataLayer || [];

// Define gtag function globally
window.gtag = function(){
    window.dataLayer.push(arguments);
};

// Set default consent to denied (GDPR compliant)
window.gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
});

// Initialize GTM with consent mode
window.gtag('js', new Date());
window.gtag('config', 'G-X00WL6B8W3', {
    'anonymize_ip': true,
    'cookie_flags': 'SameSite=None;Secure'
});
