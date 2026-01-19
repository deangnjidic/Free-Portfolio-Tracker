// Compare Page Script
(function() {
    'use strict';

    let state = null;
    let selectedAssets = [];

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadState();
        renderAssetCheckboxes();
        setupEventListeners();
    }

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

    function setupEventListeners() {
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        document.getElementById('compareNow').addEventListener('click', compareAssets);
    }

    function renderAssetCheckboxes() {
        const container = document.getElementById('assetCheckboxes');
        
        if (!state || !state.assets || state.assets.length === 0) {
            container.innerHTML = '<p>No assets available. Add assets first.</p>';
            return;
        }

        container.innerHTML = state.assets.map(asset => {
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const price = state.priceCache.prices[cacheKey] || 0;
            return `
                <label class="asset-checkbox-item">
                    <input type="checkbox" value="${asset.id}" class="asset-checkbox">
                    <span class="asset-info">
                        <strong>${asset.name}</strong>
                        <small>${asset.type.toUpperCase()} - ${asset.symbol} - $${price.toFixed(2)}</small>
                    </span>
                </label>
            `;
        }).join('');

        // Add event listeners
        document.querySelectorAll('.asset-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                updateSelectedAssets();
            });
        });
    }

    function updateSelectedAssets() {
        const checkboxes = document.querySelectorAll('.asset-checkbox:checked');
        selectedAssets = Array.from(checkboxes).map(cb => cb.value);
        
        const compareBtn = document.getElementById('compareNow');
        compareBtn.disabled = selectedAssets.length < 2 || selectedAssets.length > 3;
        compareBtn.textContent = selectedAssets.length < 2 
            ? 'Select at least 2 assets' 
            : selectedAssets.length > 3 
                ? 'Max 3 assets' 
                : `Compare ${selectedAssets.length} Assets`;
    }

    function compareAssets() {
        if (selectedAssets.length < 2 || selectedAssets.length > 3) return;

        const assets = selectedAssets.map(id => 
            state.assets.find(a => a.id === id)
        ).filter(Boolean);

        if (assets.length !== selectedAssets.length) {
            alert('Error finding selected assets');
            return;
        }

        renderComparison(assets);
    }

    function renderComparison(assets) {
        const resultsDiv = document.getElementById('comparisonResults');
        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth' });

        // Render asset cards
        renderAssetCards(assets);

        // Render metrics table
        renderMetricsTable(assets);

        // Render price history chart
        renderPriceHistoryChart(assets);
    }

    function renderAssetCards(assets) {
        const grid = document.querySelector('.compare-grid');
        grid.innerHTML = assets.map(asset => {
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const currentPrice = state.priceCache.prices[cacheKey] || 0;
            const previousPrice = state.priceCache.previousPrices[cacheKey];
            
            let changeText = 'No data';
            let changeClass = '';
            if (previousPrice && previousPrice !== currentPrice) {
                const change = currentPrice - previousPrice;
                const changePercent = ((change / previousPrice) * 100).toFixed(2);
                changeText = `${change >= 0 ? '↑' : '↓'} ${changePercent}%`;
                changeClass = change >= 0 ? 'price-up' : 'price-down';
            }

            const p1Holdings = asset.holdings?.p1?.qty || 0;
            const p2Holdings = asset.holdings?.p2?.qty || 0;
            const totalValue = (p1Holdings + p2Holdings) * currentPrice;

            return `
                <div class="summary-card">
                    <h3>${asset.name}</h3>
                    <div class="summary-value">$${currentPrice.toFixed(2)}</div>
                    <div class="summary-label ${changeClass}">${changeText}</div>
                    <div class="compare-details">
                        <div>Symbol: <strong>${asset.symbol}</strong></div>
                        <div>Type: <strong>${asset.type.toUpperCase()}</strong></div>
                        <div>Holdings: <strong>${(p1Holdings + p2Holdings).toFixed(4)}</strong></div>
                        <div>Total Value: <strong>$${totalValue.toFixed(2)}</strong></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderMetricsTable(assets) {
        // Update headers
        assets.forEach((asset, i) => {
            const header = document.getElementById(`asset${i+1}Header`);
            if (header) {
                header.textContent = asset.name;
                header.style.display = '';
            }
        });

        // Hide third column if only 2 assets
        if (assets.length === 2) {
            const header = document.getElementById('asset3Header');
            if (header) header.style.display = 'none';
        }

        const tbody = document.getElementById('metricsBody');
        const metrics = [
            { label: 'Current Price', getValue: getPrice },
            { label: 'Price Change %', getValue: getPriceChangePercent },
            { label: 'Total Holdings', getValue: getTotalHoldings },
            { label: 'Total Value', getValue: getTotalValue },
            { label: 'Dean Holdings', getValue: getDeanHoldings },
            { label: 'Sam Holdings', getValue: getSamHoldings },
            { label: '% of Portfolio', getValue: getPortfolioPercent }
        ];

        tbody.innerHTML = metrics.map(metric => {
            const values = assets.map(asset => metric.getValue(asset));
            return `
                <tr>
                    <td><strong>${metric.label}</strong></td>
                    ${values.map((val, i) => {
                        const style = assets.length === 2 && i === 2 ? 'display: none;' : '';
                        return `<td style="${style}">${val}</td>`;
                    }).join('')}
                </tr>
            `;
        }).join('');
    }

    function getPrice(asset) {
        const cacheKey = `${asset.type}:${asset.symbol}`;
        return `$${(state.priceCache.prices[cacheKey] || 0).toFixed(2)}`;
    }

    function getPriceChangePercent(asset) {
        const cacheKey = `${asset.type}:${asset.symbol}`;
        const current = state.priceCache.prices[cacheKey];
        const previous = state.priceCache.previousPrices[cacheKey];
        
        if (!current || !previous || current === previous) return 'N/A';
        
        const changePercent = ((current - previous) / previous) * 100;
        return `${changePercent >= 0 ? '↑' : '↓'} ${Math.abs(changePercent).toFixed(2)}%`;
    }

    function getTotalHoldings(asset) {
        const p1 = asset.holdings?.p1?.qty || 0;
        const p2 = asset.holdings?.p2?.qty || 0;
        return (p1 + p2).toFixed(4);
    }

    function getTotalValue(asset) {
        const cacheKey = `${asset.type}:${asset.symbol}`;
        const price = state.priceCache.prices[cacheKey] || 0;
        const p1 = asset.holdings?.p1?.qty || 0;
        const p2 = asset.holdings?.p2?.qty || 0;
        return `$${((p1 + p2) * price).toFixed(2)}`;
    }

    function getDeanHoldings(asset) {
        return (asset.holdings?.p1?.qty || 0).toFixed(4);
    }

    function getSamHoldings(asset) {
        return (asset.holdings?.p2?.qty || 0).toFixed(4);
    }

    function getPortfolioPercent(asset) {
        const cacheKey = `${asset.type}:${asset.symbol}`;
        const price = state.priceCache.prices[cacheKey] || 0;
        const p1 = asset.holdings?.p1?.qty || 0;
        const p2 = asset.holdings?.p2?.qty || 0;
        const assetValue = (p1 + p2) * price;
        
        let totalValue = 0;
        state.assets.forEach(a => {
            const key = `${a.type}:${a.symbol}`;
            const p = state.priceCache.prices[key] || 0;
            const q1 = a.holdings?.p1?.qty || 0;
            const q2 = a.holdings?.p2?.qty || 0;
            totalValue += (q1 + q2) * p;
        });
        
        if (totalValue === 0) return '0%';
        return ((assetValue / totalValue) * 100).toFixed(2) + '%';
    }

    function renderPriceHistoryChart(assets) {
        const ctx = document.getElementById('priceHistoryChart');
        
        // Get snapshots
        const snapshots = state.snapshots || [];
        
        if (snapshots.length < 2) {
            ctx.parentElement.innerHTML = '<p>Not enough historical data. Save more snapshots to see trends.</p>';
            return;
        }

        // For simplicity, show total value per snapshot (since we don't store per-asset history)
        const labels = snapshots.map(s => new Date(s.timestamp).toLocaleDateString());
        
        // Calculate asset values at each snapshot time point (approximation)
        // Note: This is a limitation - we don't have historical prices per asset
        // We can only show current distribution
        
        const datasets = assets.map((asset, i) => {
            const colors = ['#58a6ff', '#22c55e', '#ef4444'];
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const currentPrice = state.priceCache.prices[cacheKey] || 0;
            const p1 = asset.holdings?.p1?.qty || 0;
            const p2 = asset.holdings?.p2?.qty || 0;
            const currentValue = (p1 + p2) * currentPrice;
            
            // Since we don't have historical prices, show flat line at current value
            const data = snapshots.map(() => currentValue);
            
            return {
                label: asset.name,
                data: data,
                borderColor: colors[i],
                backgroundColor: colors[i] + '20',
                tension: 0.1
            };
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#e6edf3' }
                    },
                    title: {
                        display: true,
                        text: 'Asset Value Over Time (Current Values)',
                        color: '#e6edf3'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#8b949e' },
                        grid: { color: '#30363d' }
                    },
                    x: {
                        ticks: { color: '#8b949e' },
                        grid: { color: '#30363d' }
                    }
                }
            }
        });
    }

})();
