// Portfolio Charts - Vanilla JS with Chart.js
(function() {
    'use strict';

    let state = {
        settings: {
            baseCurrency: "USD",
            people: ["John", "Maria"]
        },
        assets: [],
        priceCache: {
            lastUpdated: 0,
            prices: {},
            previousPrices: {},
            changePercents: {}
        }
    };

    // Load state from localStorage
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

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        loadState();
        createCharts();
    });

    // Calculate totals
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
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const price = state.priceCache.prices[cacheKey] || 0;

            const p1Value = asset.holdings.p1.qty * price;
            const p2Value = asset.holdings.p2.qty * price;
            
            totals.p1.value += p1Value;
            totals.p2.value += p2Value;
            
            if (totals.byType[asset.type] !== undefined) {
                totals.byType[asset.type] += p1Value + p2Value;
                totals.p1ByType[asset.type] += p1Value;
                totals.p2ByType[asset.type] += p2Value;
            }
        });

        totals.combined.value = totals.p1.value + totals.p2.value;
        return totals;
    }

    // Create all charts
    function createCharts() {
        const totals = calculateTotals();

        // Chart colors
        const colors = {
            stock: '#3b82f6',
            crypto: '#f59e0b',
            metal: '#8b5cf6',
            savings: '#10b981',
            john: '#ef4444',
            maria: '#06b6d4'
        };

        // 1. Asset Allocation Pie Chart
        const assetCtx = document.getElementById('assetAllocationChart').getContext('2d');
        new Chart(assetCtx, {
            type: 'doughnut',
            data: {
                labels: ['Stocks', 'Crypto', 'Metals', 'Savings'],
                datasets: [{
                    data: [
                        totals.byType.stock,
                        totals.byType.crypto,
                        totals.byType.metal,
                        totals.byType.savings
                    ],
                    backgroundColor: [
                        colors.stock,
                        colors.crypto,
                        colors.metal,
                        colors.savings
                    ],
                    borderColor: '#161b22',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#e6edf3', padding: 15 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return ` ${context.label}: $${value.toLocaleString()} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });

        // 2. Person Comparison Bar Chart
        const comparisonCtx = document.getElementById('personComparisonChart').getContext('2d');
        new Chart(comparisonCtx, {
            type: 'bar',
            data: {
                labels: ['Stocks', 'Crypto', 'Metals', 'Savings'],
                datasets: [
                    {
                        label: 'John',
                        data: [
                            totals.p1ByType.stock,
                            totals.p1ByType.crypto,
                            totals.p1ByType.metal,
                            totals.p1ByType.savings
                        ],
                        backgroundColor: colors.john,
                        borderColor: colors.john,
                        borderWidth: 1
                    },
                    {
                        label: 'Maria',
                        data: [
                            totals.p2ByType.stock,
                            totals.p2ByType.crypto,
                            totals.p2ByType.metal,
                            totals.p2ByType.savings
                        ],
                        backgroundColor: colors.maria,
                        borderColor: colors.maria,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: { 
                        ticks: { color: '#e6edf3' },
                        grid: { color: '#30363d' }
                    },
                    y: { 
                        ticks: { 
                            color: '#e6edf3',
                            callback: (value) => '$' + value.toLocaleString()
                        },
                        grid: { color: '#30363d' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#e6edf3' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
                        }
                    }
                }
            }
        });

        // 3. Portfolio Breakdown Horizontal Bar
        const breakdownCtx = document.getElementById('breakdownChart').getContext('2d');
        new Chart(breakdownCtx, {
            type: 'bar',
            data: {
                labels: ['Stocks', 'Crypto', 'Metals', 'Savings'],
                datasets: [{
                    label: 'Total Value',
                    data: [
                        totals.byType.stock,
                        totals.byType.crypto,
                        totals.byType.metal,
                        totals.byType.savings
                    ],
                    backgroundColor: [
                        colors.stock,
                        colors.crypto,
                        colors.metal,
                        colors.savings
                    ],
                    borderColor: '#161b22',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: { 
                        ticks: { 
                            color: '#e6edf3',
                            callback: (value) => '$' + value.toLocaleString()
                        },
                        grid: { color: '#30363d' }
                    },
                    y: { 
                        ticks: { color: '#e6edf3' },
                        grid: { color: '#30363d' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `$${context.parsed.x.toLocaleString()}`
                        }
                    }
                }
            }
        });

        // 4. Top and Bottom Performers
        displayTopBottomPerformers();
    }

    // Display top and bottom performers
    function displayTopBottomPerformers() {
        const performers = [];

        state.assets.forEach(asset => {
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const currentPrice = state.priceCache.prices[cacheKey];
            const changePercent = state.priceCache.changePercents ? state.priceCache.changePercents[cacheKey] : 0;

            if (currentPrice && changePercent !== undefined && changePercent !== null) {
                // Calculate total quantity and value
                const p1Qty = asset.holdings?.p1?.qty || 0;
                const p2Qty = asset.holdings?.p2?.qty || 0;
                const totalQty = p1Qty + p2Qty;
                const totalValue = totalQty * currentPrice;

                performers.push({
                    name: asset.name,
                    symbol: asset.symbol,
                    type: asset.type,
                    currentPrice: currentPrice,
                    changePercent: changePercent,
                    quantity: totalQty,
                    value: totalValue
                });
            }
        });

        // Sort by change percentage
        performers.sort((a, b) => b.changePercent - a.changePercent);

        // Top 10
        const top10 = performers.slice(0, 10);
        const topContainer = document.getElementById('topPerformers');
        topContainer.innerHTML = top10.length > 0 ? top10.map(p => `
            <div class="performer-item">
                <div class="performer-info">
                    <span class="performer-name">${p.name}</span>
                    <span class="performer-symbol">${p.symbol.toUpperCase()}</span>
                    <span class="performer-type">${p.type}</span>
                </div>
                <div class="performer-holdings">
                    <span class="performer-quantity">Qty: ${p.quantity.toFixed(4)}</span>
                    <span class="performer-value">Value: $${p.value.toFixed(2)}</span>
                </div>
                <div class="performer-stats">
                    <span class="performer-price">$${p.currentPrice.toFixed(2)}</span>
                    <span class="performer-change positive">+${p.changePercent.toFixed(2)}%</span>
                </div>
            </div>
        `).join('') : '<p class="no-data">No price data available</p>';

        // Bottom 10
        const bottom10 = performers.slice(-10).reverse();
        const bottomContainer = document.getElementById('bottomPerformers');
        bottomContainer.innerHTML = bottom10.length > 0 ? bottom10.map(p => `
            <div class="performer-item">
                <div class="performer-info">
                    <span class="performer-name">${p.name}</span>
                    <span class="performer-symbol">${p.symbol.toUpperCase()}</span>
                    <span class="performer-type">${p.type}</span>
                </div>
                <div class="performer-holdings">
                    <span class="performer-quantity">Qty: ${p.quantity.toFixed(4)}</span>
                    <span class="performer-value">Value: $${p.value.toFixed(2)}</span>
                </div>
                <div class="performer-stats">
                    <span class="performer-price">$${p.currentPrice.toFixed(2)}</span>
                    <span class="performer-change negative">${p.changePercent.toFixed(2)}%</span>
                </div>
            </div>
        `).join('') : '<p class="no-data">No price data available</p>';
    }
})();
