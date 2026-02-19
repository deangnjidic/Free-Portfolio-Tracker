# 📝 Changelog

All notable changes to Free Portfolio Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.31.0] - 2026-02-19

### Added
- Time range filters (7D, 30D, YTD, All) on **Portfolio Value Over Time** chart — History page
- Time range filters (7D, 30D, YTD, All) on **Daily Gain / Loss** chart — Charts page
- Time range filters (7D, 30D, YTD, All) on **Cumulative Return (%)** chart — Charts page
- Time range filters (7D, 30D, YTD, All) on **Portfolio Composition Over Time** chart — Charts page
- Cumulative Return now recalculates base value relative to the start of the selected range
- Smart empty-state messages: when a filter is active but no snapshots fall in range, a specific message is shown instead of the generic prompt

### Fixed
- Portfolio Composition Over Time chart not rendering when snapshots existed — caused by incorrectly filtering out snapshots that predate the `byType` field; older snapshots now render with zero values per type
- Navigation bar not spanning full viewport width — replaced negative margin hack with `calc(100% + 40px)` approach that correctly accounts for `body` padding on both desktop (20px) and mobile (10px)
- API Key Banner converted from inline styles to proper CSS classes with `@media` breakpoint — stacks vertically with full-width button on mobile

---

## [1.3.0] - 2026-02-18

### Added
- FAQ page (`faq.html`) — accordion UI with 5 sections: General, Privacy & Data, API Keys, Assets & Tracking, Troubleshooting
- About page (`about.html`) — project mission, core principles, tech stack, and credits
- History page line chart showing Combined, Person 1, and Person 2 portfolio values over time
- 5 new charts on Charts page:
  - Daily Gain/Loss bar chart (green/red per snapshot)
  - Savings vs Invested donut chart
  - Composition Over Time stacked bar (asset type mix across snapshots)
  - Cumulative Return line chart (% return from first snapshot)
  - Performance Scatter (daily % change vs value, savings excluded)
- Snapshots now store `p1Value`, `p2Value`, and `byType` breakdown (`stock`, `crypto`, `metal`, `savings`)
- FAQ and About links added to all nav bars and site footers
- FAQ and About pages added to `sitemap.xml`
- Twitter Card meta tags added to `404.html`

### Changed
- Removed duplicate Combined Total card from Portfolio page (covered by Total Value)
- New charts positioned above Top/Bottom performers section on Charts page
- Top/Bottom performers reduced from 10 to 5
- User Guide fully rebuilt: nav bar, table of contents, numbered steps, feature grids, callout boxes, site footer
- Guide crypto symbol format corrected: Finnhub format (`BINANCE:BTCUSDT`), not CoinGecko IDs
- All `<lastmod>` dates in `sitemap.xml` updated to 2026-02-18

### Fixed
- Mobile responsiveness overhauled — charts, tables, modals, quick stats, search, and buttons fully responsive

---

## [1.21.0] - 2026-02-17

### Changed
- Improved responsive design for mobile/tablet view:
  - Summary cards now display in compact 2-column layout on phones (instead of single column)
  - Combined Total card repositioned to top of summary section and spans full width on mobile
  - Combined Total card text is now centered on mobile devices
  - Navigation bar alignment improved for mobile view
  - Reduced card padding and gaps for more efficient use of screen space
  - Person breakdown cards (summary-grid) optimized with smaller fonts and tighter spacing on phones

### Enhanced
- Overall mobile user experience with better visual hierarchy and space utilization
- Navigation properly aligned and fills available width on smaller screens

---

## [1.20.0] - 2026-02-11

### Added
- Dynamic person names in Charts page comparison title (updates based on custom names from settings)
- Modal explicit closing requirement - asset add/edit window only closes via X, Cancel, or Save buttons
- Inline quantity adjustment controls for more compact form layout

### Fixed
- News page now properly loads Finnhub API key from localStorage settings
- Charts page "Person vs Person" comparison title now dynamically displays custom names (was hardcoded "Dean vs Sam")
- API keys saved in settings now properly propagate to News page

### Changed
- Removed dividend fields from asset add/edit modal (simplified data entry form)
- Added 60px top margin to modal for better spacing from navigation bar
- Quantity adjustment buttons (+ Add / − Remove) now display in horizontal inline layout
- Removed click-outside-to-close functionality from modal to prevent accidental dismissal
- Streamlined asset management interface for faster portfolio updates

---

## [1.19.0] - 2026-02-10

### Added
- Google Consent Mode v2 implementation for GDPR-compliant analytics
- consent-init.js script for managing consent state across all pages
- GTM and GA4 now load immediately in `<head>` with default consent set to "denied"

### Changed
- Google Tag Manager and Google Analytics 4 now load on initial page load (with consent mode)
- Analytics respects user consent in real-time without delayed script loading
- Cookie consent banner now updates consent state using gtag consent API
- Improved analytics tracking timing and reliability across all pages

