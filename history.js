// Portfolio History Page
(function() {
    'use strict';

    let state = null;

    document.addEventListener('DOMContentLoaded', init);

    let historyChartInstance = null;

    function init() {
        loadState();
        initializeAPIKeys();
        setupEventListeners();
        render();
        updateLastUpdated();
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
                        people: ['Person 1', 'Person 2'],
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
                        people: ['Person 1', 'Person 2'],
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
                    people: ['Person 1', 'Person 2'],
                    apiKeys: {
                        FINNHUB_KEY: '',
                        METALS_DEV_KEY: ''
                    }
                }
            };
        }
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

    function setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', refreshPrices);
        document.getElementById('saveSnapshotBtn').addEventListener('click', saveSnapshot);
        document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
    }

    // Refresh prices
    async function refreshPrices() {
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
                const percent = ((fetchedCount / totalAssets) * 100).toFixed(0);
                statusEl.textContent = `Fetching prices... ${fetchedCount}/${totalAssets} (${percent}%)`;
            };

            // Fetch prices with progress updates
            if (stocks.length > 0) {
                await fetchStockPrices(stocks, updateProgress);
            }
            
            if (cryptos.length > 0) {
                await fetchCryptoPrices(cryptos, updateProgress);
            }
            
            if (metals.length > 0) {
                await fetchMetalPrices(metals, state.settings.baseCurrency, updateProgress);
            }

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

    // Fetch functions (simplified versions from app.js)
    async function fetchStockPrices(symbols, onProgress) {
        const apiKey = window.APP_CONFIG?.FINNHUB_KEY;
        if (!apiKey) {
            console.warn('No Finnhub API key configured');
            return;
        }

        for (const symbol of symbols) {
            try {
                const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
                if (response.status === 429) {
                    console.warn('Rate limit hit, waiting...');
                    await delay(5000);
                    continue;
                }
                
                const data = await response.json();
                if (data.c) {
                    const cacheKey = `stock:${symbol}`;
                    state.priceCache.prices[cacheKey] = data.c;
                    
                    if (data.pc && data.pc > 0) {
                        const change = ((data.c - data.pc) / data.pc) * 100;
                        state.priceCache.changePercents[cacheKey] = change;
                    }
                }
                
                if (onProgress) onProgress();
                await delay(1100);
            } catch (error) {
                console.error(`Error fetching ${symbol}:`, error);
                if (onProgress) onProgress();
            }
        }
    }

    async function fetchCryptoPrices(symbols, onProgress) {
        const apiKey = window.APP_CONFIG?.FINNHUB_KEY;
        if (!apiKey) {
            console.warn('No Finnhub API key configured');
            return;
        }

        for (const symbol of symbols) {
            try {
                const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
                if (response.status === 429) {
                    console.warn('Rate limit hit, waiting...');
                    await delay(5000);
                    continue;
                }
                
                const data = await response.json();
                
                if (data.c && data.c > 0) {
                    const cacheKey = `crypto:${symbol}`;
                    state.priceCache.prices[cacheKey] = data.c;
                    
                    if (data.pc && data.pc > 0) {
                        const change = ((data.c - data.pc) / data.pc) * 100;
                        state.priceCache.changePercents[cacheKey] = change;
                    }
                }
                
                if (onProgress) onProgress();
                await delay(1100);
            } catch (error) {
                console.error(`Error fetching ${symbol}:`, error);
                if (onProgress) onProgress();
            }
        }
    }

    async function fetchMetalPrices(metals, currency, onProgress) {
        const apiKey = window.APP_CONFIG?.METALS_DEV_KEY;
        if (!apiKey) {
            console.warn('No metals.dev API key configured');
            return;
        }

        for (const metal of metals) {
            try {
                const response = await fetch(`https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=${currency}&unit=toz`);
                const data = await response.json();
                
                if (data.metals && data.metals[metal]) {
                    const metalData = data.metals[metal];
                    const cacheKey = `metal:${metal}`;
                    state.priceCache.prices[cacheKey] = metalData.price;
                    
                    if (metalData.change_pct) {
                        state.priceCache.changePercents[cacheKey] = metalData.change_pct;
                    }
                }
                
                if (onProgress) onProgress();
                await delay(1100);
            } catch (error) {
                console.error(`Error fetching ${metal}:`, error);
                if (onProgress) onProgress();
            }
        }
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

        // Calculate current Combined Total
        let totalValue = 0;
        let assetsUp = 0;
        let assetsDown = 0;
        let assetsUnchanged = 0;
        let assetsMissingPrice = 0;

        state.assets.forEach((asset) => {
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const currentPrice = state.priceCache.prices[cacheKey] || 0;
            const changePercent = state.priceCache.changePercents?.[cacheKey] || 0;
            
            // Quantities are stored in asset.holdings.p1.qty and asset.holdings.p2.qty
            const deanQty = asset.holdings?.p1?.qty || 0;
            const samQty = asset.holdings?.p2?.qty || 0;
            const totalQty = deanQty + samQty;
            
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
            if (!confirm(`Warning: ${assetsMissingPrice} asset(s) don't have price data and will be excluded.\n\nCombined Total: $${totalValue.toFixed(2)}\n\nContinue saving snapshot?`)) {
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
        const byType = { stock: 0, crypto: 0, metal: 0, savings: 0 };
        state.assets.forEach((asset) => {
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const currentPrice = state.priceCache.prices[cacheKey] || 0;
            if (currentPrice > 0) {
                const av = currentPrice * ((asset.holdings?.p1?.qty || 0) + (asset.holdings?.p2?.qty || 0));
                p1Value += currentPrice * (asset.holdings?.p1?.qty || 0);
                p2Value += currentPrice * (asset.holdings?.p2?.qty || 0);
                if (byType[asset.type] !== undefined) byType[asset.type] += av;
            }
        });

        // Create snapshot
        const snapshot = {
            timestamp: Date.now(),
            date: new Date().toISOString(),
            totalValue: totalValue,
            p1Value: p1Value,
            p2Value: p2Value,
            byType: byType,
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

        // Show confirmation
        const message = previousSnapshot 
            ? `Snapshot saved!\nCombined Total: $${totalValue.toFixed(2)}\nChange from last snapshot: ${changeFromPrevious >= 0 ? '+' : ''}$${changeFromPrevious.toFixed(2)} (${changePercentFromPrevious >= 0 ? '+' : ''}${changePercentFromPrevious.toFixed(2)}%)`
            : `First snapshot saved!\nCombined Total: $${totalValue.toFixed(2)}`;
        
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

    function renderHistoryChart(snapshots) {
        const canvas = document.getElementById('historyChart');
        const emptyEl = document.getElementById('historyChartEmpty');

        if (!snapshots || snapshots.length < 2) {
            canvas.style.display = 'none';
            emptyEl.style.display = 'flex';
            emptyEl.textContent = snapshots.length === 1
                ? 'Save at least 2 snapshots to see the chart.'
                : 'No snapshots yet — save a snapshot to see your chart.';
            if (historyChartInstance) {
                historyChartInstance.destroy();
                historyChartInstance = null;
            }
            return;
        }

        canvas.style.display = 'block';
        emptyEl.style.display = 'none';

        const personLabels = state.settings?.people || ['Person 1', 'Person 2'];
        const labels = snapshots.map(s => {
            const d = new Date(s.timestamp);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
        });

        const totalData  = snapshots.map(s => parseFloat(s.totalValue.toFixed(2)));
        const p1Data     = snapshots.map(s => parseFloat((s.p1Value || 0).toFixed(2)));
        const p2Data     = snapshots.map(s => parseFloat((s.p2Value || 0).toFixed(2)));

        const datasets = [
            {
                label: 'Combined Total',
                data: totalData,
                borderColor: '#58a6ff',
                backgroundColor: 'rgba(88,166,255,0.08)',
                borderWidth: 2.5,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.3
            },
            {
                label: personLabels[0],
                data: p1Data,
                borderColor: '#3fb950',
                backgroundColor: 'rgba(63,185,80,0.06)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: false,
                tension: 0.3
            },
            {
                label: personLabels[1],
                data: p2Data,
                borderColor: '#d29922',
                backgroundColor: 'rgba(210,153,34,0.06)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: false,
                tension: 0.3
            }
        ];

        if (historyChartInstance) {
            historyChartInstance.data.labels = labels;
            historyChartInstance.data.datasets[0].data = totalData;
            historyChartInstance.data.datasets[1].data = p1Data;
            historyChartInstance.data.datasets[1].label = personLabels[0];
            historyChartInstance.data.datasets[2].data = p2Data;
            historyChartInstance.data.datasets[2].label = personLabels[1];
            historyChartInstance.update();
            return;
        }

        historyChartInstance = new Chart(canvas, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        labels: { color: '#8b949e', font: { size: 13 } }
                    },
                    tooltip: {
                        backgroundColor: '#1c2128',
                        borderColor: '#30363d',
                        borderWidth: 1,
                        titleColor: '#e6edf3',
                        bodyColor: '#8b949e',
                        callbacks: {
                            label: function(ctx) {
                                return ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#8b949e', maxRotation: 45, font: { size: 11 } },
                        grid: { color: 'rgba(48,54,61,0.6)' }
                    },
                    y: {
                        ticks: {
                            color: '#8b949e',
                            font: { size: 11 },
                            callback: (v) => formatCurrency(v)
                        },
                        grid: { color: 'rgba(48,54,61,0.6)' }
                    }
                }
            }
        });
    }

    function render() {
        const snapshots = state.snapshots || [];
        
        // Update snapshot count
        document.getElementById('totalSnapshots').textContent = 
            `${snapshots.length} snapshot${snapshots.length !== 1 ? 's' : ''}`;

        // Update last snapshot info
        if (snapshots.length === 0) {
            document.getElementById('lastSnapshotInfo').textContent = 'No snapshots saved yet';
        } else {
            const lastSnapshot = snapshots[snapshots.length - 1];
            const date = new Date(lastSnapshot.timestamp);
            document.getElementById('lastSnapshotInfo').textContent = 
                `Last snapshot: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        }

        // Always render the chart (handles empty state internally)
        renderHistoryChart(snapshots);

        if (snapshots.length === 0) {
            // Reset stats
            document.getElementById('currentValue').textContent = '$0.00';
            document.getElementById('firstValue').textContent = '$0.00';
            document.getElementById('totalChange').textContent = '$0.00 (0%)';
            document.getElementById('bestDay').textContent = '-';
            document.getElementById('worstDay').textContent = '-';
            
            // Empty table
            document.getElementById('historyTableBody').innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #8b949e;">
                        No snapshots saved yet. Go to the main portfolio page and click "Save Snapshot" to start tracking your portfolio history.
                    </td>
                </tr>
            `;
            return;
        }

        // Calculate stats
        const first = snapshots[0];
        const last = snapshots[snapshots.length - 1];
        const totalChange = last.totalValue - first.totalValue;
        const totalChangePercent = first.totalValue > 0 ? ((totalChange / first.totalValue) * 100) : 0;

        // Find best and worst days
        let bestDay = null;
        let worstDay = null;
        let maxChange = -Infinity;
        let minChange = Infinity;

        snapshots.forEach((snapshot, index) => {
            if (index === 0) return; // Skip first snapshot (no previous to compare)
            
            const change = snapshot.changePercentFromPrevious;
            if (change > maxChange) {
                maxChange = change;
                bestDay = snapshot;
            }
            if (change < minChange) {
                minChange = change;
                worstDay = snapshot;
            }
        });

        // Update stats
        const currentValueEl = document.getElementById('currentValue');
        const changeFromPrev = last.changeFromPrevious || 0;
        const changePercentFromPrev = last.changePercentFromPrevious || 0;
        const changeClass = changeFromPrev >= 0 ? 'positive' : 'negative';
        const changeSign = changeFromPrev >= 0 ? '+' : '';
        
        // Show current value with change from previous snapshot
        currentValueEl.innerHTML = `${formatCurrency(last.totalValue)} <span class="${changeClass}" style="font-size: 0.85em;">(${changeSign}${formatCurrency(changeFromPrev)} / ${changeSign}${changePercentFromPrev.toFixed(2)}%)</span>`;
        
        document.getElementById('firstValue').textContent = formatCurrency(first.totalValue);
        
        const totalChangeEl = document.getElementById('totalChange');
        totalChangeEl.textContent = `${totalChange >= 0 ? '+' : ''}${formatCurrency(totalChange)} (${totalChangePercent >= 0 ? '+' : ''}${totalChangePercent.toFixed(2)}%)`;
        totalChangeEl.className = 'stat-value ' + (totalChange >= 0 ? 'positive' : 'negative');

        if (bestDay) {
            const bestDayDate = new Date(bestDay.timestamp).toLocaleDateString();
            document.getElementById('bestDay').textContent = 
                `${bestDayDate}: +${bestDay.changePercentFromPrevious.toFixed(2)}%`;
            document.getElementById('bestDay').className = 'stat-value positive';
        }

        if (worstDay) {
            const worstDayDate = new Date(worstDay.timestamp).toLocaleDateString();
            document.getElementById('worstDay').textContent = 
                `${worstDayDate}: ${worstDay.changePercentFromPrevious.toFixed(2)}%`;
            document.getElementById('worstDay').className = 'stat-value negative';
        }

        // Render table (reverse order - newest first)
        const tbody = document.getElementById('historyTableBody');
        const reversedSnapshots = [...snapshots].reverse();
        
        tbody.innerHTML = reversedSnapshots.map((snapshot, reverseIndex) => {
            const originalIndex = snapshots.length - 1 - reverseIndex;
            const date = new Date(snapshot.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString();
            
            const changeClass = snapshot.changeFromPrevious >= 0 ? 'positive' : 'negative';
            const changeSign = snapshot.changeFromPrevious >= 0 ? '+' : '';
            const changePercentSign = snapshot.changePercentFromPrevious >= 0 ? '+' : '';
            
            // Get transactions for this day
            const snapshotDate = new Date(snapshot.timestamp);
            const dayStart = new Date(snapshotDate.getFullYear(), snapshotDate.getMonth(), snapshotDate.getDate()).getTime();
            const dayEnd = dayStart + 24 * 60 * 60 * 1000;
            
            const dayTransactions = (state.transactions || []).filter(t => {
                return t.timestamp >= dayStart && t.timestamp < dayEnd;
            });
            
            const transactionCount = dayTransactions.length;
            const hasTransactions = transactionCount > 0;
            
            const mainRow = `
                <tr>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <span style="font-weight: 500;">${dateStr}</span>
                            <span style="font-size: 12px; color: #8b949e;">${timeStr}</span>
                            ${hasTransactions ? `
                                <span class="transaction-toggle" onclick="historyApp.toggleTransactions(${originalIndex})" data-index="${originalIndex}">
                                    <span class="transaction-toggle-icon">▶</span>
                                    <span>${transactionCount} change${transactionCount !== 1 ? 's' : ''}</span>
                                </span>
                            ` : ''}
                        </div>
                    </td>
                    <td style="font-weight: 600;">${formatCurrency(snapshot.totalValue)}</td>
                    <td class="${changeClass}">${changeSign}${formatCurrency(snapshot.changeFromPrevious)}</td>
                    <td class="${changeClass}">${changePercentSign}${snapshot.changePercentFromPrevious.toFixed(2)}%</td>
                    <td style="color: #3fb950;">${snapshot.assetsUp}</td>
                    <td style="color: #f85149;">${snapshot.assetsDown}</td>
                    <td>${snapshot.totalAssets}</td>
                    <td>
                        <button onclick="historyApp.deleteSnapshot(${originalIndex})" class="btn-icon" title="Delete">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
            
            const transactionRow = hasTransactions ? `
                <tr class="transaction-row" data-index="${originalIndex}">
                    <td colspan="8">
                        <div class="transaction-content">
                            <div class="transaction-list">
                                ${dayTransactions.map(t => renderTransaction(t)).join('')}
                            </div>
                        </div>
                    </td>
                </tr>
            ` : '';
            
            return mainRow + transactionRow;
        }).join('');
    }

    function renderTransaction(transaction) {
        const time = new Date(transaction.timestamp).toLocaleTimeString();
        const personLabels = state.settings?.people || ['Person 1', 'Person 2'];
        
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
                const totalQty = transaction.quantities.p1 + transaction.quantities.p2;
                const addValue = totalQty * currentPrice;
                
                changeDetails = `Quantity: <span class="transaction-qty positive">${totalQty}</span>`;
                
                if (currentPrice > 0) {
                    changeDetails += ` • Value: <span class="transaction-qty positive">+${formatCurrency(addValue)}</span>`;
                } else {
                    changeDetails += ` • Value: <span style="color: #8b949e;">Price N/A</span>`;
                }
                
                if (transaction.quantities.p1 > 0 && transaction.quantities.p2 > 0) {
                    changeDetails += `<br><span style="font-size: 12px;">${personLabels[0]}: ${transaction.quantities.p1}, ${personLabels[1]}: ${transaction.quantities.p2}</span>`;
                } else if (transaction.quantities.p1 > 0) {
                    changeDetails += `<br><span style="font-size: 12px;">${personLabels[0]}: ${transaction.quantities.p1}</span>`;
                } else {
                    changeDetails += `<br><span style="font-size: 12px;">${personLabels[1]}: ${transaction.quantities.p2}</span>`;
                }
                break;
                
            case 'increase':
                icon = '📈';
                actionText = 'Increased';
                const totalIncrease = transaction.changes.p1 + transaction.changes.p2;
                const newQtyIncrease = transaction.quantities.p1 + transaction.quantities.p2;
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
                if (increaseDetails.length > 0) {
                    changeDetails += `<br><span style="font-size: 12px;">${increaseDetails.join(', ')}</span>`;
                }
                break;
                
            case 'decrease':
                icon = '📉';
                actionText = 'Sold';
                const totalDecrease = transaction.changes.p1 + transaction.changes.p2;
                const newQtyDecrease = transaction.quantities.p1 + transaction.quantities.p2;
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
                if (decreaseDetails.length > 0) {
                    changeDetails += `<br><span style="font-size: 12px;">${decreaseDetails.join(', ')}</span>`;
                }
                break;
                
            case 'remove':
                icon = '🗑️';
                actionText = 'Removed All';
                const removedQty = transaction.quantities.p1 + transaction.quantities.p2;
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

    function toggleTransactions(index) {
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

    // Expose functions
    window.historyApp = {
        deleteSnapshot: deleteSnapshot,
        toggleTransactions: toggleTransactions
    };

})();
