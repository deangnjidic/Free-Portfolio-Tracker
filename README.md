# 💰 Free Portfolio Tracker

> A beautiful, privacy-first portfolio tracker for stocks, crypto, and precious metals. No server, no database, no tracking - your data never leaves your device.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with Vanilla JS](https://img.shields.io/badge/Made%20with-Vanilla%20JS-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![No Dependencies](https://img.shields.io/badge/Dependencies-None-green.svg)]()
![Visitors](https://api.visitorbadge.io/api/visitors?path=deangnjidic%2FPersonal-Portfolio-Tracker&label=Visitors&countColor=%23263759)

[🚀 Live Demo](https://deangnjidic.github.io/Personal-Portfolio-Tracker/) | [📖 Documentation](#usage) | [🐛 Report Bug](https://github.com/deangnjidic/Personal-Portfolio-Tracker/issues) | [💡 Request Feature](https://github.com/deangnjidic/Personal-Portfolio-Tracker/issues)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/dekara)

---

## ✨ Features

### 📊 **Multi-Asset Support**
Track your entire investment portfolio in one place:
- 📈 **Stocks** - US and international equities
- 💎 **Cryptocurrencies** - Bitcoin, Ethereum, and more
- 🥇 **Precious Metals** - Gold, Silver, Platinum, Palladium
- 💰 **Savings Accounts** - Cash and savings

### 👥 **Multi-Person Tracking**
- Track holdings for two people (customizable names)
- Compare portfolios side-by-side
- Individual and combined portfolio views
- Perfect for couples or joint investments

### 📈 **Real-Time Data**
- Live price updates from trusted APIs
- 24-hour price change tracking
- Historical snapshots and growth tracking
- Top/Bottom performers with % gains/losses

### 📊 **Visualizations**
- **Asset Allocation Charts** - Pie charts showing portfolio breakdown
- **Person Comparison** - Compare holdings by asset type
- **Historical Performance** - Track portfolio growth over time
- **Performance Rankings** - Top 10 best and worst performers

### 🔒 **Privacy & Security**
- **100% Local** - All data stored in browser's localStorage
- **No Server** - No backend, no database, no data collection
- **No Tracking** - Your portfolio data never leaves your device
- **Offline Capable** - Works without internet after initial load

### 🛠️ **Power User Features**
- **Smart Symbol Search** - Real-time autocomplete for stocks/crypto with keyboard navigation
- **Import/Export** - Backup and restore as JSON
- **CSV Import** - Bulk import from M1 Finance or custom CSV
- **Search & Filter** - Find assets instantly
- **Sorting** - Sort by any column
- **Customizable** - Change currency, person names, and more

---

## 🚀 Quick Start

### Option 1: Online (Easiest)
Visit the [live demo](https://deangnjidic.github.io/Personal-Portfolio-Tracker/) and start tracking immediately!

### Option 2: Local Installation

1. **Download or Clone**
   ```bash
   git clone https://github.com/deangnjidic/Personal-Portfolio-Tracker.git
   cd Personal-Portfolio-Tracker
   ```

2. **Get Free API Keys**
   - [Finnhub](https://finnhub.io/) - Stock prices (60 calls/min free)
   - [Metals.dev](https://metals.dev/) - Precious metal prices (free tier)

3. **Configure**
   ```bash
   cp config.example.js config.js
   ```
   
   Edit `config.js` with your API keys:
   ```javascript
   window.APP_CONFIG = {
     baseCurrency: "USD",
     FINNHUB_KEY: "your_finnhub_key_here",
     METALS_DEV_KEY: "your_metals_dev_key_here",
     COINGECKO_DEMO_KEY: "CG-demo-key",
     PRICE_CACHE_TTL_MS: 60_000
   };
   ```

4. **Run**
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Or using Node.js
   npx http-server -p 8000
   ```
   
   Open `http://localhost:8000` in your browser!

---

## 📖 Usage

### Adding Your First Asset

1. Click **"Add Asset"** button
2. Select asset type (Stock/Crypto/Metal/Savings)
3. Enter details:
   - **Symbol** - Ticker symbol (e.g., AAPL, BTC, GOLD)
   - **Name** - Display name
   - **Quantity** - How much you own for each person
4. Click **"Save"**

The app will automatically fetch the current price and calculate your holdings value.

### Customizing Person Names

1. Click **⚙️ Settings** button
2. Enter custom names (default: "Dean" and "Sam")
3. Click **"Save Settings"**

All labels throughout the app will update with your custom names!

### Taking Portfolio Snapshots

1. Click **"Save Snapshot"** to record current portfolio value
2. View historical performance in **📈 History** page
3. Track growth over time with interactive charts

### Importing Data

**From CSV:**
1. Go to **📥 Import CSV** page
2. Upload M1 Finance CSV or custom format
3. Map columns and import

**From JSON:**
1. Click **"Import"** button
2. Select your backup `.json` file
3. Data restored including history!

---

## 📸 Screenshots

### Main Portfolio View
*Track all your holdings with live prices and portfolio breakdown*

### Charts & Analytics
*Visualize your asset allocation and compare holdings*

### Historical Performance
*Monitor your portfolio growth over time*

### Mobile Responsive
*Works beautifully on any device*

---

## 🛠️ Technical Details

### Built With
- **Pure Vanilla JavaScript** - No frameworks, no bloat
- **HTML5 & CSS3** - Modern, responsive design
- **Chart.js** - Beautiful interactive charts
- **localStorage** - Client-side data persistence

### APIs Used
- **Finnhub** - Stock market data
- **CoinGecko** - Cryptocurrency prices
- **Metals.dev** - Precious metal prices

### Browser Support
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Ideas for Contributions
- 📱 Mobile app version
- 🌍 Multi-language support
- 📊 More chart types
- 🔔 Price alerts
- 📤 Export to CSV/PDF
- 🎨 Theme customization

---

## 📝 Roadmap

- [ ] Dark/Light theme toggle
- [ ] Price alerts and notifications
- [ ] PDF export for reports
- [ ] More asset types (bonds, real estate)
- [ ] Tax lot tracking
- [ ] Dividend reinvestment calculator
- [ ] Mobile app version

---

## ❓ FAQ

**Q: Is my data safe?**  
A: Yes! All data is stored locally in your browser. Nothing is sent to any server.

**Q: Can I use this without API keys?**  
A: You can add assets manually, but you won't get live price updates without API keys.

**Q: Will my data sync across devices?**  
A: No, data is stored locally per browser. Use Import/Export to transfer data between devices.

**Q: Is this free?**  
A: Yes! Completely free and open source under MIT License.

**Q: Can I track more than 2 people?**  
A: Currently limited to 2 people. Feel free to fork and modify for your needs!

---

## � Documentation

- **[User Guide](guide.html)** - How to use all features
- **[Privacy Policy](privacy.html)** - Privacy and analytics disclosure
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute to this project
- **[Changelog](CHANGELOG.md)** - Version history and changes
- **[Analytics Setup](ANALYTICS-SETUP.md)** - Configure Google Analytics (for developers)
- **[Minification Guide](MINIFY-INSTRUCTIONS.md)** - Production optimization
- **[Secrets Guide](SECRETS-GUIDE.md)** - What to hide vs. what's public

---

## 📄 License

This project is licensed under the **CC BY-NC-SA 4.0 License** (Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International).

**What this means:**
- ✅ Free to use, modify, and share
- ✅ Must give attribution
- ❌ **Cannot be used commercially or resold**
- ✅ Derivative works must use the same license

See the [LICENSE](LICENSE) file for full details.

---

## 💖 Support

If this project helped you, consider:
- ⭐ **Starring** the repository
- 🐛 **Reporting bugs** or suggesting features via [GitHub Issues](https://github.com/deangnjidic/Personal-Portfolio-Tracker/issues)
- 🤝 **Contributing** code or documentation (see [CONTRIBUTING.md](CONTRIBUTING.md))
- ☕ **[Supporting on Ko-fi](https://ko-fi.com/dekara)** (optional, never required!)

---

## 👏 Acknowledgments

- Thanks to [Finnhub](https://finnhub.io/), [CoinGecko](https://www.coingecko.com/), and [Metals.dev](https://metals.dev/) for their free APIs
- Built with ❤️ for the privacy-conscious investor community
- Inspired by the need for a simple, local-first portfolio tracker

---

**Made with ❤️ by [Dean Gnjidic](https://github.com/deangnjidic)**

*Found this useful? Give it a ⭐️ on [GitHub](https://github.com/deangnjidic/Personal-Portfolio-Tracker)!*

## Usage

### Adding Assets

1. Click "Add Asset"
2. Select type (Stock/Crypto/Metal/Savings)
3. **🔍 Smart Symbol Search**: Start typing in the Symbol field to get auto-suggestions
   - **Real-time search** powered by Finnhub API
   - **Keyboard navigation**: Use ↑↓ arrow keys and Enter to select
   - Works for both stocks and cryptocurrencies
   - Shows company name and ticker symbol
4. Enter asset details:
   - **Stock**: Use ticker symbol (e.g., AAPL, MSFT, GOOGL) or search by typing
   - **Crypto**: Use Finnhub format (e.g., BINANCE:BTCUSDT, BINANCE:ETHUSDT) or search
   - **Metal**: Use metal name (gold, silver, platinum, palladium)
   - **Savings**: Use currency code (USD, EUR, etc.)
5. Enter holdings for Dean and Sam (quantity + average cost)
6. Optional: Add dividend information for stocks
7. Click Save

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
- `index.html` - Landing page
- `app.html` - Main portfolio dashboard
- `history.html` - Portfolio history tracker
- `import-csv.html` - CSV import utility

**Scripts:**
- `app.js` - Core application logic
- `history.js` - History page functionality

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

## Privacy & Analytics

**Portfolio Data:** All your portfolio data stays 100% on your device. No data is sent anywhere except API calls to fetch prices:
- Finnhub API (stocks & crypto prices)
- Metals.dev API (precious metals prices)

**Website Analytics:** We use Google Analytics and Google Tag Manager to understand website usage patterns (page views, navigation). This helps improve the user experience. Your portfolio holdings, values, and financial data are NEVER sent to analytics.

See our [Privacy Policy](privacy.html) for complete details.

## Production Deployment

Before deploying to production:

