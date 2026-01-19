# Minimal Local Portfolio Tracker (Stocks + Crypto + Metals) — 2 People, All Prices via API (Copilot Instructions)

Build a **minimal, local-only** portfolio tracker that runs by opening `index.html` in a browser (**no server**, no build tools).
Use **vanilla HTML/CSS/JS** and store data in **localStorage**. Provide **Import/Export JSON** backups.

## Non-negotiable requirements

1. **All prices are pulled via APIs** (stocks, crypto, metals).
2. Track holdings for **two people** (Person A + Person B) for **every asset** (stocks, crypto, metals).
3. **One page UI** (no routing).
4. Works locally: no DB, no framework.

---

## Stack

* HTML + CSS + Vanilla JS (ES modules optional, but keep it simple)
* localStorage for persistence
* Fetch APIs from browser

---

## Folder structure (create exactly)

```
portfolio-local/
  index.html
  style.css
  app.js
  config.example.js
  config.js          (user creates locally; do NOT commit)
```

---

## APIs

### Stocks: Finnhub Quote API (free tier)

Use Finnhub quote endpoint: `GET https://finnhub.io/api/v1/quote?symbol={SYMBOL}&token={API_KEY}` ([Finnhub][1])
Free tier pricing shows **60 API calls/minute**. ([Finnhub][2])
Also respect rate-limit guidance (429 if exceeded). ([Finnhub][3])

**Symbol format:** use standard tickers like `AAPL`, `MSFT`, etc.

Quote response includes:

* `c` = current price (use this as live price)
* `pc` = previous close (optional for daily change)

### Crypto: CoinGecko `/simple/price` (Demo API key)

Use endpoint: `GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd`
Send the Demo key as header: `x-cg-demo-api-key: <api-key>` ([CoinGecko API][4])

**Important:** store crypto by CoinGecko **coin id** (e.g. `bitcoin`, `ethereum`), not ticker.

### Metals: metals.dev spot endpoint (API key)

Use metals.dev spot endpoint:
`GET https://api.metals.dev/v1/metal/spot?api_key=KEY&metal=gold&currency=USD` ([Metals.Dev][5])
Metals supported include `gold`, `silver`, `platinum`, `palladium` (implement at least these). ([Metals.Dev][5])

---

## Configuration (local-only)

Create `config.example.js` and a user-owned `config.js`.

### config.example.js

```js
window.APP_CONFIG = {
  baseCurrency: "USD",

  // Finnhub stock quotes
  FINNHUB_KEY: "PASTE_KEY_HERE",

  // CoinGecko Demo API key (sent as header x-cg-demo-api-key)
  COINGECKO_DEMO_KEY: "PASTE_KEY_HERE",

  // metals.dev API key
  METALS_DEV_KEY: "PASTE_KEY_HERE",

  // Cache prices for 60 seconds by default
  PRICE_CACHE_TTL_MS: 60_000
};
```

### config.js

Same object with real keys.
Load order in `index.html` must be:

1. config.example.js
2. config.js (overrides)
3. app.js

---

## Data model (localStorage)

Store one object at localStorage key: `portfolio_v1`

