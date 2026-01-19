// Portfolio Tracker App - Vanilla JS
(function() {
    'use strict';

    // State
    let state = {
        settings: {
            baseCurrency: "USD",
            people: ["Dean", "Sam"]
        },
        assets: [],
        priceCache: {
            lastUpdated: 0,
            prices: {},
            previousPrices: {}
        },
        snapshots: []
    };

    let currentFilter = 'all';
    let currentSearch = '';
    let currentSort = { column: null, ascending: true };

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadState();
        setupEventListeners();
        render();
    }

    // Storage
    function loadState() {
        const stored = localStorage.getItem('portfolio_v1');
        if (stored) {
            try {
                state = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse stored data:', e);
            }
        }
    }

    function saveState() {
        localStorage.setItem('portfolio_v1', JSON.stringify(state));
    }

    // Event Listeners
    function setupEventListeners() {
        // Header buttons
        document.getElementById('refreshBtn').addEventListener('click', refreshPrices);
        document.getElementById('snapshotBtn').addEventListener('click', saveSnapshot);
        document.getElementById('clearSnapshotsBtn').addEventListener('click', clearSnapshots);
        document.getElementById('exportBtn').addEventListener('click', exportData);
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', importData);

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

        // Modal
        document.getElementById('closeModal').addEventListener('click', closeModal);
        document.getElementById('cancelBtn').addEventListener('click', closeModal);
        document.getElementById('assetForm').addEventListener('submit', handleFormSubmit);
        document.getElementById('assetType').addEventListener('change', handleTypeChange);

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

        handleTypeChange();
        document.getElementById('assetModal').classList.add('active');
    }

    function closeModal() {
        document.getElementById('assetModal').classList.remove('active');
    }

    function handleTypeChange() {
        const type = document.getElementById('assetType').value;
        const unitGroup = document.getElementById('unitGroup');
        unitGroup.style.display = type === 'metal' ? 'block' : 'none';
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

        const asset = {
            id: assetId || `asset_${Date.now()}`,
            type,
            symbol,
            name,
            holdings: {
                p1: { qty: p1Qty, avgCost: 0 },
                p2: { qty: p2Qty, avgCost: 0 }
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

            // Fetch prices (Finnhub for both stocks and crypto)
            const [stockPrices, cryptoPrices, metalPrices] = await Promise.all([
                stocks.length > 0 ? fetchStockPricesFinnhub(stocks) : Promise.resolve(new Map()),
                cryptos.length > 0 ? fetchCryptoPricesFinnhub(cryptos) : Promise.resolve(new Map()),
                metals.length > 0 ? fetchMetalPricesMetalsDev(metals, state.settings.baseCurrency) : Promise.resolve(new Map())
            ]);

            console.log('Fetched prices:', { 
                stocks: Array.from(stockPrices.entries()),
                cryptos: Array.from(cryptoPrices.entries()),
                metals: Array.from(metalPrices.entries())
            });

            // Update cache
            state.assets.forEach(asset => {
                const cacheKey = `${asset.type}:${asset.symbol}`;
                let price = null;

                if (asset.type === 'stock') {
                    price = stockPrices.get(asset.symbol);
                } else if (asset.type === 'crypto') {
                    price = cryptoPrices.get(asset.symbol);
                } else if (asset.type === 'metal') {
                    price = metalPrices.get(asset.symbol);
                } else if (asset.type === 'savings') {
                    // Savings use 1:1 value (quantity = dollar amount)
                    price = 1.0;
                }

                console.log(`Processing ${asset.name} (${cacheKey}): price=${price}`);

                if (price !== null && price !== undefined && !isNaN(price)) {
                    // Store previous price before updating
                    if (state.priceCache.prices[cacheKey] !== undefined) {
                        state.priceCache.previousPrices[cacheKey] = state.priceCache.prices[cacheKey];
                    }
                    state.priceCache.prices[cacheKey] = price;
                    results.updated++;
                    console.log(`✓ Updated ${cacheKey} = ${price}`);
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

    async function fetchStockPricesFinnhub(symbols) {
        const prices = new Map();
        const apiKey = window.APP_CONFIG?.FINNHUB_KEY;

        if (!apiKey || apiKey === 'PASTE_KEY_HERE') {
            console.warn('Finnhub API key not configured');
            return prices;
        }

        for (const symbol of symbols) {
            try {
                const response = await fetch(
                    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
                );
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.c && data.c > 0) {
                        prices.set(symbol, data.c);
                    }
                }
            } catch (error) {
                console.error(`Error fetching ${symbol}:`, error);
            }
        }

        return prices;
    }

    async function fetchCryptoPricesFinnhub(symbols) {
        const prices = new Map();
        const apiKey = window.APP_CONFIG?.FINNHUB_KEY;

        if (!apiKey || apiKey === 'PASTE_KEY_HERE') {
            console.warn('Finnhub API key not configured');
            return prices;
        }

        // Use same fetcher as stocks - Finnhub handles crypto symbols like BINANCE:BTCUSDT
        for (const symbol of symbols) {
            try {
                const response = await fetch(
                    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
                );
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.c && data.c > 0) {
                        prices.set(symbol, data.c);
                    }
                }
            } catch (error) {
                console.error(`Error fetching ${symbol}:`, error);
            }
        }

        return prices;
    }

    async function fetchMetalPricesMetalsDev(metals, baseCurrency) {
        const prices = new Map();
        const apiKey = window.APP_CONFIG?.METALS_DEV_KEY;

        if (!apiKey || apiKey === 'PASTE_KEY_HERE') {
            console.warn('metals.dev API key not configured');
            return prices;
        }

        for (const metal of metals) {
            try {
                const response = await fetch(
                    `https://api.metals.dev/v1/metal/spot?api_key=${apiKey}&metal=${metal}&currency=${baseCurrency}`
                );

                if (response.ok) {
                    const data = await response.json();
                    console.log(`metals.dev response for ${metal}:`, data);
                    
                    // metals.dev returns: { rate: { price: 4670.99, ask: ..., bid: ... } }
                    let price = null;
                    
                    // Check if rate is an object with nested price
                    if (data.rate && typeof data.rate === 'object' && data.rate.price !== undefined) {
                        price = data.rate.price;
                    } else if (typeof data.rate === 'number') {
                        price = data.rate;
                    } else if (data.price !== undefined && data.price !== null) {
                        price = data.price;
                    } else if (data.spot !== undefined && data.spot !== null) {
                        price = data.spot;
                    } else if (data.value !== undefined && data.value !== null) {
                        price = data.value;
                    }
                    
                    if (price !== null && !isNaN(price) && price > 0) {
                        console.log(`✓ Setting price for ${metal}: ${price}`);
                        prices.set(metal, price);
                    } else {
                        console.warn(`✗ Could not extract valid price for ${metal}`);
                    }
                } else {
                    console.error(`metals.dev API error for ${metal}: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error(`Error fetching ${metal}:`, error);
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
            p1: { value: 0 },
            p2: { value: 0 },
            combined: { value: 0 },
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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: state.settings.baseCurrency
        }).format(value);
    }

    function getPriceChange(cacheKey, currentPrice) {
        const previousPrice = state.priceCache.previousPrices[cacheKey];
        if (!previousPrice || previousPrice === currentPrice) {
            return { arrow: '', className: '', percent: '' };
        }
        
        const change = currentPrice - previousPrice;
        const changePercent = ((change / previousPrice) * 100).toFixed(2);
        
        if (change > 0) {
            return { 
                arrow: '↑', 
                className: 'price-up', 
                percent: `+${changePercent}%` 
            };
        } else {
            return { 
                arrow: '↓', 
                className: 'price-down', 
                percent: `${changePercent}%` 
            };
        }
    }

    // Render
    function render() {
        renderSummary();
        renderTable();
        renderLastUpdated();
        renderSnapshots();
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
                    const aCacheKey = `${a.type}:${a.symbol}`;
                    const bCacheKey = `${b.type}:${b.symbol}`;
                    aVal = state.priceCache.prices[aCacheKey] || 0;
                    bVal = state.priceCache.prices[bCacheKey] || 0;
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
                        ${hasPrice ? `
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
    }

    // Historical Snapshots
    function saveSnapshot() {
        const totals = calculateTotals();
        const snapshot = {
            date: new Date().toISOString(),
            timestamp: Date.now(),
            totalValue: totals.combined.value,
            deanTotal: totals.p1.value,
            samTotal: totals.p2.value,
            byType: { ...totals.byType },
            assetCount: state.assets.length
        };
        
        state.snapshots.push(snapshot);
        // Keep only last 20 snapshots
        if (state.snapshots.length > 20) {
            state.snapshots = state.snapshots.slice(-20);
        }
        
        saveState();
        renderSnapshots();
        alert('Snapshot saved!');
    }

    function clearSnapshots() {
        if (!confirm('Clear all snapshots?')) return;
        state.snapshots = [];
        saveState();
        renderSnapshots();
    }

    function deleteSnapshot(timestamp) {
        state.snapshots = state.snapshots.filter(s => s.timestamp !== timestamp);
        saveState();
        renderSnapshots();
    }

    function renderSnapshots() {
        const section = document.getElementById('snapshotsSection');
        const list = document.getElementById('snapshotsList');
        
        if (state.snapshots.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        
        // Sort by date descending
        const sorted = [...state.snapshots].sort((a, b) => b.timestamp - a.timestamp);
        
        list.innerHTML = sorted.map(snapshot => {
            const date = new Date(snapshot.date);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            return `
                <div class="snapshot-card">
                    <div class="snapshot-header">
                        <span class="snapshot-date">${formattedDate}</span>
                        <button onclick="window.portfolioApp.deleteSnapshot(${snapshot.timestamp})" class="btn-delete-snapshot">×</button>
                    </div>
                    <div class="snapshot-data">
                        <div class="snapshot-item">
                            <span class="snapshot-label">Total:</span>
                            <span class="snapshot-value">${formatCurrency(snapshot.totalValue)}</span>
                        </div>
                        <div class="snapshot-item">
                            <span class="snapshot-label">Dean:</span>
                            <span>${formatCurrency(snapshot.deanTotal)}</span>
                        </div>
                        <div class="snapshot-item">
                            <span class="snapshot-label">Sam:</span>
                            <span>${formatCurrency(snapshot.samTotal)}</span>
                        </div>
                        <div class="snapshot-breakdown">
                            <span>Stocks: ${formatCurrency(snapshot.byType.stock)}</span>
                            <span>Crypto: ${formatCurrency(snapshot.byType.crypto)}</span>
                            <span>Metals: ${formatCurrency(snapshot.byType.metal)}</span>
                            <span>Savings: ${formatCurrency(snapshot.byType.savings)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Import/Export
    function exportData() {
        const dataStr = JSON.stringify(state, null, 2);
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

                state = imported;
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

    // Expose functions for inline event handlers
    window.portfolioApp = {
        editAsset: openEditModal,
        deleteAsset: deleteAsset,
        deleteSnapshot: deleteSnapshot
    };

})();
