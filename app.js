// Portfolio Tracker App - Vanilla JS
(function() {
    'use strict';

    // State
    let state = {
        settings: {
            baseCurrency: "USD",
            people: ['Dean', 'Sam'],
            apiKeys: {
                FINNHUB_KEY: '',
                METALS_DEV_KEY: ''
            }
        },
        assets: [],
        priceCache: {
            lastUpdated: 0,
            prices: {},
            previousPrices: {},
            changePercents: {} // Store 24h percentage changes from API
        },
        snapshots: [] // Historical portfolio snapshots
    };

    let currentFilter = 'all';
    let currentSearch = '';
    let currentSort = { column: null, ascending: true };

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        loadState();
        initializeSettings();
        
        setupEventListeners();
        render();
    }

    // Storage
    function loadState() {
        const stored = localStorage.getItem('portfolio_v1');
        if (stored) {
            try {
                state = JSON.parse(stored);
                // Ensure snapshots array exists
                if (!state.snapshots) {
                    state.snapshots = [];
                }
            } catch (e) {
                console.error('Failed to parse stored data:', e);
            }
        } else {
            // Load demo data for first-time visitors
            loadDemoData();
        }
    }

    // Demo data for first-time visitors (GitHub Pages demo)
    function loadDemoData() {
        state.assets = [
            {
                id: 'demo_1',
                type: 'stock',
                symbol: 'AAPL',
                name: 'Apple Inc.',
                holdings: {
                    p1: { qty: 10, avgCost: 150, dividend: 0 },
                    p2: { qty: 5, avgCost: 160, dividend: 0 }
                }
            },
            {
                id: 'demo_2',
                type: 'stock',
                symbol: 'MSFT',
                name: 'Microsoft',
                holdings: {
                    p1: { qty: 8, avgCost: 300, dividend: 0 },
                    p2: { qty: 12, avgCost: 280, dividend: 0 }
                }
            },
            {
                id: 'demo_3',
                type: 'stock',
                symbol: 'TSLA',
                name: 'Tesla',
                holdings: {
                    p1: { qty: 15, avgCost: 200, dividend: 0 },
                    p2: { qty: 0, avgCost: 0, dividend: 0 }
                }
            },
            {
                id: 'demo_4',
                type: 'crypto',
                symbol: 'BINANCE:BTCUSDT',
                name: 'Bitcoin',
                holdings: {
                    p1: { qty: 0.5, avgCost: 45000, dividend: 0 },
                    p2: { qty: 0.25, avgCost: 48000, dividend: 0 }
                }
            },
            {
                id: 'demo_5',
                type: 'crypto',
                symbol: 'BINANCE:ETHUSDT',
                name: 'Ethereum',
                holdings: {
                    p1: { qty: 5, avgCost: 2500, dividend: 0 },
                    p2: { qty: 3, avgCost: 2800, dividend: 0 }
                }
            },
            {
                id: 'demo_6',
                type: 'metal',
                symbol: 'gold',
                name: 'Gold',
                unit: 'oz',
                holdings: {
                    p1: { qty: 10, avgCost: 1800, dividend: 0 },
                    p2: { qty: 8, avgCost: 1850, dividend: 0 }
                }
            },
            {
                id: 'demo_7',
                type: 'metal',
                symbol: 'silver',
                name: 'Silver',
                unit: 'oz',
                holdings: {
                    p1: { qty: 100, avgCost: 22, dividend: 0 },
                    p2: { qty: 50, avgCost: 24, dividend: 0 }
                }
            },
            {
                id: 'demo_8',
                type: 'savings',
                symbol: 'USD',
                name: 'US Dollar Savings',
                holdings: {
                    p1: { qty: 5000, avgCost: 1, dividend: 0 },
                    p2: { qty: 7500, avgCost: 1, dividend: 0 }
                }
            }
        ];

        // Add demo prices to cache
        state.priceCache = {
            lastUpdated: Date.now(),
            prices: {
                'stock:AAPL': 178.50,
                'stock:MSFT': 415.20,
                'stock:TSLA': 245.80,
                'crypto:BINANCE:BTCUSDT': 52500.00,
                'crypto:BINANCE:ETHUSDT': 3100.00,
                'metal:gold': 2050.00,
                'metal:silver': 25.50,
                'savings:USD': 1.00
            },
            previousPrices: {
                'stock:AAPL': 176.20,
                'stock:MSFT': 410.50,
                'stock:TSLA': 238.90,
                'crypto:BINANCE:BTCUSDT': 51000.00,
                'crypto:BINANCE:ETHUSDT': 3050.00,
                'metal:gold': 2040.00,
                'metal:silver': 25.20,
                'savings:USD': 1.00
            },
            changePercents: {
                'stock:AAPL': 1.31,
                'stock:MSFT': 1.15,
                'stock:TSLA': 2.89,
                'crypto:BINANCE:BTCUSDT': 2.94,
                'crypto:BINANCE:ETHUSDT': 1.64,
                'metal:gold': 0.49,
                'metal:silver': 1.19,
                'savings:USD': 0.00
            }
        };
        
        // Save demo data to localStorage
        saveState();
        console.log('Demo data loaded with', state.assets.length, 'assets');
    }

    function saveState() {
        localStorage.setItem('portfolio_v1', JSON.stringify(state));
    }

    // Initialize settings with defaults if not present
    function initializeSettings() {
        if (!state.settings.people || state.settings.people.length !== 2) {
            state.settings.people = ['Dean', 'Sam'];
            saveState();
        }
        // Initialize API keys if not present
        if (!state.settings.apiKeys) {
            state.settings.apiKeys = {
                FINNHUB_KEY: window.APP_CONFIG?.FINNHUB_KEY || '',
                METALS_DEV_KEY: window.APP_CONFIG?.METALS_DEV_KEY || ''
            };
            saveState();
        }
        // Override APP_CONFIG with stored API keys
        if (state.settings.apiKeys.FINNHUB_KEY) {
            window.APP_CONFIG.FINNHUB_KEY = state.settings.apiKeys.FINNHUB_KEY;
        }
        if (state.settings.apiKeys.METALS_DEV_KEY) {
            window.APP_CONFIG.METALS_DEV_KEY = state.settings.apiKeys.METALS_DEV_KEY;
        }
        updateLabels();
    }

    // Update all labels with current names
    function updateLabels() {
        const p1Name = state.settings.people[0];
        const p2Name = state.settings.people[1];
        
        // Summary cards
        document.getElementById('person1TotalLabel').textContent = `${p1Name}'s Total`;
        document.getElementById('person2TotalLabel').textContent = `${p2Name}'s Total`;
        
        // Asset type breakdown
        document.getElementById('person1StocksLabel').textContent = `${p1Name}'s Stocks`;
        document.getElementById('person2StocksLabel').textContent = `${p2Name}'s Stocks`;
        document.getElementById('person1CryptoLabel').textContent = `${p1Name}'s Crypto`;
        document.getElementById('person2CryptoLabel').textContent = `${p2Name}'s Crypto`;
        document.getElementById('person1MetalsLabel').textContent = `${p1Name}'s Metals`;
        document.getElementById('person2MetalsLabel').textContent = `${p2Name}'s Metals`;
        document.getElementById('person1SavingsLabel').textContent = `${p1Name}'s Savings`;
        document.getElementById('person2SavingsLabel').textContent = `${p2Name}'s Savings`;
        
        // Table headers
        document.getElementById('tableHeader1').textContent = p1Name;
        document.getElementById('tableHeader2').textContent = p2Name;
        
        // Form labels
        document.getElementById('formPerson1Label').textContent = `${p1Name}'s Holdings`;
        document.getElementById('formPerson2Label').textContent = `${p2Name}'s Holdings`;
    }

    // Event Listeners
    function setupEventListeners() {
        // Header buttons
        document.getElementById('refreshBtn').addEventListener('click', refreshPrices);
        document.getElementById('exportBtn').addEventListener('click', exportData);
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', importData);

        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
        document.getElementById('closeSettingsModal').addEventListener('click', closeSettingsModal);
        document.getElementById('cancelSettingsBtn').addEventListener('click', closeSettingsModal);
        document.getElementById('settingsForm').addEventListener('submit', saveSettings);

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                render();
            });
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            render();
        });

        // Table sorting
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                if (currentSort.column === column) {
                    currentSort.ascending = !currentSort.ascending;
                } else {
                    currentSort.column = column;
                    currentSort.ascending = true;
                }
                render();
            });
        });

        // Add asset
        document.getElementById('addAssetBtn').addEventListener('click', openAddModal);
        
        // Delete all assets
        document.getElementById('deleteAllBtn').addEventListener('click', deleteAllAssets);

        // Modal
        document.getElementById('closeModal').addEventListener('click', closeModal);
        document.getElementById('cancelBtn').addEventListener('click', closeModal);
        document.getElementById('assetForm').addEventListener('submit', handleFormSubmit);
        document.getElementById('assetType').addEventListener('change', handleTypeChange);

        // Symbol autocomplete
        const symbolInput = document.getElementById('assetSymbol');
        let autocompleteTimeout;
        symbolInput.addEventListener('input', (e) => {
            clearTimeout(autocompleteTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 1) {
                hideAutocomplete();
                return;
            }
            
            // Debounce the search
            autocompleteTimeout = setTimeout(() => {
                searchSymbols(query);
            }, 300);
        });

        // Close autocomplete on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#assetSymbol') && !e.target.closest('#symbolAutocomplete')) {
                hideAutocomplete();
            }
        });

        // Close modal on outside click
        document.getElementById('assetModal').addEventListener('click', (e) => {
            if (e.target.id === 'assetModal') {
                closeModal();
            }
        });
    }

    // Modal Functions
    function openAddModal() {
        document.getElementById('modalTitle').textContent = 'Add Asset';
        document.getElementById('assetForm').reset();
        document.getElementById('assetId').value = '';
        document.getElementById('p1Adjust').style.display = 'none';
        document.getElementById('p2Adjust').style.display = 'none';
        handleTypeChange();
        document.getElementById('assetModal').classList.add('active');
    }

    function openEditModal(assetId) {
        const asset = state.assets.find(a => a.id === assetId);
        if (!asset) return;

        document.getElementById('modalTitle').textContent = 'Edit Asset';
        document.getElementById('assetId').value = asset.id;
        document.getElementById('assetType').value = asset.type;
        document.getElementById('assetName').value = asset.name;
        document.getElementById('assetSymbol').value = asset.symbol;
        if (asset.unit) {
            document.getElementById('assetUnit').value = asset.unit;
        }

        document.getElementById('p1Qty').value = asset.holdings.p1.qty;
        document.getElementById('p2Qty').value = asset.holdings.p2.qty;
        document.getElementById('p1Dividend').value = asset.holdings.p1.dividend || 0;
        document.getElementById('p2Dividend').value = asset.holdings.p2.dividend || 0;
        
        // Show adjust controls when editing
        document.getElementById('p1Adjust').style.display = 'block';
        document.getElementById('p2Adjust').style.display = 'block';
        document.getElementById('p1AdjustAmount').value = '';
        document.getElementById('p2AdjustAmount').value = '';

        handleTypeChange();
        document.getElementById('assetModal').classList.add('active');
    }

    function closeModal() {
        document.getElementById('assetModal').classList.remove('active');
        hideAutocomplete();
    }

    // Settings Modal Functions
    function openSettingsModal() {
        document.getElementById('person1Name').value = state.settings.people[0];
        document.getElementById('person2Name').value = state.settings.people[1];
        document.getElementById('finnhubKey').value = state.settings.apiKeys?.FINNHUB_KEY || '';
        document.getElementById('metalsDevKey').value = state.settings.apiKeys?.METALS_DEV_KEY || '';
        document.getElementById('settingsModal').classList.add('active');
    }

    function closeSettingsModal() {
        document.getElementById('settingsModal').classList.remove('active');
    }

    function saveSettings(e) {
        e.preventDefault();
        
        const person1 = document.getElementById('person1Name').value.trim();
        const person2 = document.getElementById('person2Name').value.trim();
        const finnhubKey = document.getElementById('finnhubKey').value.trim();
        const metalsDevKey = document.getElementById('metalsDevKey').value.trim();
        
        if (!person1 || !person2) {
            alert('Please enter names for both people');
            return;
        }
        
        state.settings.people = [person1, person2];
        state.settings.apiKeys = {
            FINNHUB_KEY: finnhubKey,
            METALS_DEV_KEY: metalsDevKey
        };
        
        // Update APP_CONFIG with new keys
        if (finnhubKey) {
            window.APP_CONFIG.FINNHUB_KEY = finnhubKey;
        }
        if (metalsDevKey) {
            window.APP_CONFIG.METALS_DEV_KEY = metalsDevKey;
        }
        
        saveState();
        updateLabels();
        closeSettingsModal();
        
        alert('Settings saved successfully! API keys are now stored locally.');
    }

    // Symbol Autocomplete Functions
    async function searchSymbols(query) {
        const type = document.getElementById('assetType').value;
        
        // Only search for stocks and crypto
        if (type !== 'stock' && type !== 'crypto') {
            hideAutocomplete();
            return;
        }

        const apiKey = window.APP_CONFIG?.FINNHUB_KEY;
        if (!apiKey || apiKey === 'PASTE_KEY_HERE') {
            console.log('Finnhub API key not configured for symbol search');
            return;
        }

        try {
            const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            displayAutocomplete(data.result || [], query);
        } catch (error) {
            console.error('Symbol search error:', error);
            hideAutocomplete();
        }
    }

    function displayAutocomplete(results, query) {
        const dropdown = document.getElementById('symbolAutocomplete');
        const type = document.getElementById('assetType').value;
        
        if (results.length === 0) {
            hideAutocomplete();
            return;
        }

        // Filter and limit results
        let filtered = results;
        if (type === 'stock') {
            // For stocks, exclude crypto exchanges
            filtered = results.filter(r => !r.symbol.includes(':'));
        } else if (type === 'crypto') {
            // For crypto, only show Binance pairs
            filtered = results.filter(r => r.symbol.startsWith('BINANCE:'));
        }

        filtered = filtered.slice(0, 10); // Limit to 10 results

        if (filtered.length === 0) {
            hideAutocomplete();
            return;
        }

        dropdown.innerHTML = filtered.map(result => `
            <div class="autocomplete-item" data-symbol="${result.symbol}" data-name="${result.description}">
                <div class="autocomplete-symbol">${result.symbol}</div>
                <div class="autocomplete-name">${result.description}</div>
            </div>
        `).join('');

        // Add click handlers
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const symbol = item.dataset.symbol;
                const name = item.dataset.name;
                document.getElementById('assetSymbol').value = symbol;
                document.getElementById('assetName').value = name;
                hideAutocomplete();
            });
        });

        dropdown.style.display = 'block';
    }

    function hideAutocomplete() {
        const dropdown = document.getElementById('symbolAutocomplete');
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
    }

    function handleTypeChange() {
        const type = document.getElementById('assetType').value;
        const unitGroup = document.getElementById('unitGroup');
        const p1DividendGroup = document.getElementById('p1DividendGroup');
        const p2DividendGroup = document.getElementById('p2DividendGroup');
        
        unitGroup.style.display = type === 'metal' ? 'block' : 'none';
        
        // Show dividend fields only for stocks
        const showDividend = type === 'stock';
        if (p1DividendGroup) p1DividendGroup.style.display = showDividend ? 'block' : 'none';
        if (p2DividendGroup) p2DividendGroup.style.display = showDividend ? 'block' : 'none';
    }

    function handleFormSubmit(e) {
        e.preventDefault();

        const assetId = document.getElementById('assetId').value;
        const type = document.getElementById('assetType').value;
        const name = document.getElementById('assetName').value.trim();
        const symbol = document.getElementById('assetSymbol').value.trim();
        const unit = type === 'metal' ? document.getElementById('assetUnit').value.trim() : undefined;

        const p1Qty = parseFloat(document.getElementById('p1Qty').value) || 0;
        const p2Qty = parseFloat(document.getElementById('p2Qty').value) || 0;
        
        const p1Dividend = type === 'stock' ? (parseFloat(document.getElementById('p1Dividend').value) || 0) : 0;
        const p2Dividend = type === 'stock' ? (parseFloat(document.getElementById('p2Dividend').value) || 0) : 0;

        const asset = {
            id: assetId || `asset_${Date.now()}`,
            type,
            symbol,
            name,
            holdings: {
                p1: { qty: p1Qty, avgCost: 0, dividend: p1Dividend },
                p2: { qty: p2Qty, avgCost: 0, dividend: p2Dividend }
            }
        };

        if (unit) {
            asset.unit = unit;
        }

        if (assetId) {
            // Edit existing
            const index = state.assets.findIndex(a => a.id === assetId);
            if (index !== -1) {
                state.assets[index] = asset;
            }
        } else {
            // Add new
            state.assets.push(asset);
        }

        saveState();
        closeModal();
        render();
    }

    function deleteAsset(assetId) {
        if (!confirm('Are you sure you want to delete this asset?')) return;

        state.assets = state.assets.filter(a => a.id !== assetId);
        
        // Clean up price cache
        const asset = state.assets.find(a => a.id === assetId);
        if (asset) {
            const cacheKey = `${asset.type}:${asset.symbol}`;
            delete state.priceCache.prices[cacheKey];
        }

        saveState();
        render();
    }

    function deleteAllAssets() {
        const assetCount = state.assets.length;
        
        if (assetCount === 0) {
            alert('No assets to delete.');
            return;
        }

        // Strong warning with multiple confirmations
        const firstConfirm = confirm(
            `⚠️ WARNING: You are about to DELETE ALL ${assetCount} ASSETS!\n\n` +
            `This action cannot be undone and will:\n` +
            `• Remove all ${assetCount} assets from your portfolio\n` +
            `• Clear all price data\n` +
            `• Keep your historical snapshots\n` +
            `• Keep your settings and API keys\n\n` +
            `Are you ABSOLUTELY SURE you want to continue?`
        );

        if (!firstConfirm) return;

        // Second confirmation to prevent accidents
        const secondConfirm = confirm(
            `⚠️ FINAL CONFIRMATION\n\n` +
            `This is your last chance to cancel.\n\n` +
            `Click OK to DELETE ALL ${assetCount} ASSETS permanently.\n` +
            `Click Cancel to keep your assets.`
        );

        if (!secondConfirm) return;

        // Delete all assets
        state.assets = [];
        state.priceCache.prices = {};
        state.priceCache.previousPrices = {};
        state.priceCache.changePercents = {};
        state.priceCache.lastUpdated = 0;

        saveState();
        render();

        alert(`✅ All ${assetCount} assets have been deleted.\n\nYour historical snapshots and settings remain intact.`);
    }

    // Price Fetching
    async function refreshPrices() {
        const btn = document.getElementById('refreshBtn');
        btn.disabled = true;
        btn.textContent = 'Refreshing...';

        const statusEl = document.getElementById('updateStatus');
        statusEl.textContent = 'Fetching prices...';

        const results = {
            updated: 0,
            errors: 0,
            total: state.assets.length
        };

        try {
            // Group assets by type
            const stocks = state.assets.filter(a => a.type === 'stock').map(a => a.symbol);
            const cryptos = state.assets.filter(a => a.type === 'crypto').map(a => a.symbol);
            const metals = state.assets.filter(a => a.type === 'metal').map(a => a.symbol);
            const savings = state.assets.filter(a => a.type === 'savings');

            console.log('Assets to fetch:', { stocks, cryptos, metals, savings: savings.length });

            // Progress tracking
            let completed = 0;
            const totalToFetch = stocks.length + cryptos.length + metals.length;
            
            const updateProgress = () => {
                completed++;
                const percent = Math.round((completed / totalToFetch) * 100);
                statusEl.textContent = `Fetching prices... ${completed}/${totalToFetch} (${percent}%)`;
            };

            // Fetch prices (Finnhub for both stocks and crypto)
            const [stockPrices, cryptoPrices, metalPrices] = await Promise.all([
                stocks.length > 0 ? fetchStockPricesFinnhub(stocks, updateProgress) : Promise.resolve(new Map()),
                cryptos.length > 0 ? fetchCryptoPricesFinnhub(cryptos, updateProgress) : Promise.resolve(new Map()),
                metals.length > 0 ? fetchMetalPricesMetalsDev(metals, state.settings.baseCurrency, updateProgress) : Promise.resolve(new Map())
            ]);

            console.log('Fetched prices:', { 
                stocks: Array.from(stockPrices.entries()),
                cryptos: Array.from(cryptoPrices.entries()),
                metals: Array.from(metalPrices.entries())
            });

            // Update cache
            state.assets.forEach(asset => {
                const cacheKey = `${asset.type}:${asset.symbol}`;
                let priceData = null;

                if (asset.type === 'stock') {
                    priceData = stockPrices.get(asset.symbol);
                } else if (asset.type === 'crypto') {
                    priceData = cryptoPrices.get(asset.symbol);
                } else if (asset.type === 'metal') {
                    priceData = metalPrices.get(asset.symbol);
                } else if (asset.type === 'savings') {
                    // Savings use 1:1 value (quantity = dollar amount)
                    priceData = 1.0;
                }

                console.log(`Processing ${asset.name} (${cacheKey}): priceData=`, priceData);

                // Handle both old format (number) and new format (object with price and changePercent)
                let price = null;
                let changePercent = null;
                
                if (typeof priceData === 'object' && priceData !== null && !Array.isArray(priceData)) {
                    price = priceData.price;
                    changePercent = priceData.changePercent;
                } else if (typeof priceData === 'number') {
                    price = priceData;
                    // For savings type only, use 0%
                    changePercent = 0;
                } else if (priceData === null || priceData === undefined) {
                    console.warn(`No price data returned for ${cacheKey}`);
                } else {
                    console.warn(`Unexpected priceData type for ${cacheKey}:`, typeof priceData, priceData);
                }

                if (price !== null && price !== undefined && !isNaN(price) && price > 0) {
                    // Store previous price before updating
                    if (state.priceCache.prices[cacheKey] !== undefined) {
                        state.priceCache.previousPrices[cacheKey] = state.priceCache.prices[cacheKey];
                    }
                    state.priceCache.prices[cacheKey] = price;
                    
                    // Store 24h change percentage separately
                    if (!state.priceCache.changePercents) {
                        state.priceCache.changePercents = {};
                    }
                    state.priceCache.changePercents[cacheKey] = changePercent;
                    
                    results.updated++;
                    console.log(`✓ Updated ${cacheKey} = ${price} (${changePercent.toFixed(2)}%)`);
                } else {
                    results.errors++;
                    console.log(`✗ Error for ${cacheKey}, price was: ${price}`);
                }
            });

            state.priceCache.lastUpdated = Date.now();
            saveState();

            statusEl.textContent = `Updated ${results.updated}/${results.total} prices` + 
                (results.errors > 0 ? `, Errors: ${results.errors}` : '');

        } catch (error) {
            console.error('Error refreshing prices:', error);
            statusEl.textContent = 'Error refreshing prices';
        }

        btn.disabled = false;
        btn.textContent = 'Refresh Prices';
        render();
    }

    // Helper: Add delay between API calls to avoid rate limiting
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function fetchStockPricesFinnhub(symbols, onProgress) {
        const prices = new Map();
        const apiKey = window.APP_CONFIG?.FINNHUB_KEY;

        if (!apiKey || apiKey === 'PASTE_KEY_HERE') {
            console.warn('Finnhub API key not configured');
            return prices;
        }

        // Rate limit: 60 calls/min free tier, so ~1 call per second
        const delayMs = 1100;
        
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            try {
                const response = await fetch(
                    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
                );
                
                if (response.status === 429) {
                    console.warn(`Rate limit hit for ${symbol}, waiting...`);
                    await delay(5000);
                    continue;
                }
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.c && data.c > 0) {
                        // Calculate 24h change using previous close
                        // pc = previous close, c = current
                        let changePercent = 0;
                        if (data.pc && data.pc > 0) {
                            changePercent = ((data.c - data.pc) / data.pc) * 100;
                        }
                        prices.set(symbol, {
                            price: data.c,
                            changePercent: changePercent,
                            previousPrice: data.pc || data.c
                        });
                    }
                }
                
                // Update progress
                if (onProgress) onProgress();
                
                // Add delay between requests
                if (i < symbols.length - 1) {
                    await delay(delayMs);
                }
            } catch (error) {
                console.error(`Error fetching ${symbol}:`, error);
                if (onProgress) onProgress();
            }
        }

        return prices;
    }

    async function fetchCryptoPricesFinnhub(symbols, onProgress) {
        const prices = new Map();
        const apiKey = window.APP_CONFIG?.FINNHUB_KEY;

        if (!apiKey || apiKey === 'PASTE_KEY_HERE') {
            console.warn('Finnhub API key not configured');
            return prices;
        }

        // Rate limit: same as stocks
        const delayMs = 1100;

        // Use same fetcher as stocks - Finnhub handles crypto symbols like BINANCE:BTCUSDT
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            try {
                const response = await fetch(
                    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
                );
                
                if (response.status === 429) {
                    console.warn(`Rate limit hit for ${symbol}, waiting...`);
                    await delay(5000);
                    continue;
                }
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.c && data.c > 0) {
                        // Calculate 24h change using previous close
                        let changePercent = 0;
                        if (data.pc && data.pc > 0) {
                            changePercent = ((data.c - data.pc) / data.pc) * 100;
                        }
                        prices.set(symbol, {
                            price: data.c,
                            changePercent: changePercent,
                            previousPrice: data.pc || data.c
                        });
                    }
                }
                
                // Update progress
                if (onProgress) onProgress();
                
                // Add delay between requests
                if (i < symbols.length - 1) {
                    await delay(delayMs);
                }
            } catch (error) {
                console.error(`Error fetching ${symbol}:`, error);
                if (onProgress) onProgress();
            }
        }

        return prices;
    }

    async function fetchMetalPricesMetalsDev(metals, baseCurrency, onProgress) {
        const prices = new Map();
        const apiKey = window.APP_CONFIG?.METALS_DEV_KEY;

        if (!apiKey || apiKey === 'PASTE_KEY_HERE') {
            console.warn('metals.dev API key not configured');
            return prices;
        }

        for (const metal of metals) {
            try {
                // Fetch current spot price
                const response = await fetch(
                    `https://api.metals.dev/v1/metal/spot?api_key=${apiKey}&metal=${metal}&currency=${baseCurrency}`
                );

                if (response.ok) {
                    const data = await response.json();
                    console.log(`metals.dev response for ${metal}:`, data);
                    
                    // Extract price and change from API response
                    let price = null;
                    let changePercent = 0;
                    let previousPrice = null;
                    
                    // Try to extract price
                    if (data.rate && typeof data.rate === 'object') {
                        price = data.rate.price;
                        // Check for change data in the response
                        if (data.rate.change !== undefined) {
                            changePercent = data.rate.change;
                        } else if (data.rate.change_pct !== undefined) {
                            changePercent = data.rate.change_pct;
                        } else if (data.rate.previous_close !== undefined && price) {
                            // Calculate from previous close
                            previousPrice = data.rate.previous_close;
                            changePercent = ((price - previousPrice) / previousPrice) * 100;
                        }
                    } else if (typeof data.rate === 'number') {
                        price = data.rate;
                    } else if (data.price !== undefined) {
                        price = data.price;
                        // Check for change fields
                        if (data.change !== undefined) {
                            changePercent = data.change;
                        } else if (data.change_pct !== undefined) {
                            changePercent = data.change_pct;
                        } else if (data.previous_close !== undefined) {
                            previousPrice = data.previous_close;
                            changePercent = ((price - previousPrice) / previousPrice) * 100;
                        }
                    }
                    
                    if (price !== null && !isNaN(price) && price > 0) {
                        console.log(`✓ Setting price for ${metal}: ${price}, change: ${changePercent}%`);
                        prices.set(metal, {
                            price: price,
                            changePercent: changePercent,
                            previousPrice: previousPrice || price
                        });
                    } else {
                        console.warn(`✗ Could not extract valid price for ${metal}`);
                    }
                } else {
                    console.error(`metals.dev API error for ${metal}: ${response.status} ${response.statusText}`);
                }
                
                // Update progress
                if (onProgress) onProgress();
            } catch (error) {
                console.error(`Error fetching ${metal}:`, error);
                if (onProgress) onProgress();
            }
        }

        return prices;
    }

    // Calculations
    function calculateAssetValues(asset) {
        const cacheKey = `${asset.type}:${asset.symbol}`;
        const price = state.priceCache.prices[cacheKey] || 0;

        const p1 = {
            qty: asset.holdings.p1.qty,
            value: asset.holdings.p1.qty * price
        };

        const p2 = {
            qty: asset.holdings.p2.qty,
            value: asset.holdings.p2.qty * price
        };

        const combined = {
            value: p1.value + p2.value
        };

        return { price, p1, p2, combined };
    }

    function calculateTotals() {
        const totals = {
            p1: { value: 0, dividend: 0 },
            p2: { value: 0, dividend: 0 },
            combined: { value: 0, dividend: 0 },
            byType: {
                stock: 0,
                crypto: 0,
                metal: 0,
                savings: 0
            },
            p1ByType: {
                stock: 0,
                crypto: 0,
                metal: 0,
                savings: 0
            },
            p2ByType: {
                stock: 0,
                crypto: 0,
                metal: 0,
                savings: 0
            }
        };

        state.assets.forEach(asset => {
            const calc = calculateAssetValues(asset);
            
            totals.p1.value += calc.p1.value;
            totals.p2.value += calc.p2.value;
            
            // Track by asset type (combined)
            if (totals.byType[asset.type] !== undefined) {
                totals.byType[asset.type] += calc.combined.value;
            }
            
            // Track by person and asset type
            if (totals.p1ByType[asset.type] !== undefined) {
                totals.p1ByType[asset.type] += calc.p1.value;
            }
            if (totals.p2ByType[asset.type] !== undefined) {
                totals.p2ByType[asset.type] += calc.p2.value;
            }
        });

        totals.combined.value = totals.p1.value + totals.p2.value;

        return totals;
    }

    // Formatting
    function formatCurrency(value) {
        return `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }

    function getPriceChange(cacheKey, currentPrice) {
        // Use the stored 24h change percentage from API
        const changePercent = state.priceCache.changePercents && state.priceCache.changePercents[cacheKey];
        
        if (changePercent === undefined || changePercent === null || changePercent === 0) {
            return { arrow: '', className: '', percent: '' };
        }
        
        const formattedPercent = changePercent.toFixed(2);
        
        if (changePercent > 0) {
            return { 
                arrow: '↑', 
                className: 'price-up', 
                percent: `+${formattedPercent}%` 
            };
        } else {
            return { 
                arrow: '↓', 
                className: 'price-down', 
                percent: `${formattedPercent}%` 
            };
        }
    }

    // Render
    function render() {
        renderSummary();
        renderTable();
        renderLastUpdated();
        renderQuickStats();
    }

    function renderSummary() {
        const totals = calculateTotals();

        document.getElementById('personATotal').textContent = formatCurrency(totals.p1.value);
        document.getElementById('personBTotal').textContent = formatCurrency(totals.p2.value);
        document.getElementById('combinedTotal').textContent = formatCurrency(totals.combined.value);
        
        // Render asset type totals with percentages
        const total = totals.combined.value;
        
        document.getElementById('stocksTotal').textContent = formatCurrency(totals.byType.stock);
        document.getElementById('stocksPercent').textContent = total > 0 ? 
            `${((totals.byType.stock / total) * 100).toFixed(1)}%` : '0%';
        
        document.getElementById('cryptoTotal').textContent = formatCurrency(totals.byType.crypto);
        document.getElementById('cryptoPercent').textContent = total > 0 ? 
            `${((totals.byType.crypto / total) * 100).toFixed(1)}%` : '0%';
        
        document.getElementById('metalsTotal').textContent = formatCurrency(totals.byType.metal);
        document.getElementById('metalsPercent').textContent = total > 0 ? 
            `${((totals.byType.metal / total) * 100).toFixed(1)}%` : '0%';
        
        document.getElementById('savingsTotal').textContent = formatCurrency(totals.byType.savings);
        document.getElementById('savingsPercent').textContent = total > 0 ? 
            `${((totals.byType.savings / total) * 100).toFixed(1)}%` : '0%';
        
        // Render person by asset type breakdowns
        document.getElementById('deanStocks').textContent = formatCurrency(totals.p1ByType.stock);
        document.getElementById('samStocks').textContent = formatCurrency(totals.p2ByType.stock);
        
        document.getElementById('deanCrypto').textContent = formatCurrency(totals.p1ByType.crypto);
        document.getElementById('samCrypto').textContent = formatCurrency(totals.p2ByType.crypto);
        
        document.getElementById('deanMetals').textContent = formatCurrency(totals.p1ByType.metal);
        document.getElementById('samMetals').textContent = formatCurrency(totals.p2ByType.metal);
        
        document.getElementById('deanSavings').textContent = formatCurrency(totals.p1ByType.savings);
        document.getElementById('samSavings').textContent = formatCurrency(totals.p2ByType.savings);
    }

    function renderTable() {
        const tbody = document.getElementById('holdingsTableBody');
        
        // Filter assets
        let filtered = state.assets.filter(asset => {
            if (currentFilter !== 'all' && asset.type !== currentFilter) {
                return false;
            }
            if (currentSearch) {
                const searchLower = currentSearch.toLowerCase();
                return asset.name.toLowerCase().includes(searchLower) ||
                       asset.symbol.toLowerCase().includes(searchLower);
            }
            return true;
        });

        // Sort assets
        if (currentSort.column) {
            filtered.sort((a, b) => {
                let aVal, bVal;
                
                if (currentSort.column === 'name') {
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                } else if (currentSort.column === 'type') {
                    aVal = a.type;
                    bVal = b.type;
                } else if (currentSort.column === 'price') {
                    // Sort by 24h percentage change from API
                    const aCacheKey = `${a.type}:${a.symbol}`;
                    const bCacheKey = `${b.type}:${b.symbol}`;
                    
                    // Use stored 24h change percentages from API
                    aVal = state.priceCache.changePercents && state.priceCache.changePercents[aCacheKey] !== undefined
                        ? Number(state.priceCache.changePercents[aCacheKey])
                        : 0;
                    bVal = state.priceCache.changePercents && state.priceCache.changePercents[bCacheKey] !== undefined
                        ? Number(state.priceCache.changePercents[bCacheKey])
                        : 0;
                } else if (currentSort.column === 'combined') {
                    const aCalc = calculateAssetValues(a);
                    const bCalc = calculateAssetValues(b);
                    aVal = aCalc.combined.value;
                    bVal = bCalc.combined.value;
                }
                
                if (aVal < bVal) return currentSort.ascending ? -1 : 1;
                if (aVal > bVal) return currentSort.ascending ? 1 : -1;
                return 0;
            });
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="empty-state">No assets found.</td></tr>';
            return;
        }

        // Calculate total for percentages
        const totals = calculateTotals();
        const totalValue = totals.combined.value;

        tbody.innerHTML = filtered.map(asset => {
            const calc = calculateAssetValues(asset);
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const hasPrice = state.priceCache.prices[cacheKey] !== undefined;
            const priceChange = hasPrice ? getPriceChange(cacheKey, calc.price) : { arrow: '', className: '', percent: '' };

            return `
                <tr>
                    <td class="asset-name">${asset.name}</td>
                    <td class="asset-type">${asset.type}</td>
                    <td>${asset.symbol}</td>
                    <td class="price-cell">
                        ${asset.type === 'savings' ? `
                            <span class="price-na">N/A</span>
                        ` : hasPrice ? `
                            <div class="price-wrapper ${priceChange.className}">
                                <span>${formatCurrency(calc.price)}</span>
                                ${priceChange.arrow ? `<span class="price-indicator">${priceChange.arrow} ${priceChange.percent}</span>` : ''}
                            </div>
                        ` : '<span class="price-error">ERR</span>'}
                    </td>
                    <td>${calc.p1.qty}</td>
                    <td>${formatCurrency(calc.p1.value)}</td>
                    <td>${calc.p2.qty}</td>
                    <td>${formatCurrency(calc.p2.value)}</td>
                    <td>${formatCurrency(calc.combined.value)}</td>
                    <td class="percent-cell">${totalValue > 0 ? ((calc.combined.value / totalValue) * 100).toFixed(1) : '0'}%</td>
                    <td>
                        <div class="action-btns">
                            <button onclick="window.portfolioApp.editAsset('${asset.id}')">Edit</button>
                            <button onclick="window.portfolioApp.deleteAsset('${asset.id}')" class="delete-btn">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderLastUpdated() {
        const lastUpdated = state.priceCache.lastUpdated;
        const el = document.getElementById('lastUpdated');
        
        if (lastUpdated === 0) {
            el.textContent = 'Last updated: Never';
        } else {
            const date = new Date(lastUpdated);
            el.textContent = `Last updated: ${date.toLocaleString()}`;
        }
        
        // Update assets count
        const count = state.assets.length;
        document.getElementById('assetsCount').textContent = `${count} Asset${count !== 1 ? 's' : ''}`;
    }

    function renderQuickStats() {
        const section = document.getElementById('quickStats');
        
        if (state.assets.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'grid';
        
        // Find best and worst performers
        let bestChange = { asset: null, percent: -Infinity };
        let worstChange = { asset: null, percent: Infinity };
        
        state.assets.forEach(asset => {
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const changePercent = state.priceCache.changePercents && state.priceCache.changePercents[cacheKey];
            
            if (changePercent !== undefined && changePercent !== null) {
                if (changePercent > bestChange.percent) {
                    bestChange = { asset, percent: changePercent };
                }
                if (changePercent < worstChange.percent) {
                    worstChange = { asset, percent: changePercent };
                }
            }
        });
        
        // Update best performer
        const bestEl = document.getElementById('bestPerformer');
        if (bestChange.asset) {
            bestEl.textContent = `${bestChange.asset.name} (+${bestChange.percent.toFixed(2)}%)`;
        } else {
            bestEl.textContent = 'No change data';
        }
        
        // Update worst performer
        const worstEl = document.getElementById('worstPerformer');
        if (worstChange.asset) {
            worstEl.textContent = `${worstChange.asset.name} (${worstChange.percent.toFixed(2)}%)`;
        } else {
            worstEl.textContent = 'No change data';
        }
        
        // Update total value and count
        const totals = calculateTotals();
        document.getElementById('quickTotalValue').textContent = formatCurrency(totals.combined.value);
        document.getElementById('quickAssetsCount').textContent = state.assets.length;
    }

    // Import/Export
    function exportData() {
        // Export data with API keys from settings
        const exportData = {
            ...state
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio_backup.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }

    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                
                // Validate structure
                if (!imported.assets || !Array.isArray(imported.assets)) {
                    alert('Invalid backup file: missing assets array');
                    return;
                }
                if (!imported.settings) {
                    alert('Invalid backup file: missing settings');
                    return;
                }

                // Ensure snapshots array exists
                if (!imported.snapshots) {
                    imported.snapshots = [];
                }

                // Handle API keys - migrate to settings.apiKeys structure
                if (imported.apiKeys) {
                    // If old format (apiKeys at root), move to settings
                    if (!imported.settings.apiKeys) {
                        imported.settings.apiKeys = {
                            FINNHUB_KEY: imported.apiKeys.FINNHUB_KEY || '',
                            METALS_DEV_KEY: imported.apiKeys.METALS_DEV_KEY || ''
                        };
                    }
                    delete imported.apiKeys;
                }
                
                // Ensure settings.apiKeys exists
                if (!imported.settings.apiKeys) {
                    imported.settings.apiKeys = {
                        FINNHUB_KEY: '',
                        METALS_DEV_KEY: ''
                    };
                }

                state = imported;
                
                // Update APP_CONFIG with imported keys
                if (state.settings.apiKeys.FINNHUB_KEY) {
                    window.APP_CONFIG.FINNHUB_KEY = state.settings.apiKeys.FINNHUB_KEY;
                }
                if (state.settings.apiKeys.METALS_DEV_KEY) {
                    window.APP_CONFIG.METALS_DEV_KEY = state.settings.apiKeys.METALS_DEV_KEY;
                }
                
                saveState();
                render();
                alert('Portfolio imported successfully!');
            } catch (error) {
                console.error('Import error:', error);
                alert('Failed to import: invalid JSON file');
            }
        };
        
        reader.readAsText(file);
        e.target.value = ''; // Reset file input
    }

    // Quantity adjustment helper
    function adjustQuantity(person, operation) {
        const qtyInput = document.getElementById(`${person}Qty`);
        const adjustInput = document.getElementById(`${person}AdjustAmount`);
        
        const currentQty = parseFloat(qtyInput.value) || 0;
        const adjustAmount = parseFloat(adjustInput.value) || 0;
        
        if (adjustAmount <= 0) {
            alert('Please enter a valid amount to add or remove');
            return;
        }
        
        let newQty;
        if (operation === 'add') {
            newQty = currentQty + adjustAmount;
        } else if (operation === 'remove') {
            newQty = Math.max(0, currentQty - adjustAmount);
        }
        
        qtyInput.value = newQty;
        adjustInput.value = ''; // Clear the adjustment input
    }

    // Expose functions for inline event handlers
    window.portfolioApp = {
        editAsset: openEditModal,
        deleteAsset: deleteAsset,
        adjustQuantity: adjustQuantity
    };

})();
