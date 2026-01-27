# Portfolio Tracker (Local)

A minimal, local-only portfolio tracker for stocks, crypto, and precious metals. No server, no database - just open `index.html` in your browser!

## Features

- **Multi-Asset Tracking**: Stocks, cryptocurrencies, precious metals, and savings accounts
- **Two-Person Holdings**: Track holdings for Dean and Sam separately
- **Live Price Updates**: Fetch real-time prices from APIs (Finnhub, metals.dev)
- **Portfolio History**: Save daily snapshots to track portfolio growth over time
- **Charts & Visualizations**: Asset allocation pie charts, person comparison, and breakdown charts
- **Top/Bottom Performers**: See your best and worst performing assets by % change
- **Market News**: View market news for your holdings
- **Local Storage**: All data stored in your browser's localStorage
- **Import/Export**: Backup and restore your portfolio as JSON (includes history)
- **CSV Import**: Bulk import assets from CSV files
- **Sorting & Filtering**: Sort by any column, filter by asset type, search by name/symbol

## Setup

1. **Get API Keys** (all free tier):
   - [Finnhub](https://finnhub.io/) - for stock prices (60 calls/min free)
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
     METALS_DEV_KEY: "your_metals_dev_key_here",
     COINGECKO_DEMO_KEY: "CG-demo-key",
     PRICE_CACHE_TTL_MS: 60_000
   };
   ```

4. **Open `index.html`** in your browser - that's it!

## Usage

### Adding Assets

1. Click "Add Asset"
2. Select type (Stock/Crypto/Metal/Savings)
3. Enter asset details:
   - **Stock**: Use ticker symbol (e.g., AAPL, MSFT, GOOGL)
   - **Crypto**: Use Finnhub format (e.g., BINANCE:BTCUSDT, BINANCE:ETHUSDT)
   - **Metal**: Use metal name (gold, silver, platinum, palladium)
   - **Savings**: Use currency code (USD, EUR, etc.)
4. Enter holdings for Dean and Sam (quantity + average cost)
5. Optional: Add dividend information for stocks
6. Click Save

### Refreshing Prices

- Click "Refresh Prices" to fetch latest prices from APIs
- Progress indicator shows X/Y assets fetched with percentage
- Prices include 24-hour change percentage from market open
- Prices are cached for 60 seconds by default
- Rate limited to avoid API errors (1.1 second delay between calls)

### Portfolio History Tracking

**New Feature!** Track your portfolio value over time:

1. Go to the **History** page
2. Click **"Refresh Prices"** to get current data
3. Click **"Save Snapshot"** to record current Combined Total
4. Snapshot captures:
   - Date & timestamp
   - Combined Total value (Dean + Sam)
   - Change from previous snapshot ($ and %)
   - Number of assets up/down/unchanged
   - Total asset count

**View History:**
- Stats dashboard showing current value, first snapshot, total gain/loss, best/worst days
- Detailed table of all snapshots sorted by date (newest first)
- Delete individual snapshots or clear all history
- Export includes all your historical snapshots

**Best Practice:** Save a snapshot daily around 6 PM when markets are closed.

### Import/Export

- **Export**: Download your portfolio as JSON backup (includes assets, settings, price cache, and history)
- **Import**: Restore from a previously exported JSON file
- **CSV Import**: Bulk import assets from CSV file (see import-csv.html page)

### Charts

Visit the **Charts** page to see:
- **Asset Allocation**: Pie chart showing portfolio distribution by asset type
- **Dean vs Sam**: Bar chart comparing holdings by asset type
- **Portfolio Breakdown**: Combined view of total values by category
- **Top 10 Performers**: Best performing assets by % change (24h)
- **Bottom 10 Performers**: Worst performing assets by % change (24h)

### Compare Assets

Use the **Compare** page to:
- Select 2-3 assets to compare side-by-side
- View price, holdings, and performance metrics
- Useful for comparing similar assets or making decisions

### Market News

The **News** page shows:
- General market news
- News specific to your portfolio holdings
- Powered by Finnhub API

## Data Structure

All data is stored in localStorage under the key `portfolio_v1`:

```json
{
  "settings": {
    "baseCurrency": "USD",
    "people": ["Dean", "Sam"]
  },
  "assets": [
    {
      "id": "asset_1",
      "type": "stock",
      "symbol": "AAPL",
      "name": "Apple",
      "holdings": {
        "p1": { "qty": 2, "avgCost": 120, "dividend": 0 },
        "p2": { "qty": 1, "avgCost": 140, "dividend": 0 }
      }
    }
  ],
  "priceCache": {
    "lastUpdated": 1769450002307,
    "prices": {
      "stock:AAPL": 254.34
    },
    "previousPrices": {},
    "changePercents": {
      "stock:AAPL": 2.45
    }
  },
  "snapshots": [
    {
      "timestamp": 1769450123456,
      "date": "2026-01-26T18:00:00.000Z",
      "totalValue": 62692.26,
      "changeFromPrevious": 1234.56,
      "changePercentFromPrevious": 2.01,
      "assetsUp": 25,
      "assetsDown": 10,
      "assetsUnchanged": 5,
      "totalAssets": 40
    }
  ]
}
```

## Tech Stack

- Vanilla HTML/CSS/JavaScript (no frameworks!)
- localStorage for persistence
- Fetch API for price updates
- Chart.js for visualizations

## Files

**Main Pages:**
- `index.html` - Main portfolio dashboard
- `history.html` - Portfolio history tracker
- `charts.html` - Charts and visualizations
- `compare.html` - Asset comparison tool
- `news.html` - Market news feed
- `import-csv.html` - CSV import utility

**Scripts:**
- `app.js` - Core application logic
- `history.js` - History page functionality
- `charts.js` - Chart rendering
- `compare.js` - Comparison functionality
- `news.js` - News feed logic

**Styling:**
- `style.css` - All styles (dark theme)

**Configuration:**
- `config.example.js` - Example configuration (commit this)
- `config.js` - Your actual API keys (DO NOT commit)

## Tips

- **Regular Snapshots**: Save a snapshot daily to track growth over time
- **Regular Backups**: Export your portfolio regularly (includes history!)
- **API Rate Limits**: Refresh button includes rate limiting (60 calls/min for Finnhub)
- **Symbol Format**: 
  - Stocks: Standard tickers (AAPL, GOOGL, TSLA)
  - Crypto: Finnhub format (BINANCE:BTCUSDT, BINANCE:ETHUSDT)
  - Metals: Full names lowercase (gold, silver, platinum, palladium)
  - Savings: Currency code (USD, EUR, CAD)
- **Price Accuracy**: Metals.dev returns 24h change directly from API for most accurate data
- **Sorting**: Click any column header to sort (click again to reverse)
- **Quick Stats**: Main page shows best/worst performers and total values at a glance

## Browser Compatibility

Works in any modern browser with localStorage and Fetch API support (Chrome, Firefox, Safari, Edge).

## Privacy

All data stays on your device. No data is sent anywhere except API calls to fetch prices:
- Finnhub API (stocks & crypto prices)
- metals.dev API (precious metals prices)

No tracking, no analytics, no cloud storage.