### Enhanced
- Better analytics data collection while maintaining GDPR compliance
- GTM loads faster and more reliably on all pages
- Consent state properly synced between localStorage and Google Consent Mode
- Analytics fires immediately after user accepts cookies (no page reload needed)

---

## [1.17.0] - 2026-01-31

### Added
- Comprehensive SEO meta tags across all HTML pages (descriptions, keywords, OG tags, Twitter cards)
- Open Graph tags for enhanced social media sharing on Facebook and LinkedIn
- Twitter Card tags for better link previews on Twitter
- Canonical URLs for all pages to prevent duplicate content issues
- Enhanced page titles with descriptive keywords
- Robots meta tags (index/noindex) for appropriate pages
- API key initialization in History page from stored settings

### Fixed
- History page now properly loads API keys from localStorage (no more API key errors)
- Crypto price fetching now works correctly from History page
- Current Value in History page now displays change from previous snapshot with color coding
- Change($) and Change(%) columns in History snapshots now show proper green/red colors

### Changed
- Updated all canonical URLs and OG tags with actual domain (freeportfoliotracker.com)
- Improved SEO visibility for landing, guide, privacy, terms, and updates pages
- Enhanced meta descriptions for better search engine results
- Made internal app pages (app.html, history.html, etc.) noindex to keep user data private

---

## [1.16.0] - 2026-01-30

### Added
- Transaction tracking system that automatically records all portfolio quantity changes
- Expandable transaction history display in History page (toggle to show/hide transactions per day)
- Live transaction value calculations (quantity × current stock price)
- Color-coded transaction badges (green for bought/increased, red for sold/decreased)
- Transaction actions: Bought, Sold, Increased, Decreased, Removed All
- Persistent sticky navigation bar across Portfolio and History pages
- Centered navigation layout for improved visual hierarchy
- Full-width navigation bar with proper spacing

### Fixed
- Fixed sticky navigation positioning to stay at top when scrolling
- Resolved overflow-x issues that prevented sticky behavior from working
- Improved horizontal scroll containment in asset tables
- Fixed transaction display rendering in History page
- Fixed priceCache loading to enable transaction value calculations

### Changed
- Improved transaction terminology: "Bought" instead of "Added", "Sold" instead of "Decreased"
- Replaced transaction icons (📈 for bought transactions)
- Simplified transaction display by removing verbose calculation breakdowns
- Changed overflow-x from hidden to clip for better sticky positioning support
- Updated body padding structure to accommodate sticky navigation
- Navigation bar now uses negative margins to extend full width

---

## [1.15.1] - 2026-01-30

### Fixed
- Cookie consent "Accept" button now works correctly (fixed gtag function scope issue)
- Google Analytics and GTM now load properly after accepting cookies

---

## [1.15.0] - 2026-01-29

### Added
- Cookie consent system to all pages (charts, news, history, compare, import-csv) for complete analytics coverage
- Cookie consent CSS to all HTML pages

### Fixed
- Google Analytics tracking now works on all pages (was missing from 5 pages)
- DataLayer initialization moved before GTM loads to prevent race conditions
- Global gtag function now properly accessible across all scripts
- Added proper cookie flags for cross-site tracking (SameSite=None;Secure)

