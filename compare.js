// Compare Page Script
(function() {
    'use strict';

    let state = null;
    let selectedAssets = [];
    let priceHistoryChartInstance = null;
    let currentOwnerFilter = localStorage.getItem('portfolio_owner_filter') || 'all';
    if (!['all', 'p1', 'p2', 'p3'].includes(currentOwnerFilter)) currentOwnerFilter = 'all';
    const chartTheme = window.PortfolioChartTheme.colors;

    function getCompactOwnerLabel(name) {
        return name === 'Combined Investments' ? 'Joint' : name;
    }

    function getAssetQuantity(asset) {
        if (currentOwnerFilter !== 'all') return asset.holdings?.[currentOwnerFilter]?.qty || 0;
        return (asset.holdings?.p1?.qty || 0) + (asset.holdings?.p2?.qty || 0) + (asset.holdings?.p3?.qty || 0);
    }

    function getActiveOwnerLabel() {
        if (currentOwnerFilter === 'all') return 'Total';
        return getCompactOwnerLabel(state.settings.people[Number(currentOwnerFilter.slice(1)) - 1]);
    }

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadState();
        window.PortfolioChartTheme.apply();
        renderAssetCheckboxes();
        setupEventListeners();
        
        // Track page view
        if (typeof gtag === 'function') {
            gtag('event', 'page_view', {
                page_title: 'Compare Assets',
                page_location: window.location.href
            });
        }
    }

    function loadState() {
        const stored = localStorage.getItem('portfolio_v1');
        if (stored) {
            try {
                state = JSON.parse(stored);
                const people = state.settings?.people || [];
                state.settings = state.settings || {};
                state.settings.people = [people[0] || 'Person 1', people[1] || 'Person 2', people[2] || 'Combined Investments'];
                (state.assets || []).forEach(asset => {
                    asset.holdings = asset.holdings || {};
                    asset.holdings.p3 = asset.holdings.p3 || { qty: 0, avgCost: 0, dividend: 0 };
                });
            } catch (e) {
                console.error('Failed to parse stored data:', e);
            }
        }
        if (!state) {
            state = {
                settings: { people: ['Person 1', 'Person 2', 'Combined Investments'] },
                assets: [],
                priceCache: { prices: {}, previousPrices: {}, changePercents: {} }
            };
        }
        state.priceCache = state.priceCache || { prices: {}, previousPrices: {}, changePercents: {} };
    }

    function setupEventListeners() {
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = 'app.html';
        });

        document.getElementById('compareNow').addEventListener('click', compareAssets);
        const ownerFilter = document.getElementById('ownerFilter');
        ownerFilter.options[1].textContent = state.settings.people[0];
        ownerFilter.options[2].textContent = state.settings.people[1];
        ownerFilter.options[3].textContent = getCompactOwnerLabel(state.settings.people[2]);
        ownerFilter.value = currentOwnerFilter;
        ownerFilter.addEventListener('change', event => {
            currentOwnerFilter = event.target.value;
            localStorage.setItem('portfolio_owner_filter', currentOwnerFilter);
            selectedAssets = [];
            document.getElementById('comparisonResults').style.display = 'none';
            renderAssetCheckboxes();
            updateSelectedAssets();
        });
    }

    function renderAssetCheckboxes() {
        const container = document.getElementById('assetCheckboxes');
        
        if (!state || !state.assets || state.assets.length === 0) {
            container.innerHTML = '<div class="compare-empty-state"><strong>No holdings to compare yet</strong><span>Add holdings to your portfolio, then return here to compare them.</span><a href="app.html">Add holdings →</a></div>';
            return;
        }

        const availableAssets = state.assets.filter(asset => getAssetQuantity(asset) > 0);
        if (!availableAssets.length) {
            container.innerHTML = '<div class="compare-empty-state"><strong>No holdings for this owner</strong><span>Choose another owner from the filter above or add a holding first.</span></div>';
            return;
        }
        container.innerHTML = availableAssets.map(asset => {
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const price = state.priceCache.prices[cacheKey] || 0;
            return `
                <label class="asset-checkbox-item">
                    <input type="checkbox" value="${asset.id}" class="asset-checkbox">
                    <span class="asset-symbol-badge">${asset.symbol.slice(0, 4).toUpperCase()}</span>
                    <span class="asset-info">
                        <strong>${asset.name}</strong>
                        <small>${asset.type.toUpperCase()} · ${asset.symbol} · $${price.toFixed(2)}</small>
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
        const selectionCount = document.getElementById('selectionCount');
        if (selectionCount) selectionCount.textContent = `${selectedAssets.length} selected`;
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
        
        // Track comparison
        if (typeof gtag === 'function') {
            gtag('event', 'compare_assets', {
                asset_count: assets.length,
                asset_types: assets.map(a => a.type).join(',')
            });
        }
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

            const totalHoldings = getAssetQuantity(asset);
            const totalValue = totalHoldings * currentPrice;

            return `
                <div class="summary-card">
                    <h3>${asset.name}</h3>
                    <div class="summary-value">$${currentPrice.toFixed(2)}</div>
                    <div class="summary-label ${changeClass}">${changeText}</div>
                    <div class="compare-details">
                        <div>Symbol: <strong>${asset.symbol}</strong></div>
                        <div>Type: <strong>${asset.type.toUpperCase()}</strong></div>
                        <div>Holdings: <strong>${totalHoldings.toFixed(4)}</strong></div>
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
            { label: `${getActiveOwnerLabel()} Holdings`, getValue: getTotalHoldings },
            { label: `${getActiveOwnerLabel()} Value`, getValue: getTotalValue },
            ...(currentOwnerFilter === 'all' ? [
                { label: `${state.settings.people[0]} Holdings`, getValue: getOwner1Holdings },
                { label: `${state.settings.people[1]} Holdings`, getValue: getOwner2Holdings },
                { label: `${getCompactOwnerLabel(state.settings.people[2])} Holdings`, getValue: getJointHoldings }
            ] : []),
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
        return getAssetQuantity(asset).toFixed(4);
    }

    function getTotalValue(asset) {
        const cacheKey = `${asset.type}:${asset.symbol}`;
        const price = state.priceCache.prices[cacheKey] || 0;
        return `$${(getAssetQuantity(asset) * price).toFixed(2)}`;
    }

    function getOwner1Holdings(asset) {
        return (asset.holdings?.p1?.qty || 0).toFixed(4);
    }

    function getOwner2Holdings(asset) {
        return (asset.holdings?.p2?.qty || 0).toFixed(4);
    }

    function getJointHoldings(asset) {
        return (asset.holdings?.p3?.qty || 0).toFixed(4);
    }

    function getPortfolioPercent(asset) {
        const cacheKey = `${asset.type}:${asset.symbol}`;
        const price = state.priceCache.prices[cacheKey] || 0;
        const assetValue = getAssetQuantity(asset) * price;
        
        let totalValue = 0;
        state.assets.forEach(a => {
            const key = `${a.type}:${a.symbol}`;
            const p = state.priceCache.prices[key] || 0;
            totalValue += getAssetQuantity(a) * p;
        });
        
        if (totalValue === 0) return '0%';
        return ((assetValue / totalValue) * 100).toFixed(2) + '%';
    }

    function renderPriceHistoryChart(assets) {
        const canvas = document.getElementById('priceHistoryChart');
        const chartShell = canvas.parentElement;
        
        // Get snapshots
        const snapshots = state.snapshots || [];
        
        if (snapshots.length < 2) {
            if (priceHistoryChartInstance) {
                priceHistoryChartInstance.destroy();
                priceHistoryChartInstance = null;
            }
            canvas.style.display = 'none';
            if (!chartShell.querySelector('.compare-chart-empty')) {
                chartShell.insertAdjacentHTML('beforeend', '<p class="chart-empty-state compare-chart-empty">Save at least two snapshots to compare value trends.</p>');
            }
            return;
        }

        chartShell.querySelector('.compare-chart-empty')?.remove();
        canvas.style.display = 'block';

        // For simplicity, show total value per snapshot (since we don't store per-asset history)
        const labels = snapshots.map(s => new Date(s.timestamp).toLocaleDateString());
        
        // Calculate asset values at each snapshot time point (approximation)
        // Note: This is a limitation - we don't have historical prices per asset
        // We can only show current distribution
        
        const datasets = assets.map((asset, i) => {
            const colors = [chartTheme.stock, chartTheme.savings, chartTheme.personOne];
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const currentPrice = state.priceCache.prices[cacheKey] || 0;
            const currentValue = getAssetQuantity(asset) * currentPrice;
            
            // Since we don't have historical prices, show flat line at current value
            const data = snapshots.map(() => currentValue);
            
            return {
                label: asset.name,
                data: data,
                borderColor: colors[i],
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHitRadius: 12,
                tension: 0.35
            };
        });

        if (priceHistoryChartInstance) {
            priceHistoryChartInstance.destroy();
        }

        priceHistoryChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        labels: { padding: 18 }
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = new Intl.NumberFormat(undefined, {
                                    style: 'currency',
                                    currency: state.settings?.baseCurrency || 'USD',
                                    maximumFractionDigits: 2
                                }).format(context.parsed.y);
                                return ` ${context.dataset.label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => window.PortfolioChartTheme.formatCompactCurrency(
                                value,
                                state.settings?.baseCurrency || 'USD'
                            )
                        }
                    },
                    x: {
                        ticks: { maxRotation: 45 },
                        grid: { display: false }
                    }
                }
            }
        });
    }

})();
