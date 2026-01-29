# 📝 Changelog

All notable changes to Free Portfolio Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Documentation section in README.md with links to all guides

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
