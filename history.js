// Portfolio History Page
(function() {
    'use strict';

    let state = null;
    const chartTheme = window.PortfolioChartTheme.colors;

    document.addEventListener('DOMContentLoaded', init);

    let historyChartInstance = null;
    let activeChartFilter = 'all';
    let currentOwnerFilter = localStorage.getItem('portfolio_owner_filter') || 'all';
    if (!['all', 'p1', 'p2', 'p3'].includes(currentOwnerFilter)) currentOwnerFilter = 'all';

    function getCompactOwnerLabel(name) {
        return name === 'Combined Investments' ? 'Joint' : name;
    }

    function getSnapshotValue(snapshot) {
        if (!snapshot) return 0;
        return currentOwnerFilter === 'all' ? snapshot.totalValue || 0 : snapshot[`${currentOwnerFilter}Value`] || 0;
    }

    function getSnapshotTypeValue(snapshot, type) {
        if (currentOwnerFilter === 'all') return snapshot.byType?.[type] || 0;
        if (!snapshot.assets?.length) return 0;
        return snapshot.assets.filter(asset => asset.type === type)
            .reduce((sum, asset) => sum + (asset[`${currentOwnerFilter}Value`] || 0), 0);
    }

    function init() {
        loadState();
        window.PortfolioChartTheme.apply();
        initializeAPIKeys();
        setupEventListeners();
        render();
        updateLastUpdated();
        
        // Track page view
        if (typeof gtag === 'function') {
            gtag('event', 'page_view', {
                page_title: 'History & Snapshots',
                page_location: window.location.href
            });
        }
    }

    function loadState() {
        const stored = localStorage.getItem('portfolio_v1');
        if (stored) {
            try {
                state = JSON.parse(stored);
                if (!state.snapshots) {
                    state.snapshots = [];
                }
                if (!state.transactions) {
                    state.transactions = [];
                }
                if (!state.priceCache) {
                    state.priceCache = {
                        lastUpdated: 0,
                        prices: {},
                        previousPrices: {},
                        changePercents: {}
                    };
                }
                if (!state.assets) {
                    state.assets = [];
                }
                if (!state.settings) {
                    state.settings = {
                        baseCurrency: "USD",
                        people: ['Person 1', 'Person 2', 'Combined Investments'],
                        apiKeys: {
                            FINNHUB_KEY: '',
                            METALS_DEV_KEY: ''
                        }
                    };
                }
            } catch (e) {
                console.error('Failed to parse stored data:', e);
                state = { 
                    snapshots: [], 
                    transactions: [],
                    assets: [],
                    priceCache: {
                        lastUpdated: 0,
                        prices: {},
                        previousPrices: {},
                        changePercents: {}
                    },
                    settings: {
                        baseCurrency: "USD",
                        people: ['Person 1', 'Person 2', 'Combined Investments'],
                        apiKeys: {
                            FINNHUB_KEY: '',
                            METALS_DEV_KEY: ''
                        }
                    }
                };
            }
        } else {
            state = { 
                snapshots: [], 
                transactions: [],
                assets: [],
                priceCache: {
                    lastUpdated: 0,
                    prices: {},
                    previousPrices: {},
                    changePercents: {}
                },
                settings: {
                    baseCurrency: "USD",
                    people: ['Person 1', 'Person 2', 'Combined Investments'],
                    apiKeys: {
                        FINNHUB_KEY: '',
                        METALS_DEV_KEY: ''
                    }
                }
            };
        }
        const people = state.settings?.people || [];
        state.settings.people = [people[0] || 'Person 1', people[1] || 'Person 2', people[2] || 'Combined Investments'];
        (state.assets || []).forEach(asset => {
            asset.holdings = asset.holdings || {};
            asset.holdings.p3 = asset.holdings.p3 || { qty: 0, avgCost: 0, dividend: 0 };
        });
    }

    function initializeAPIKeys() {
        // Initialize window.APP_CONFIG if it doesn't exist
        if (!window.APP_CONFIG) {
            window.APP_CONFIG = {
                FINNHUB_KEY: '',
                METALS_DEV_KEY: ''
            };
        }
        
        // Override APP_CONFIG with stored API keys from settings
        if (state.settings?.apiKeys?.FINNHUB_KEY) {
            window.APP_CONFIG.FINNHUB_KEY = state.settings.apiKeys.FINNHUB_KEY;
        }
        if (state.settings?.apiKeys?.METALS_DEV_KEY) {
            window.APP_CONFIG.METALS_DEV_KEY = state.settings.apiKeys.METALS_DEV_KEY;
        }
    }

    function saveState() {
        localStorage.setItem('portfolio_v1', JSON.stringify(state));
    }

    function getTransactionsForPeriod(startTimestamp, endTimestamp) {
        return (state.transactions || []).filter(transaction =>
            transaction.timestamp > startTimestamp && transaction.timestamp <= endTimestamp
        );
    }

    function getTransactionCashFlow(transaction, snapshot) {
        const snapshotAsset = snapshot?.assets?.find(asset =>
            asset.type === transaction.asset?.type && asset.symbol === transaction.asset?.symbol
        );
        const cacheKey = `${transaction.asset?.type}:${transaction.asset?.symbol}`;
        const price = transaction.price || snapshotAsset?.price || state.priceCache?.prices?.[cacheKey] || 0;
        const quantities = transaction.quantities || {};
        const changes = transaction.changes || {};
        let quantityChange = 0;

        if (transaction.action === 'add') {
            quantityChange = currentOwnerFilter === 'all' ? (quantities.p1 || 0) + (quantities.p2 || 0) + (quantities.p3 || 0) : quantities[currentOwnerFilter] || 0;
        } else if (transaction.action === 'remove') {
            quantityChange = -(currentOwnerFilter === 'all' ? (quantities.p1 || 0) + (quantities.p2 || 0) + (quantities.p3 || 0) : quantities[currentOwnerFilter] || 0);
        } else {
            quantityChange = currentOwnerFilter === 'all' ? (changes.p1 || 0) + (changes.p2 || 0) + (changes.p3 || 0) : changes[currentOwnerFilter] || 0;
        }

        return quantityChange * price;
    }

    function getSnapshotMovement(snapshot, previousSnapshot) {
        if (!previousSnapshot) return { contribution: 0, transactions: [] };
        const transactions = getTransactionsForPeriod(previousSnapshot.timestamp, snapshot.timestamp);
        const calculatedContribution = transactions.reduce((sum, transaction) =>
            sum + getTransactionCashFlow(transaction, snapshot), 0
        );
        const storedPeriodMatches = currentOwnerFilter === 'all' && snapshot.previousSnapshotTimestamp === previousSnapshot.timestamp;
        const contribution = storedPeriodMatches && Number.isFinite(snapshot.contributionFromPrevious)
            ? snapshot.contributionFromPrevious
            : calculatedContribution;
        return { contribution, transactions };
    }

    function setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', refreshPrices);
        document.getElementById('saveSnapshotBtn').addEventListener('click', saveSnapshot);
        document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
        const ownerFilter = document.getElementById('ownerFilter');
        ownerFilter.options[1].textContent = state.settings.people[0];
        ownerFilter.options[2].textContent = state.settings.people[1];
        ownerFilter.options[3].textContent = getCompactOwnerLabel(state.settings.people[2]);
        ownerFilter.value = currentOwnerFilter;
        ownerFilter.addEventListener('change', event => {
            localStorage.setItem('portfolio_owner_filter', event.target.value);
            window.location.reload();
        });

        document.querySelectorAll('.chart-filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                activeChartFilter = this.dataset.filter;
                renderHistoryChart(state.snapshots || []);
            });
        });
    }

    // Refresh prices
    async function refreshPrices() {
        // This app is meant to be refreshed about once a day to take a
        // snapshot (metals.dev's free plan only allows ~100 requests/month,
        // so repeated same-day refreshes burn through that fast). Nudge
        // instead of blocking, since there are legitimate reasons to refresh
        // again (added an asset, fixed a key).
        if (window.PriceService.isSameLocalDay(state.priceCache.lastUpdated)) {
            const lastTime = new Date(state.priceCache.lastUpdated).toLocaleTimeString();
            const proceed = confirm(
                `Prices were already refreshed today at ${lastTime}.\n\n` +
                `This tracker is designed for one refresh per day, and the metals.dev free plan only allows ~100 requests per month. Refresh again anyway?`
            );
            if (!proceed) return;
        }

        const btn = document.getElementById('refreshBtn');
        const statusEl = document.getElementById('updateStatus');

        btn.disabled = true;
        btn.textContent = '🔄 Refreshing...';
        statusEl.textContent = 'Fetching prices...';

        try {
            // Collect all symbols by type
            const stocks = [];
            const cryptos = [];
            const metals = [];

            state.assets.forEach(asset => {
                if (asset.type === 'stock') stocks.push(asset.symbol);
                else if (asset.type === 'crypto') cryptos.push(asset.symbol);
                else if (asset.type === 'metal') metals.push(asset.symbol);
            });

            // Update status with progress
            const totalAssets = stocks.length + cryptos.length + metals.length;
            let fetchedCount = 0;

            const updateProgress = () => {
                fetchedCount++;
                const percent = totalAssets > 0 ? ((fetchedCount / totalAssets) * 100).toFixed(0) : '100';
                statusEl.textContent = `Fetching prices... ${fetchedCount}/${totalAssets} (${percent}%)`;
            };

            // Fetch prices: Finnhub (stocks + crypto) via a concurrent pool, and
            // every tracked metal in a single metals.dev batch call.
            const priceMap = await window.PriceService.refreshAll({
                stocks,
                cryptos,
                metals,
                baseCurrency: state.settings.baseCurrency,
                finnhubKey: window.APP_CONFIG?.FINNHUB_KEY,
                metalsKey: window.APP_CONFIG?.METALS_DEV_KEY,
                onProgress: updateProgress
            });

            if (!state.priceCache.changePercents) state.priceCache.changePercents = {};

            priceMap.forEach((priceData, cacheKey) => {
                state.priceCache.prices[cacheKey] = priceData.price;
                state.priceCache.changePercents[cacheKey] = priceData.changePercent;
            });

            // Update cache timestamp
            state.priceCache.lastUpdated = Date.now();
            saveState();
            
            // Update UI
            updateLastUpdated();
            statusEl.textContent = 'Prices updated!';
            setTimeout(() => {
                statusEl.textContent = '';
            }, 3000);
            
        } catch (error) {
            console.error('Error refreshing prices:', error);
            statusEl.textContent = 'Error fetching prices';
        } finally {
            btn.disabled = false;
            btn.textContent = '🔄 Refresh Prices';
        }
    }

    function updateLastUpdated() {
        const lastUpdated = document.getElementById('lastUpdated');
        if (state.priceCache.lastUpdated) {
            const date = new Date(state.priceCache.lastUpdated);
            lastUpdated.textContent = `Last updated: ${date.toLocaleString()}`;
        }
    }

    function clearHistory() {
        if (!state.snapshots || state.snapshots.length === 0) {
            alert('No history to clear.');
            return;
        }

        if (!confirm(`Are you sure you want to delete all ${state.snapshots.length} snapshots? This cannot be undone.`)) {
            return;
        }

        state.snapshots = [];
        saveState();
        render();
        alert('History cleared successfully.');
    }

    // Save portfolio snapshot
    function saveSnapshot() {
        if (!state.assets || state.assets.length === 0) {
            alert('No assets to snapshot. Add some assets first.');
            return;
        }

        // Check if prices have been loaded
        if (!state.priceCache || !state.priceCache.prices || Object.keys(state.priceCache.prices).length === 0) {
            alert('No price data available.\n\nPlease click "Refresh Prices" first, then save the snapshot.');
            return;
        }

        // Calculate current Total Portfolio value
        let totalValue = 0;
        let assetsUp = 0;
        let assetsDown = 0;
        let assetsUnchanged = 0;
        let assetsMissingPrice = 0;

        state.assets.forEach((asset) => {
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const currentPrice = state.priceCache.prices[cacheKey] || 0;
            const changePercent = state.priceCache.changePercents?.[cacheKey] || 0;
            
            // Quantities are stored separately for two people and joint holdings.
            const owner1Qty = asset.holdings?.p1?.qty || 0;
            const owner2Qty = asset.holdings?.p2?.qty || 0;
            const jointQty = asset.holdings?.p3?.qty || 0;
            const totalQty = owner1Qty + owner2Qty + jointQty;
            
            const assetValue = currentPrice * totalQty;
            
            if (currentPrice > 0) {
                totalValue += assetValue;
            } else {
                assetsMissingPrice++;
            }

            if (changePercent > 0) assetsUp++;
            else if (changePercent < 0) assetsDown++;
            else assetsUnchanged++;
        });

        // Warn if some assets don't have prices
        if (assetsMissingPrice > 0) {
            if (!confirm(`Warning: ${assetsMissingPrice} asset(s) don't have price data and will be excluded.\n\nTotal Portfolio: $${totalValue.toFixed(2)}\n\nContinue saving snapshot?`)) {
                return;
            }
        }

        // Get previous snapshot for comparison (last snapshot, regardless of date)
        const previousSnapshot = state.snapshots.length > 0 ? state.snapshots[state.snapshots.length - 1] : null;
        const previousValue = previousSnapshot ? previousSnapshot.totalValue : totalValue;
        const changeFromPrevious = totalValue - previousValue;
        const changePercentFromPrevious = previousValue > 0 ? ((changeFromPrevious / previousValue) * 100) : 0;

        // Calculate per-person values
        let p1Value = 0;
        let p2Value = 0;
        let p3Value = 0;
        const byType = { stock: 0, crypto: 0, metal: 0, savings: 0 };
        const snapshotAssets = [];
        state.assets.forEach((asset) => {
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const currentPrice = state.priceCache.prices[cacheKey] || 0;
            if (currentPrice > 0) {
                const p1Qty = asset.holdings?.p1?.qty || 0;
                const p2Qty = asset.holdings?.p2?.qty || 0;
                const p3Qty = asset.holdings?.p3?.qty || 0;
                const av = currentPrice * (p1Qty + p2Qty + p3Qty);
                p1Value += currentPrice * p1Qty;
                p2Value += currentPrice * p2Qty;
                p3Value += currentPrice * p3Qty;
                if (byType[asset.type] !== undefined) byType[asset.type] += av;
                snapshotAssets.push({
                    type: asset.type,
                    symbol: asset.symbol,
                    name: asset.name,
                    price: currentPrice,
                    p1Value: currentPrice * p1Qty,
                    p2Value: currentPrice * p2Qty,
                    p3Value: currentPrice * p3Qty,
                    totalValue: av
                });
            }
        });

        const periodTransactions = previousSnapshot
            ? getTransactionsForPeriod(previousSnapshot.timestamp, Date.now())
            : [];
        const contribution = previousSnapshot
            ? periodTransactions.reduce((sum, transaction) => sum + getTransactionCashFlow(transaction, { assets: snapshotAssets }), 0)
            : 0;

        // Create snapshot
        const snapshot = {
            timestamp: Date.now(),
            date: new Date().toISOString(),
            totalValue: totalValue,
            p1Value: p1Value,
            p2Value: p2Value,
            p3Value: p3Value,
            byType: byType,
            assets: snapshotAssets,
            previousSnapshotTimestamp: previousSnapshot?.timestamp || null,
            contributionFromPrevious: contribution,
            changeFromPrevious: changeFromPrevious,
            changePercentFromPrevious: changePercentFromPrevious,
            assetsUp: assetsUp,
            assetsDown: assetsDown,
            assetsUnchanged: assetsUnchanged,
            totalAssets: state.assets.length
        };

        // Add to snapshots array
        if (!state.snapshots) {
            state.snapshots = [];
        }
        state.snapshots.push(snapshot);

        // Save state
        saveState();

        // Track snapshot creation
        if (typeof gtag === 'function') {
            gtag('event', 'create_snapshot', {
                total_value: totalValue,
                asset_count: state.assets.length,
                is_first_snapshot: !previousSnapshot
            });
        }

        // Show confirmation
        const message = previousSnapshot 
            ? `Snapshot saved!\nTotal Portfolio: $${totalValue.toFixed(2)}\nChange from last snapshot: ${changeFromPrevious >= 0 ? '+' : ''}$${changeFromPrevious.toFixed(2)} (${changePercentFromPrevious >= 0 ? '+' : ''}${changePercentFromPrevious.toFixed(2)}%)`
            : `First snapshot saved!\nTotal Portfolio: $${totalValue.toFixed(2)}`;
        
        alert(message);
        
        // Re-render to show updated data
        render();
    }

    function deleteSnapshot(index) {
        if (!confirm('Delete this snapshot?')) {
            return;
        }

        state.snapshots.splice(index, 1);
        saveState();
        render();
    }

    function filterSnapshotsByRange(snapshots, filter) {
        if (!snapshots || snapshots.length === 0) return snapshots;
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        switch (filter) {
            case '1d':
                return snapshots.filter(s => s.timestamp >= now - day);
            case '7d':
                return snapshots.filter(s => s.timestamp >= now - 7 * day);
            case '30d':
                return snapshots.filter(s => s.timestamp >= now - 30 * day);
            case '1y':
                return snapshots.filter(s => s.timestamp >= now - 365 * day);
            case 'ytd': {
                const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
                return snapshots.filter(s => s.timestamp >= startOfYear);
            }
            default:
                return snapshots;
        }
    }

    function renderHistoryChart(snapshots) {
        const canvas = document.getElementById('historyChart');
        const emptyEl = document.getElementById('historyChartEmpty');

        const snapshots_filtered = filterSnapshotsByRange(snapshots, activeChartFilter);
        snapshots = snapshots_filtered;

        if (!snapshots || snapshots.length < 2) {
            canvas.style.display = 'none';
            emptyEl.style.display = 'flex';
            const filterLabel = { '1d': 'last 24 hours', '7d': 'last 7 days', '30d': 'last 30 days', '1y': 'last year', 'ytd': 'year to date', 'all': '' }[activeChartFilter] || '';
            if (activeChartFilter !== 'all' && (state.snapshots || []).length >= 2) {
                emptyEl.textContent = `No snapshots found for the ${filterLabel}.`;
            } else {
                emptyEl.textContent = snapshots.length === 1
                    ? 'Save at least 2 snapshots to see the chart.'
                    : 'No snapshots yet — save a snapshot to see your chart.';
            }
            if (historyChartInstance) {
                historyChartInstance.destroy();
                historyChartInstance = null;
            }
            return;
        }

        canvas.style.display = 'block';
        emptyEl.style.display = 'none';

        const personLabels = state.settings?.people || ['Person 1', 'Person 2', 'Combined Investments'];
        const labels = snapshots.map(s => {
            const d = new Date(s.timestamp);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
        });

        const totalData  = snapshots.map(s => parseFloat(s.totalValue.toFixed(2)));
        const p1Data     = snapshots.map(s => parseFloat((s.p1Value || 0).toFixed(2)));
        const p2Data     = snapshots.map(s => parseFloat((s.p2Value || 0).toFixed(2)));
        const p3Data     = snapshots.map(s => parseFloat((s.p3Value || 0).toFixed(2)));
        const historyContext = canvas.getContext('2d');
        const totalGradient = historyContext.createLinearGradient(0, 0, 0, 320);
        totalGradient.addColorStop(0, 'rgba(96, 165, 250, 0.22)');
        totalGradient.addColorStop(1, 'rgba(96, 165, 250, 0)');

        const datasets = [
            {
                label: 'Total Portfolio',
                data: totalData,
                borderColor: chartTheme.stock,
                backgroundColor: totalGradient,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHitRadius: 12,
                fill: true,
                tension: 0.35,
                hidden: currentOwnerFilter !== 'all'
            },
            {
                label: personLabels[0],
                data: p1Data,
                borderColor: chartTheme.savings,
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHitRadius: 12,
                fill: false,
                tension: 0.35,
                hidden: currentOwnerFilter !== 'all' && currentOwnerFilter !== 'p1'
            },
            {
                label: personLabels[1],
                data: p2Data,
                borderColor: chartTheme.crypto,
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHitRadius: 12,
                fill: false,
                tension: 0.35,
                hidden: currentOwnerFilter !== 'all' && currentOwnerFilter !== 'p2'
            },
            {
                label: getCompactOwnerLabel(personLabels[2]),
                data: p3Data,
                borderColor: chartTheme.personThree,
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHitRadius: 12,
                fill: false,
                tension: 0.35,
                hidden: currentOwnerFilter !== 'all' && currentOwnerFilter !== 'p3'
            }
        ];

        if (historyChartInstance) {
            historyChartInstance.data.labels = labels;
            historyChartInstance.data.datasets[0].data = totalData;
            historyChartInstance.data.datasets[1].data = p1Data;
            historyChartInstance.data.datasets[1].label = personLabels[0];
            historyChartInstance.data.datasets[2].data = p2Data;
            historyChartInstance.data.datasets[2].label = personLabels[1];
            historyChartInstance.data.datasets[3].data = p3Data;
            historyChartInstance.data.datasets[3].label = getCompactOwnerLabel(personLabels[2]);
            historyChartInstance.update('none');
            return;
        }

        historyChartInstance = new Chart(historyContext, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        labels: { padding: 18 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`;
                            },
                            footer: function(items) {
                                if (!items.length) return '';
                                const snapshot = snapshots[items[0].dataIndex];
                                const snapshotIndex = (state.snapshots || []).indexOf(snapshot);
                                const previousSnapshot = snapshotIndex > 0 ? state.snapshots[snapshotIndex - 1] : null;
                                if (!previousSnapshot) return '';
                                const movement = getSnapshotMovement(snapshot, previousSnapshot);
                                return `Contributions: ${formatSignedCurrency(movement.contribution)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { maxRotation: 45 },
                        grid: { display: false }
                    },
                    y: {
                        ticks: {
                            callback: (v) => formatCurrency(v)
                        }
                    }
                }
            }
        });
    }

    function render() {
        const snapshots = state.snapshots || [];
        const personLabels = state.settings?.people || ['Person 1', 'Person 2', 'Combined Investments'];

        document.getElementById('historyHeader1').textContent = personLabels[0];
        document.getElementById('historyHeader2').textContent = personLabels[1];
        document.getElementById('historyHeader3').textContent = getCompactOwnerLabel(personLabels[2]);
        document.getElementById('historyValueHeader').textContent = currentOwnerFilter === 'all'
            ? 'Total Value'
            : `${getCompactOwnerLabel(personLabels[Number(currentOwnerFilter.slice(1)) - 1])} Value`;
        document.getElementById('totalSnapshots').textContent = `${snapshots.length} snapshot${snapshots.length !== 1 ? 's' : ''}`;
        document.getElementById('snapshotMetric').textContent = snapshots.length;
        document.getElementById('snapshotMetricNote').textContent = snapshots.length === 1 ? 'One point recorded' : snapshots.length > 1 ? 'Timeline points recorded' : 'Start your timeline';

        if (snapshots.length === 0) {
            document.getElementById('lastSnapshotInfo').textContent = 'No snapshots saved yet';
        } else {
            const lastDate = new Date(snapshots[snapshots.length - 1].timestamp);
            document.getElementById('lastSnapshotInfo').textContent = `Last snapshot: ${lastDate.toLocaleDateString()} ${lastDate.toLocaleTimeString()}`;
        }

        renderHistoryChart(snapshots);

        if (snapshots.length === 0) {
            ['currentValue', 'firstValue', 'estimatedContributions'].forEach(id => {
                document.getElementById(id).textContent = '$0.00';
                document.getElementById(id).className = id === 'currentValue' ? '' : 'stat-value';
            });
            document.getElementById('currentValueNote').textContent = 'No snapshots yet';
            document.getElementById('totalChange').textContent = '$0.00 (0%)';
            document.getElementById('totalChange').className = '';
            document.getElementById('lastChange').textContent = '$0.00 (0%)';
            document.getElementById('lastChange').className = '';
            document.getElementById('lastChangeNote').textContent = 'Waiting for another snapshot';
            document.getElementById('bestDay').textContent = '-';
            document.getElementById('worstDay').textContent = '-';
            document.getElementById('historyTableBody').innerHTML = `
                <tr><td colspan="7" class="history-empty-cell">No snapshots saved yet. Save one to start tracking your portfolio timeline.</td></tr>
            `;
            return;
        }

        const first = snapshots[0];
        const last = snapshots[snapshots.length - 1];
        const firstValue = getSnapshotValue(first);
        const lastValue = getSnapshotValue(last);
        const totalChange = lastValue - firstValue;
        const totalChangePercent = firstValue > 0 ? (totalChange / firstValue) * 100 : 0;
        const movements = snapshots.map((snapshot, index) => getSnapshotMovement(snapshot, snapshots[index - 1]));
        const previousLast = snapshots[snapshots.length - 2];
        const previousLastValue = getSnapshotValue(previousLast);
        const lastChange = previousLast ? lastValue - previousLastValue : 0;
        const lastChangePercent = previousLastValue > 0 ? (lastChange / previousLastValue) * 100 : 0;
        const totalContributions = movements.reduce((sum, movement) => sum + movement.contribution, 0);

        document.getElementById('currentValue').textContent = formatCurrency(lastValue);
        document.getElementById('currentValueNote').textContent = `Recorded ${new Date(last.timestamp).toLocaleDateString()}`;
        setSignedMetric(document.getElementById('totalChange'), totalChange, totalChangePercent);
        setSignedMetric(document.getElementById('lastChange'), lastChange, lastChangePercent);
        document.getElementById('lastChangeNote').textContent = snapshots.length > 1 ? 'From the previous snapshot' : 'Waiting for another snapshot';
        document.getElementById('firstValue').textContent = formatCurrency(firstValue);
        setCurrencyMetric(document.getElementById('estimatedContributions'), totalContributions);

        const comparableSnapshots = snapshots.slice(1).map((snapshot, index) => {
            const previous = snapshots[index];
            const previousValue = getSnapshotValue(previous);
            const change = getSnapshotValue(snapshot) - previousValue;
            return { snapshot, changePercent: previousValue > 0 ? (change / previousValue) * 100 : 0 };
        });
        const bestDay = comparableSnapshots.reduce((best, item) => !best || item.changePercent > best.changePercent ? item : best, null);
        const worstDay = comparableSnapshots.reduce((worst, item) => !worst || item.changePercent < worst.changePercent ? item : worst, null);
        renderPeriodHighlight('bestDay', bestDay);
        renderPeriodHighlight('worstDay', worstDay);

        document.getElementById('historyTableBody').innerHTML = [...snapshots].reverse().map((snapshot, reverseIndex) => {
            const originalIndex = snapshots.length - 1 - reverseIndex;
            const previousSnapshot = snapshots[originalIndex - 1];
            const movement = movements[originalIndex];
            const date = new Date(snapshot.timestamp);
            const snapshotValue = getSnapshotValue(snapshot);
            const previousValue = getSnapshotValue(previousSnapshot);
            const change = previousSnapshot ? snapshotValue - previousValue : 0;
            const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
            const changeClass = change >= 0 ? 'positive' : 'negative';
            const transactionCount = movement.transactions.length;

            return `
                <tr class="history-snapshot-row" onclick="historyApp.toggleSnapshotDetails(${originalIndex})">
                    <td>
                        <button class="history-row-toggle transaction-toggle" data-index="${originalIndex}" aria-label="Toggle snapshot details">
                            <span class="transaction-toggle-icon">▶</span>
                            <span class="history-date-stack"><strong>${date.toLocaleDateString()}</strong><small>${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></span>
                        </button>
                    </td>
                    <td><strong>${formatCurrency(snapshotValue)}</strong><small class="history-cell-note">${snapshot.totalAssets || 0} assets</small></td>
                    <td class="${changeClass}"><strong>${formatSignedCurrency(change)}</strong><small class="history-cell-note">${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%</small></td>
                    <td>${formatCurrency(snapshot.p1Value || 0)}</td>
                    <td>${formatCurrency(snapshot.p2Value || 0)}</td>
                    <td>${formatCurrency(snapshot.p3Value || 0)}</td>
                    <td>
                        <button onclick="event.stopPropagation(); historyApp.deleteSnapshot(${originalIndex})" class="btn-icon history-delete-btn" title="Delete snapshot" aria-label="Delete snapshot">×</button>
                    </td>
                </tr>
                <tr class="transaction-row snapshot-detail-row" data-index="${originalIndex}">
                    <td colspan="7">${renderSnapshotDetails(snapshot, previousSnapshot, movement, personLabels, transactionCount)}</td>
                </tr>
            `;
        }).join('');
    }

    function setSignedMetric(element, value, percent) {
        element.textContent = `${formatSignedCurrency(value)} (${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%)`;
        element.className = value >= 0 ? 'positive' : 'negative';
    }

    function setCurrencyMetric(element, value) {
        element.textContent = formatSignedCurrency(value);
        element.className = `stat-value ${value >= 0 ? 'positive' : 'negative'}`;
    }

    function renderPeriodHighlight(id, period) {
        const element = document.getElementById(id);
        if (!period) {
            element.textContent = '-';
            element.className = 'stat-value';
            return;
        }
        const date = new Date(period.snapshot.timestamp).toLocaleDateString();
        element.textContent = `${date} · ${period.changePercent >= 0 ? '+' : ''}${period.changePercent.toFixed(2)}%`;
        element.className = `stat-value ${period.changePercent >= 0 ? 'positive' : 'negative'}`;
    }

    function renderSnapshotDetails(snapshot, previousSnapshot, movement, personLabels, transactionCount) {
        const typeLabels = { stock: 'Stocks', crypto: 'Crypto', metal: 'Metals', savings: 'Savings' };
        const allocation = Object.entries(typeLabels).map(([type, label]) => `
            <div class="snapshot-breakdown-item"><span>${label}</span><strong>${formatCurrency(getSnapshotTypeValue(snapshot, type))}</strong></div>
        `).join('');
        const movers = getTopMovers(snapshot, previousSnapshot);
        const activity = transactionCount
            ? `<div class="transaction-list">${movement.transactions.map(transaction => renderTransaction(transaction)).join('')}</div>`
            : '<p class="snapshot-empty-note">No holding changes were recorded during this period.</p>';

        const periodChange = previousSnapshot ? getSnapshotValue(snapshot) - getSnapshotValue(previousSnapshot) : 0;
        return `
            <div class="snapshot-detail-panel">
                <div class="snapshot-detail-grid">
                    <section>
                        <span class="snapshot-detail-label">Ownership</span>
                        <div class="snapshot-owner-list">
                            <div><span>${personLabels[0]}</span><strong>${formatCurrency(snapshot.p1Value || 0)}</strong></div>
                            <div><span>${personLabels[1]}</span><strong>${formatCurrency(snapshot.p2Value || 0)}</strong></div>
                            <div><span>${getCompactOwnerLabel(personLabels[2])}</span><strong>${formatCurrency(snapshot.p3Value || 0)}</strong></div>
                        </div>
                    </section>
                    <section>
                        <span class="snapshot-detail-label">Asset allocation</span>
                        <div class="snapshot-breakdown">${allocation}</div>
                    </section>
                    <section>
                        <span class="snapshot-detail-label">Period movement</span>
                        <div class="snapshot-movement-list">
                            <div><span>Portfolio change</span><strong class="${periodChange >= 0 ? 'positive' : 'negative'}">${formatSignedCurrency(periodChange)}</strong></div>
                            <div><span>Contributions</span><strong>${formatSignedCurrency(movement.contribution)}</strong></div>
                        </div>
                    </section>
                </div>
                ${movers ? `<div class="snapshot-movers"><span class="snapshot-detail-label">Largest position movements</span>${movers}</div>` : ''}
                <div class="snapshot-activity">
                    <div class="snapshot-activity-heading"><span class="snapshot-detail-label">Holding activity</span><small>${transactionCount} change${transactionCount !== 1 ? 's' : ''}</small></div>
                    ${activity}
                </div>
            </div>
        `;
    }

    function getTopMovers(snapshot, previousSnapshot) {
        if (!snapshot.assets?.length || !previousSnapshot?.assets?.length) return '';
        const previousValues = new Map(previousSnapshot.assets.map(asset => [`${asset.type}:${asset.symbol}`, asset]));
        const currentValues = new Map(snapshot.assets.map(asset => [`${asset.type}:${asset.symbol}`, asset]));
        const assetKeys = new Set([...previousValues.keys(), ...currentValues.keys()]);
        const movements = [...assetKeys].map(key => {
            const current = currentValues.get(key);
            const previous = previousValues.get(key);
            return {
                name: current?.symbol || previous?.symbol || key,
                change: (current?.totalValue || 0) - (previous?.totalValue || 0)
            };
        }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 3);
        return `<div class="snapshot-mover-list">${movements.map(item => `<span>${item.name} <strong class="${item.change >= 0 ? 'positive' : 'negative'}">${formatSignedCurrency(item.change)}</strong></span>`).join('')}</div>`;
    }

    function renderTransaction(transaction) {
        const time = new Date(transaction.timestamp).toLocaleTimeString();
        const personLabels = state.settings?.people || ['Person 1', 'Person 2', 'Combined Investments'];
        
        // Get current price for value calculation
        const cacheKey = `${transaction.asset.type}:${transaction.asset.symbol}`;
        const currentPrice = state.priceCache?.prices?.[cacheKey] || 0;
        
        let icon = '📝';
        let actionText = '';
        let changeDetails = '';
        
        switch(transaction.action) {
            case 'add':
                icon = '📈';
                actionText = 'Bought';
                const totalQty = transaction.quantities.p1 + transaction.quantities.p2 + (transaction.quantities.p3 || 0);
                const addValue = totalQty * currentPrice;
                
                changeDetails = `Quantity: <span class="transaction-qty positive">${totalQty}</span>`;
                
                if (currentPrice > 0) {
                    changeDetails += ` • Value: <span class="transaction-qty positive">+${formatCurrency(addValue)}</span>`;
                } else {
                    changeDetails += ` • Value: <span style="color: #8b949e;">Price N/A</span>`;
                }
                
                const ownerQuantities = ['p1', 'p2', 'p3']
                    .map((owner, index) => ({ label: personLabels[index], qty: transaction.quantities[owner] || 0 }))
                    .filter(item => item.qty > 0)
                    .map(item => `${item.label}: ${item.qty}`);
                if (ownerQuantities.length) changeDetails += `<br><span style="font-size: 12px;">${ownerQuantities.join(', ')}</span>`;
                break;
                
            case 'increase':
                icon = '📈';
                actionText = 'Increased';
                const totalIncrease = transaction.changes.p1 + transaction.changes.p2 + (transaction.changes.p3 || 0);
                const newQtyIncrease = transaction.quantities.p1 + transaction.quantities.p2 + (transaction.quantities.p3 || 0);
                const increaseValue = Math.abs(totalIncrease) * currentPrice;
                
                changeDetails = `Quantity: <span class="transaction-qty positive">${newQtyIncrease}</span>`;
                
                if (currentPrice > 0) {
                    changeDetails += ` • Value: <span class="transaction-qty positive">+${formatCurrency(increaseValue)}</span>`;
                } else {
                    changeDetails += ` • Value: <span style="color: #8b949e;">Price N/A</span>`;
                }
                
                const increaseDetails = [];
                if (transaction.changes.p1 !== 0) increaseDetails.push(`${personLabels[0]}: ${transaction.changes.p1 > 0 ? '+' : ''}${transaction.changes.p1}`);
                if (transaction.changes.p2 !== 0) increaseDetails.push(`${personLabels[1]}: ${transaction.changes.p2 > 0 ? '+' : ''}${transaction.changes.p2}`);
                if ((transaction.changes.p3 || 0) !== 0) increaseDetails.push(`${personLabels[2]}: ${transaction.changes.p3 > 0 ? '+' : ''}${transaction.changes.p3}`);
                if (increaseDetails.length > 0) {
                    changeDetails += `<br><span style="font-size: 12px;">${increaseDetails.join(', ')}</span>`;
                }
                break;
                
            case 'decrease':
                icon = '📉';
                actionText = 'Sold';
                const totalDecrease = transaction.changes.p1 + transaction.changes.p2 + (transaction.changes.p3 || 0);
                const newQtyDecrease = transaction.quantities.p1 + transaction.quantities.p2 + (transaction.quantities.p3 || 0);
                const decreaseValue = Math.abs(totalDecrease) * currentPrice;
                
                changeDetails = `Quantity: <span class="transaction-qty negative">${newQtyDecrease}</span>`;
                
                if (currentPrice > 0) {
                    changeDetails += ` • Value: <span class="transaction-qty negative">-${formatCurrency(decreaseValue)}</span>`;
                } else {
                    changeDetails += ` • Value: <span style="color: #8b949e;">Price N/A</span>`;
                }
                
                const decreaseDetails = [];
                if (transaction.changes.p1 !== 0) decreaseDetails.push(`${personLabels[0]}: ${transaction.changes.p1 > 0 ? '+' : ''}${transaction.changes.p1}`);
                if (transaction.changes.p2 !== 0) decreaseDetails.push(`${personLabels[1]}: ${transaction.changes.p2 > 0 ? '+' : ''}${transaction.changes.p2}`);
                if ((transaction.changes.p3 || 0) !== 0) decreaseDetails.push(`${personLabels[2]}: ${transaction.changes.p3 > 0 ? '+' : ''}${transaction.changes.p3}`);
                if (decreaseDetails.length > 0) {
                    changeDetails += `<br><span style="font-size: 12px;">${decreaseDetails.join(', ')}</span>`;
                }
                break;
                
            case 'remove':
                icon = '🗑️';
                actionText = 'Removed All';
                const removedQty = transaction.quantities.p1 + transaction.quantities.p2 + (transaction.quantities.p3 || 0);
                const removeValue = removedQty * currentPrice;
                
                changeDetails = `Quantity: <span class="transaction-qty negative">0</span>`;
                
                if (currentPrice > 0) {
                    changeDetails += ` • Value: <span class="transaction-qty negative">-${formatCurrency(removeValue)}</span>`;
                } else {
                    changeDetails += ` • Value: <span style="color: #8b949e;">Price N/A</span>`;
                }
                break;
        }
                
        
        return `
            <div class="transaction-item">
                <div class="transaction-icon">${icon}</div>
                <div class="transaction-details">
                    <div class="transaction-asset">
                        <span class="transaction-badge ${transaction.action}">${actionText}</span>
                        ${transaction.asset.name}
                        <span class="transaction-symbol">${transaction.asset.symbol}</span>
                    </div>
                    <div class="transaction-change">${changeDetails}</div>
                </div>
                <div class="transaction-time">${time}</div>
            </div>
        `;
    }

    function toggleSnapshotDetails(index) {
        const transactionRow = document.querySelector(`.transaction-row[data-index="${index}"]`);
        const toggle = document.querySelector(`.transaction-toggle[data-index="${index}"]`);
        
        if (transactionRow && toggle) {
            const isVisible = transactionRow.classList.contains('visible');
            
            if (isVisible) {
                transactionRow.classList.remove('visible');
                toggle.classList.remove('active');
            } else {
                transactionRow.classList.add('visible');
                toggle.classList.add('active');
            }
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    function formatSignedCurrency(value) {
        const numericValue = Number(value) || 0;
        return `${numericValue >= 0 ? '+' : '-'}${formatCurrency(Math.abs(numericValue))}`;
    }

    // Expose functions
    window.historyApp = {
        deleteSnapshot: deleteSnapshot,
        toggleSnapshotDetails: toggleSnapshotDetails
    };

})();