### Schema

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
    },
    {
      "id": "asset_2",
      "type": "crypto",
      "symbol": "bitcoin",
      "name": "Bitcoin",
      "holdings": {
        "p1": { "qty": 0.05, "avgCost": 30000 },
        "p2": { "qty": 0.01, "avgCost": 35000 }
      }
    },
    {
      "id": "asset_3",
      "type": "metal",
      "symbol": "gold",
      "name": "Gold",
      "unit": "oz",
      "holdings": {
        "p1": { "qty": 1.2, "avgCost": 1900 },
        "p2": { "qty": 0.0, "avgCost": 0 }
      }
    }
  ],
  "priceCache": {
    "lastUpdated": 0,
    "prices": {
      "stock:AAPL": 0,
      "crypto:bitcoin": 0,
      "metal:gold": 0
    }
  }
}
```

### Rules

* Person keys are `p1` and `p2`.
* Every asset has a `holdings.p1` and `holdings.p2` object (allow qty 0).
* `avgCost` is average cost per unit in base currency.
* For metals, default unit is `oz` (only for display).

---

## Single-page UI (minimal)

### Header

* Title: `Portfolio (Local)`
* Buttons: `Refresh Prices`, `Export`, `Import`
* Text: `Last updated: ...`
* Small status line: `Updated X/Y prices` or `Errors: N`

### Summary row (3 cards)

* `Person A Total`
* `Person B Total`
* `Combined Total`

Each card shows:

* Total current value
* Unrealized P/L and %

### Holdings table

Controls above:

* Filter: All / Stocks / Crypto / Metals
* Search input (name/symbol)

Columns:

* Asset (name)
* Type
* Symbol
* Live Price
* **Person A**: Qty, Avg Cost, Value, P/L
* **Person B**: Qty, Avg Cost, Value, P/L
* Combined Value
* Actions: Edit / Delete

### Add/Edit form (inline or modal)

Fields:

* Type (stock/crypto/metal)
* Name
* Symbol (stock ticker, crypto id, metal code)
* Unit (metal only, default `oz`)
* Person A: qty + avgCost
* Person B: qty + avgCost
  Buttons: Save / Cancel

---

## Calculations

For each person `p` on an asset:

* `value = qty * price`
* `cost = qty * avgCost`
* `pl = value - cost`
* `plPct = cost > 0 ? (pl / cost) * 100 : 0`

Totals:

* Sum per person over all assets
* Combined = A + B

Formatting:

* Use `Intl.NumberFormat` for currency
* Show P/L with +/− and a simple “up/down” style

---

## Price fetching (must)

### Refresh behavior

* On load: render using stored data and cached prices if present.
* When user clicks **Refresh Prices**:

  * Fetch prices for all assets
  * Update `priceCache.prices` and `priceCache.lastUpdated`
  * Re-render

### Caching

If `Date.now() - lastUpdated < PRICE_CACHE_TTL_MS`, skip refresh unless user explicitly forces refresh (button can always force).

### Batch where possible

* Crypto: batch all ids in one CoinGecko call.
* Stocks: Finnhub quote is per symbol (limit requests: only fetch for owned assets).
* Metals: one call per metal code (gold/silver/etc). Keep it small.

---

## Implement these fetchers

### `fetchStockPricesFinnhub(symbols[]) -> Map`

* For each symbol call:

  * `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}` ([Finnhub][1])
* Use response `.c` as price.
* If `.c` missing/0, treat as error.

### `fetchCryptoPricesCoinGecko(ids[], baseCurrency) -> Map`

* Call:

  * `https://api.coingecko.com/api/v3/simple/price?ids=${idsCsv}&vs_currencies=${base}` ([CoinGecko API][4])
* Add header:

  * `x-cg-demo-api-key: ${COINGECKO_DEMO_KEY}` ([CoinGecko API][4])
* Map each id -> response[id][baseLower]

### `fetchMetalPricesMetalsDev(metals[], baseCurrency) -> Map`

* For each metal:

  * `https://api.metals.dev/v1/metal/spot?api_key=${METALS_DEV_KEY}&metal=${metal}&currency=${base}` ([Metals.Dev][5])
* Extract spot price from returned JSON (inspect shape; handle missing fields gracefully).

---

## Error handling (must)

* If a fetch fails:

  * Keep cached price if available
  * Show price cell as `ERR` with a tooltip or small text
* Header status: “Updated X/Y prices, Errors: N”
* Do not crash on partial failures.

---

## Import / Export (must)

### Export

* Download a JSON file containing the full `portfolio_v1` object.
* Filename: `portfolio_backup.json`

### Import

* User selects a JSON file
* Validate it has `assets` array and `settings`
* Save to localStorage then re-render
* If invalid, show a small error message.

---

## Minimal styling guidelines

* System font, clean spacing
* Subtle borders + rounded corners
* Table can horizontal-scroll on small screens
* Keep CSS short and readable

---

## Implementation steps (do in order)

1. Build static layout in `index.html`.
2. Implement load/save default state in `app.js`.
3. Implement CRUD for assets (add/edit/delete).
4. Implement price fetchers (Finnhub, CoinGecko, metals.dev).
5. Implement caching + last updated display.
6. Implement calculations and render (summary + table).
7. Implement import/export.

---

## Deliverable

Generate fully working code for:

* `index.html`
* `style.css`
* `app.js`
* `config.example.js`

User workflow:

1. Copy folder locally
2. Create `config.js` with keys
3. Open `index.html`
4. Add assets with Person A + Person B holdings
5. Click Refresh Prices and see live prices + totals

[1]: https://finnhub.io/docs/api/quote?utm_source=chatgpt.com "Global Stocks, Forex, Crypto price"
[2]: https://finnhub.io/pricing?utm_source=chatgpt.com "Pricing for global company fundamentals, stock API market ..."
[3]: https://finnhub.io/docs/api/rate-limit?utm_source=chatgpt.com "Limits"
[4]: https://docs.coingecko.com/v3.0.1/reference/simple-price?utm_source=chatgpt.com "Coin Price by IDs"
[5]: https://metals.dev/docs?utm_source=chatgpt.com "API Documentation"