### Changed
- Buy Me a Coffee button replaced with Ko-fi button and branding
- Ko-fi link updated to https://ko-fi.com/dekara
- Ko-fi button now uses brand color (#FF5E5B) instead of yellow
- Updated all support links across index.html, README.md, and terms.html

---

## [1.14.0] - 2026-01-29

### Added
- Professional favicon and app icons (favicon.svg, icon-192.png)
- UI feedback utilities library (ui-feedback.js) with toast notifications, loading overlays, and progress bars
- Logo in app header with link back to landing page
- Smooth animations and transitions throughout entire app
- Modal slide-in animations
- Button hover effects with lift and shadow
- Table row hover effects with slide animation
- Stat card hover effects
- Comprehensive UI/UX documentation (UI-ENHANCEMENTS-DOCS.md)

### Enhanced
- Smooth scrolling behavior across all pages
- Button interactions now have subtle lift effect and shadows on hover
- All interactive elements have smooth 0.2s transitions
- Modals animate in with fade and scale effect
- Portfolio table rows slide slightly on hover for better feedback
- Summary stat cards lift and highlight on hover

### Changed
- Header logo now clickable and returns to landing page
- Refresh button maintains simple disabled state (no spinner overlay)
- Status messages remain in left sidebar (removed redundant toast notifications)

### Performance
- All animations use CSS transitions for optimal performance
- Minimal JavaScript overhead for UI feedback system
- Lazy initialization of toast notification container

---

## [1.13.0] - 2026-01-29

### Added
- GDPR-compliant cookie consent banner for analytics tracking
- Terms of Use page (terms.html) with comprehensive usage terms
- Cookie consent management system (cookie-consent.js and cookie-consent.css)
- Cookie consent documentation (COOKIE-CONSENT-DOCS.md)
- Custom domain support configured (freeportfoliotracker.com)
- Documentation section in README.md with links to all guides
- Terms of Use link in footer navigation

### Changed
- Google Analytics now loads only after user consent (GDPR compliant)
- Google Tag Manager now loads only after user consent
- Updated all HTML files to use consent-based analytics loading
- Google Tag Manager ID updated to GTM-PWHJ9WLH

### Security
- Cookie consent respects user privacy preferences
- Analytics opt-in rather than opt-out (privacy-first approach)
- User consent stored in localStorage (no cookies before consent)

---

## [1.12.0] - 2026-01-29

### Added
- Google Analytics 4 (GA4) tracking for website usage analytics
- Google Tag Manager (GTM) integration
- Privacy policy comprehensive update with analytics disclosure
- Setup banner for missing API keys with close button
- Minification instructions guide (MINIFY-INSTRUCTIONS.md)
- Analytics setup guide (ANALYTICS-SETUP.md)
- Secrets guide explaining what to hide vs. what's public (SECRETS-GUIDE.md)
- Contributing guidelines (CONTRIBUTING.md)
- This changelog file (CHANGELOG.md)

### Changed
- License changed from MIT to CC BY-NC-SA 4.0 (non-commercial)
- App renamed from "Portfolio Tracker" to "Free Portfolio Tracker"
- Buy Me a Coffee link updated to https://buymeacoffee.com/deangnj
- Privacy policy updated to include analytics tracking disclosure
- README.md updated with analytics and deployment information

### Enhanced
- Smart symbol search with real-time autocomplete for stocks/crypto
- Keyboard navigation for autocomplete (arrow keys, Enter, Escape)
- Enhanced autocomplete with result count and better error messages
- Improved demo data with realistic diversified portfolio
- Better error handling for missing/invalid API keys with user-friendly messages
- Rate limiting protection for API calls with visual feedback
- XSS protection with HTML escaping utility throughout app
- Input sanitization for all user inputs

### Fixed
- CSS syntax error in index.html (justify-center → justify-content)
- Autocomplete properly filters by asset type (stocks vs crypto)
- API key validation with clear setup instructions

### Security
- Added HTML escaping utility to prevent XSS attacks
- Input sanitization implemented across all user inputs
- Rate limiting prevents API quota exhaustion
- Improved error messages without exposing sensitive data

---

## [1.0.0] - 2026-01-29

### Initial Release Features

#### Core Functionality
- Multi-asset portfolio tracking (stocks, crypto, metals, savings)
- Multi-person portfolio management (track holdings for 2 people)
- Real-time price updates via Finnhub, CoinGecko, and Metals.dev APIs
- 24-hour price change tracking with visual indicators
- Combined and individual portfolio value calculations
- Dividend tracking for stocks

#### Data Management
- Local storage using browser localStorage
- Import/Export portfolio as JSON
- CSV import from M1 Finance and custom formats
- Historical portfolio snapshots
- Portfolio performance tracking over time

#### User Interface
- Clean, modern dark theme UI
- Dashboard with summary cards
- Sortable asset table
- Quick stats showing best/worst performers
- Search and filter functionality
- Responsive design for mobile and desktop

#### Privacy & Security
- 100% client-side application
- No backend server or database
- All data stored locally in browser
- Privacy-first architecture
- No data collection or tracking (initially)

#### Documentation
- Comprehensive user guide
- README with setup instructions
- Privacy policy
- License (initially MIT, later CC BY-NC-SA 4.0)
- Config example file for API keys

#### Technical
- Vanilla JavaScript (no frameworks)
- No external dependencies
- Offline-capable after initial load
- Price caching to reduce API calls
- Rate limiting for API requests
- Cross-browser compatibility

---

## Version Guidelines

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR** - Incompatible API changes or major feature overhauls
- **MINOR** - New features added in backward-compatible manner
- **PATCH** - Backward-compatible bug fixes

### Change Categories

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements

---

## How to Update This Changelog

When contributing:

1. Add your changes under `[Unreleased]` section
2. Use appropriate category (Added, Changed, Fixed, etc.)
3. Write clear, concise descriptions
4. Include issue/PR numbers if applicable
5. Maintainer will move to versioned section on release

**Example entry:**
```markdown
### Added
- Real-time stock price notifications (#123)
- Portfolio comparison feature (#145)

### Fixed
- Price refresh bug for crypto assets (#156)
```

---

## Links

- [Repository](https://github.com/deangnjidic/Personal-Portfolio-Tracker)
- [Issues](https://github.com/deangnjidic/Personal-Portfolio-Tracker/issues)
- [Contributing Guide](CONTRIBUTING.md)

---

**Note:** This changelog started on January 29, 2026. Previous changes were consolidated into v1.0.0 initial release.
