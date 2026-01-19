# Portfolio Tracker (Local)

A minimal, local-only portfolio tracker for stocks, crypto, and precious metals. No server, no database - just open `index.html` in your browser!

## Features

- **Multi-Asset Tracking**: Stocks, cryptocurrencies, and precious metals
- **Two-Person Holdings**: Track holdings for Person A and Person B separately
- **Live Price Updates**: Fetch real-time prices from APIs (Finnhub, CoinGecko, metals.dev)
- **Local Storage**: All data stored in your browser's localStorage
- **Import/Export**: Backup and restore your portfolio as JSON
- **Unrealized P/L**: See your gains/losses for each asset and person

## Setup

1. **Get API Keys** (all free tier):
   - [Finnhub](https://finnhub.io/) - for stock prices (60 calls/min free)
   - [CoinGecko](https://www.coingecko.com/en/api) - for crypto prices
   - [metals.dev](https://metals.dev/) - for precious metal prices

2. **Create config.js**:
   ```bash
   cp config.example.js config.js
   ```

3. **Add your API keys** to `config.js`:
   ```javascript
   window.APP_CONFIG = {
     baseCurrency: "USD",
     FINNHUB_KEY: "your_finnhub_key_here",
     COINGECKO_DEMO_KEY: "your_coingecko_key_here",
     METALS_DEV_KEY: "your_metals_dev_key_here",
     PRICE_CACHE_TTL_MS: 60_000
   };
   ```

4. **Open `index.html`** in your browser - that's it!

## Usage

### Adding Assets

1. Click "Add Asset"
2. Select type (Stock/Crypto/Metal)
3. Enter asset details:
   - **Stock**: Use ticker symbol (e.g., AAPL, MSFT)
   - **Crypto**: Use CoinGecko ID (e.g., bitcoin, ethereum)
   - **Metal**: Use metal name (e.g., gold, silver, platinum)
4. Enter holdings for Person A and Person B (quantity + average cost)
5. Click Save

### Refreshing Prices

- Click "Refresh Prices" to fetch latest prices from APIs
- Prices are cached for 60 seconds by default

### Import/Export

- **Export**: Download your portfolio as JSON backup
- **Import**: Restore from a previously exported JSON file

## Data Structure

All data is stored in localStorage under the key `portfolio_v1`:

```json
{
  "settings": {
    "baseCurrency": "USD",
    "people": ["Person A", "Person B"]
  },
  "assets": [
    {
      "id": "asset_1",
      "type": "stock",
      "symbol": "AAPL",
      "name": "Apple",
      "holdings": {
        "p1": { "qty": 2, "avgCost": 120 },
        "p2": { "qty": 1, "avgCost": 140 }
      }
    }
  ],
  "priceCache": {
    "lastUpdated": 0,
    "prices": {}
  }
}
```

## Tech Stack

- Vanilla HTML/CSS/JavaScript (no frameworks!)
- localStorage for persistence
- Fetch API for price updates

## Files

- `index.html` - Main HTML structure
- `style.css` - Minimal styling
- `app.js` - Core application logic
- `config.example.js` - Example configuration (commit this)
- `config.js` - Your actual API keys (DO NOT commit)

## Tips

- **Regular Backups**: Export your portfolio regularly
- **API Rate Limits**: Respect API rate limits (Finnhub: 60/min)
- **Symbol Format**: 
  - Stocks: Standard tickers (AAPL, GOOGL)
  - Crypto: CoinGecko IDs (bitcoin, ethereum, not BTC, ETH)
  - Metals: Full names (gold, silver, platinum, palladium)

## Browser Compatibility

Works in any modern browser with localStorage and Fetch API support (Chrome, Firefox, Safari, Edge).

## Privacy

All data stays on your device. No data is sent anywhere except API calls to fetch prices.
