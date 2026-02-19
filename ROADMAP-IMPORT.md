# 📥 Multi-Provider CSV Import — Roadmap

✅ **COMPLETED** — February 19, 2026

This roadmap has been fully implemented! `import-csv.html` now supports 9 major brokers with auto-detection, manual column mapping fallback, preview table, crypto symbol resolution, and step-by-step wizard UI.

---

## ✅ Completed Features

- ✅ Supports **9 providers**: M1 Finance, Robinhood, Schwab, Fidelity, TD Ameritrade, Trading 212, eToro, Coinbase, Interactive Brokers (IBKR)
- ✅ Auto-detection engine with manual provider override
- ✅ File picker with drag-and-drop support (+ paste option)
- ✅ Preview table with inline editing before import
- ✅ Manual column mapper for unsupported CSV formats
- ✅ Crypto symbol resolver (converts BTC → BINANCE:BTCUSDT)
- ✅ Person assignment: P1 only, P2 only, or Both (50/50 split)
- ✅ 4-step wizard UI with progress indicators
- ✅ Row removal in preview
- ✅ Dynamic person names loaded from localStorage settings

---

## Target Providers

| # | Provider | Asset Types | Notes |
|---|---|---|---|
| 1 | M1 Finance ✅ | Stocks | Already working |
| 2 | Robinhood | Stocks | Simple format, well documented |
| 3 | Charles Schwab | Stocks | Multi-section CSV, needs header skip |
| 4 | Fidelity | Stocks | Footer rows need stripping |
| 5 | TD Ameritrade | Stocks | Tab or comma delimited |
| 6 | Trading 212 | Stocks / ETFs | `Ticker` column instead of `Symbol` |
| 7 | eToro | Stocks / Crypto | `Units` column for quantity |
| 8 | Coinbase | Crypto | Different column names, timestamp format |
| 9 | Interactive Brokers (IBKR) | Stocks / Options | Complex multi-section, needs section parser |
| 10 | **Generic / Manual Mapper** | Any | Fallback for any unsupported provider |

---

## Known CSV Formats

### Robinhood
```
Symbol, Instrument URL, Description, Side, Quantity, Average Buy Price
AAPL, ..., Apple Inc, Long, 5.5, 180.00
```
Key columns: `Symbol`, `Quantity`

---

### Charles Schwab
```
"Positions for account XXXX as of..."   ← skip this line
Symbol, Description, Quantity, Price, Price Change $, ...
AAPL, Apple Inc, 10, $182.00, ...
```
Key columns: `Symbol`, `Description`, `Quantity`
Quirk: first line is an account summary sentence — must skip non-header rows

---

### Fidelity
```
Account Number, Account Name, Symbol, Description, Quantity, Last Price, ...
X12345, Brokerage, AAPL, APPLE INC, 5.000, $182.00, ...
,,,,,,,  ← blank footer rows
```
Key columns: `Symbol`, `Description`, `Quantity`
Quirk: trailing empty rows and footer text must be stripped

---

### TD Ameritrade
```
Symbol, Description, Quantity, Trade Price, ...
AAPL, APPLE INC, 10.00, 182.00
```
Key columns: `Symbol`, `Description`, `Quantity`

---

### Trading 212
```
Ticker, Name, Shares, ...
AAPL, Apple Inc, 3.5, ...
```
Key columns: `Ticker` (→ Symbol), `Name`, `Shares` (→ Quantity)

---

### eToro
```
Instrument, Units, Open Rate, ...
Apple, 5.0, 150.00
```
Quirk: uses instrument name, not ticker symbol — may need manual symbol correction after import

---

### Coinbase
```
Timestamp, Transaction Type, Asset, Quantity Transacted, ...
2024-01-01T10:00:00Z, Buy, ETH, 0.5, ...
```
Key columns: `Asset` (→ Symbol), `Quantity Transacted` (→ Quantity)
Quirk: imports as type `crypto`, needs Finnhub format prefix (`BINANCE:ETHUSDТ` or similar)

---

### Interactive Brokers (IBKR)
```
Statement,...
...
Positions,Header,Symbol,Description,Quantity,...
Positions,Data,AAPL,APPLE INC,10,...
...
```
Quirk: multi-section file — must find the `Positions` section rows and ignore everything else

---

## Architecture Plan

### 1. Provider Detection (automatic)

When a CSV is loaded, scan the headers and first few rows to auto-detect the provider:

```
detectProvider(headers, firstRow):
  if headers includes "Instrument URL"         → Robinhood
  if firstRow starts with "Positions for"      → Schwab
  if headers includes "Account Number"         → Fidelity
  if headers includes "Ticker" + "Shares"      → Trading 212
  if headers includes "Units" + "Instrument"   → eToro
  if headers includes "Quantity Transacted"    → Coinbase
  if firstRow starts with "Statement"          → IBKR
  if headers includes "Symbol" + "Quantity"    → M1 Finance / TD Ameritrade
  else                                         → Unknown → Manual Mapper
```

