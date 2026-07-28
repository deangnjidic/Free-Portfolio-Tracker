window.APP_CONFIG = {
  baseCurrency: "USD",

  // Finnhub API key (used for stocks AND crypto)
  // Get your free key at: https://finnhub.io/register
  // Copy this file to config.js and add your API keys
  FINNHUB_KEY: "YOUR_FINNHUB_API_KEY_HERE",

  // metals.dev API key
  // Get your free key at: https://metals.dev/
  METALS_DEV_KEY: "YOUR_METALS_DEV_API_KEY_HERE",

  // Cache prices for 60 seconds by default
  PRICE_CACHE_TTL_MS: 60_000,

  // Optional ad-network configuration
  // Ezoic example: set EZOIC_SITE_ID to your publisher site ID
  // Ads are loaded only after the user accepts cookies via the consent banner
  EZOIC_SITE_ID: "",
  ADSENSE_CLIENT: "ca-pub-1783396140582876"
};