Detection result is shown to the user as a badge ("Detected: Schwab") with an override dropdown.

---

### 2. Provider Parsers

Each provider gets a dedicated parser function:

```js
const PARSERS = {
  m1:        parseM1,
  robinhood: parseRobinhood,
  schwab:    parseSchwab,
  fidelity:  parseFidelity,
  tdameritrade: parseTDAmeritrade,
  trading212: parseTrading212,
  etoro:     parseEtoro,
  coinbase:  parseCoinbase,
  ibkr:      parseIBKR,
  generic:   parseGeneric   // manual column mapper
};
```

Each parser returns a normalised array:
```js
[
  { symbol: 'AAPL', name: 'Apple Inc', quantity: 5.0, type: 'stock' },
  { symbol: 'BINANCE:ETHUSDТ', name: 'Ethereum', quantity: 0.5, type: 'crypto' },
  ...
]
```

---

### 3. Manual Column Mapper (Generic fallback)

When a provider can't be detected, show a column mapping UI:

```
Your CSV columns:   [Ticker] [CompanyName] [SharesHeld] [AvgCost] [Notes]
                       ↓           ↓             ↓
Map to:           Symbol ▼    Name ▼      Quantity ▼     (skip)   (skip)

Asset type for all rows:  ○ Stock  ○ Crypto  ○ Metal
```

User maps their columns, clicks Preview, and sees the result before committing.

---

### 4. Import Preview

**Before** writing to `localStorage`, always show a preview table:

```
┌─────────┬───────────────┬──────────┬──────────┬────────┐
│ Symbol  │ Name          │ Quantity │ Type     │ Action │
├─────────┼───────────────┼──────────┼──────────┼────────┤
│ AAPL    │ Apple Inc     │ 5.000    │ Stock  ✓ │ Add    │
│ TSLA    │ Tesla         │ 2.500    │ Stock  ✓ │ Update │
│ ???     │ Some ETF      │ 1.000    │ ⚠ Check  │ Add    │
└─────────┴───────────────┴──────────┴──────────┴────────┘
```

- Green rows = clean, ready to import
- Yellow rows = missing symbol or quantity needs review
- User can **edit inline** or **remove a row** before confirming
- "Confirm Import" button writes to state

---

### 5. File Picker + Paste

Replace the current paste-only textarea with both options:

```
[ 📂 Choose CSV File ]   or   paste CSV text below ↓
```

On mobile (Capacitor), the file picker opens the native document picker (works with `@capacitor/filesystem` or standard `<input type="file">`).

---

### 6. Crypto Symbol Resolution

Coinbase and eToro exports use plain asset names (`ETH`, `BTC`) not Finnhub format (`BINANCE:ETHUSDТ`).

After detection, show a resolution step for crypto rows:

```
⚠ Crypto symbols need Finnhub format
ETH  →  [BINANCE:ETHUSDТ    ] (pre-filled suggestion)
BTC  →  [BINANCE:BTCUSDT    ] (pre-filled suggestion)
         ↑ user can edit before import
```

---

## UI Redesign Plan for `import-csv.html`

The current page is barebones. Once multi-provider support is added it needs a proper UI.

```
Step 1: Choose Provider
  [ Auto-detect ]  or  [ M1 Finance ▼ ] dropdown

Step 2: Load CSV
  [ 📂 Choose File ]  or paste below
  [ textarea ]

Step 3: Preview & Edit
  Table with editable rows

Step 4: Assign to Person
  ○ Person 1  ○ Person 2  ○ Both (split 50/50)

Step 5: Confirm
  [ ✓ Import N assets ]
```

---

## Implementation Order

1. **File picker** — quick win, works today with `<input type="file">`
2. **Import preview table** — biggest UX improvement, no provider logic needed yet
3. **Provider auto-detection** — add parsers one by one, starting with most popular
4. **Manual column mapper** — last, as it's the most complex UI
5. **Crypto symbol resolution** — add when Coinbase/eToro parsers are built

---

## Estimated Effort

| Task | Effort |
|---|---|
| File picker | 30 min |
| Preview table | 2–3 hrs |
| Provider detection engine | 1 hr |
| M1 / Robinhood / Schwab / Fidelity parsers | 3–4 hrs |
| Trading 212 / eToro / TD parsers | 2–3 hrs |
| Coinbase parser + crypto symbol resolution | 2–3 hrs |
| IBKR section parser | 2–3 hrs |
| Manual column mapper UI | 3–4 hrs |
| **Total** | **~16–21 hours** |
