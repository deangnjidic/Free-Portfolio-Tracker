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

    // Filter state
    let activeDailyFilter = 'all';
    let activeCumulativeFilter = 'all';
    let activeCompositionFilter = 'all';

    // Chart instances for re-renderable charts
    let dailyChartInstance = null;
    let cumulativeChartInstance = null;
    let compositionChartInstance = null;

    // Shared snapshot range filter
    function filterSnapshotsByRange(snapshots, filter) {
        if (!snapshots || snapshots.length === 0) return snapshots;
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        switch (filter) {
            case '1d': return snapshots.filter(s => s.timestamp >= now - day);
            case '7d': return snapshots.filter(s => s.timestamp >= now - 7 * day);
            case '30d': return snapshots.filter(s => s.timestamp >= now - 30 * day);
            case 'ytd': {
                const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
                return snapshots.filter(s => s.timestamp >= startOfYear);
            }
            default: return snapshots;
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        loadState();
        createCharts();
        
        // Track page view
        if (typeof gtag === 'function') {
            gtag('event', 'page_view', {
                page_title: 'Charts',
                page_location: window.location.href
            });
        }

        // Filter button listeners
        document.querySelectorAll('.chart-filter-btn[data-chart]').forEach(btn => {
            btn.addEventListener('click', function() {
                const chart = this.dataset.chart;
                const filter = this.dataset.filter;
                // Update active state for this chart's buttons
                document.querySelectorAll(`.chart-filter-btn[data-chart="${chart}"]`).forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Track filter usage
                if (typeof gtag === 'function') {
                    gtag('event', 'chart_filter', {
                        chart_name: chart,
                        filter_value: filter
                    });
                }
                
                if (chart === 'daily') {
                    activeDailyFilter = filter;
                    createDailyGainLossChart();
                } else if (chart === 'cumulative') {
                    activeCumulativeFilter = filter;
                    createCumulativeReturnChart();
                } else if (chart === 'composition') {
                    activeCompositionFilter = filter;
                    createCompositionChart();
                }
            });
        });
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

        // Update person comparison title
        const comparisonTitle = document.getElementById('personComparisonTitle');
        if (comparisonTitle) {
            comparisonTitle.textContent = `${state.settings.people[0]} vs ${state.settings.people[1]} by Asset Type`;
        }

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
                        label: state.settings.people[0],
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
                        label: state.settings.people[1],
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

        // New charts (snapshot-based + scatter)
        createDailyGainLossChart();
        createSavingsInvestedChart(totals);
        createCompositionChart();
        createCumulativeReturnChart();
        createScatterChart();
    }

    // ── 5. Daily Gain / Loss Bar Chart ──────────────────────────────────────
    function createDailyGainLossChart() {
        const allSnapshots = state.snapshots || [];
        const canvas = document.getElementById('dailyGainLossChart');
        const emptyEl = document.getElementById('dailyGainLossEmpty');
        const filterLabel = { '1d': 'last 24 hours', '7d': 'last 7 days', '30d': 'last 30 days', 'ytd': 'year to date' }[activeDailyFilter];

        if (dailyChartInstance) { dailyChartInstance.destroy(); dailyChartInstance = null; }

        const filtered = filterSnapshotsByRange(allSnapshots, activeDailyFilter);
        // Need at least 2 snapshots in range to show bar chart
        if (filtered.length < 2) {
            canvas.style.display = 'none';
            emptyEl.style.display = 'flex';
            if (activeDailyFilter !== 'all' && allSnapshots.length >= 2) {
                emptyEl.textContent = `No snapshots found for the ${filterLabel}.`;
            } else {
                emptyEl.textContent = 'Save at least 2 snapshots to see daily gain/loss.';
            }
            return;
        }

        // Use snapshots from index 1 onward (each has changeFromPrevious)
        const sliced = filtered.slice(1);
        const labels = sliced.map(s =>
            new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        );
        const values = sliced.map(s => parseFloat((s.changeFromPrevious || 0).toFixed(2)));
        const bgColors = values.map(v => v >= 0 ? 'rgba(63,185,80,0.75)' : 'rgba(248,81,73,0.75)');
        const borderColors = values.map(v => v >= 0 ? '#3fb950' : '#f85149');

        emptyEl.style.display = 'none';
        canvas.style.display = 'block';

        dailyChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Daily Change ($)',
                    data: values,
                    backgroundColor: bgColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1c2128',
                        borderColor: '#30363d',
                        borderWidth: 1,
                        titleColor: '#e6edf3',
                        bodyColor: '#8b949e',
                        callbacks: {
                            label: ctx => {
                                const v = ctx.parsed.y;
                                return ` ${v >= 0 ? '+' : ''}$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: '#8b949e', font: { size: 11 }, maxRotation: 45 }, grid: { color: 'rgba(48,54,61,0.6)' } },
                    y: {
                        ticks: {
                            color: '#8b949e', font: { size: 11 },
                            callback: v => (v >= 0 ? '+' : '') + '$' + v.toLocaleString()
                        },
                        grid: { color: 'rgba(48,54,61,0.6)' }
                    }
                }
            }
        });
    }

    // ── 6. Savings vs Invested Pie ───────────────────────────────────────────
    function createSavingsInvestedChart(totals) {
        const canvas = document.getElementById('savingsInvestedChart');
        const savings = totals.byType.savings || 0;
        const invested = (totals.byType.stock || 0) + (totals.byType.crypto || 0) + (totals.byType.metal || 0);

        new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Market-Exposed (Stocks + Crypto + Metals)', 'Savings'],
                datasets: [{
                    data: [invested, savings],
                    backgroundColor: ['#3b82f6', '#10b981'],
                    borderColor: '#161b22',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#8b949e', font: { size: 12 }, padding: 14 } },
                    tooltip: {
                        backgroundColor: '#1c2128',
                        borderColor: '#30363d',
                        borderWidth: 1,
                        titleColor: '#e6edf3',
                        bodyColor: '#8b949e',
                        callbacks: {
                            label: ctx => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                                return ` $${ctx.parsed.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ── 7. Portfolio Composition Stacked Bar ─────────────────────────────────
    function createCompositionChart() {
        const allSnapshots = state.snapshots || [];
        const canvas = document.getElementById('compositionChart');
        const emptyEl = document.getElementById('compositionEmpty');
        const filterLabel = { '7d': 'last 7 days', '30d': 'last 30 days', 'ytd': 'year to date' }[activeCompositionFilter];

        if (compositionChartInstance) { compositionChartInstance.destroy(); compositionChartInstance = null; }

        const snapshots = filterSnapshotsByRange(allSnapshots, activeCompositionFilter);

        if (snapshots.length < 2) {
            canvas.style.display = 'none';
            emptyEl.style.display = 'flex';
            if (activeCompositionFilter !== 'all' && allSnapshots.length >= 2) {
                emptyEl.textContent = `No snapshots found for the ${filterLabel}.`;
            } else {
                emptyEl.textContent = 'Save at least 2 snapshots to see composition over time.';
            }
            return;
        }

        emptyEl.style.display = 'none';
        canvas.style.display = 'block';

        const labels = snapshots.map(s =>
            new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
        );

        compositionChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Stocks',  data: snapshots.map(s => s.byType?.stock   || 0), backgroundColor: '#3b82f6', borderRadius: 2 },
                    { label: 'Crypto',  data: snapshots.map(s => s.byType?.crypto  || 0), backgroundColor: '#f59e0b', borderRadius: 2 },
                    { label: 'Metals',  data: snapshots.map(s => s.byType?.metal   || 0), backgroundColor: '#8b5cf6', borderRadius: 2 },
                    { label: 'Savings', data: snapshots.map(s => s.byType?.savings || 0), backgroundColor: '#10b981', borderRadius: 2 }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index' },
                plugins: {
                    legend: { labels: { color: '#8b949e', font: { size: 12 } } },
                    tooltip: {
                        backgroundColor: '#1c2128', borderColor: '#30363d', borderWidth: 1,
                        titleColor: '#e6edf3', bodyColor: '#8b949e',
                        callbacks: { label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2 })}` }
                    }
                },
                scales: {
                    x: { stacked: true, ticks: { color: '#8b949e', font: { size: 11 }, maxRotation: 45 }, grid: { color: 'rgba(48,54,61,0.6)' } },
                    y: { stacked: true, ticks: { color: '#8b949e', font: { size: 11 }, callback: v => '$' + v.toLocaleString() }, grid: { color: 'rgba(48,54,61,0.6)' } }
                }
            }
        });
    }

    // ── 8. Cumulative Return Line ─────────────────────────────────────────────
    function createCumulativeReturnChart() {
        const allSnapshots = state.snapshots || [];
        const canvas = document.getElementById('cumulativeReturnChart');
        const emptyEl = document.getElementById('cumulativeReturnEmpty');
        const filterLabel = { '1d': 'last 24 hours', '7d': 'last 7 days', '30d': 'last 30 days', 'ytd': 'year to date' }[activeCumulativeFilter];

        if (cumulativeChartInstance) { cumulativeChartInstance.destroy(); cumulativeChartInstance = null; }

        const filtered = filterSnapshotsByRange(allSnapshots, activeCumulativeFilter);
        if (filtered.length < 2) {
            canvas.style.display = 'none';
            emptyEl.style.display = 'flex';
            if (activeCumulativeFilter !== 'all' && allSnapshots.length >= 2) {
                emptyEl.textContent = `No snapshots found for the ${filterLabel}.`;
            } else {
                emptyEl.textContent = 'Save at least 2 snapshots to see cumulative return.';
            }
            return;
        }

        emptyEl.style.display = 'none';
        canvas.style.display = 'block';

        // Base is always the first snapshot in the filtered window
        const base = filtered[0].totalValue;
        const labels = filtered.map(s =>
            new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
        );
        const data = filtered.map(s =>
            base > 0 ? parseFloat((((s.totalValue - base) / base) * 100).toFixed(2)) : 0
        );
        const borderColor = data[data.length - 1] >= 0 ? '#3fb950' : '#f85149';
        const bgColor = data[data.length - 1] >= 0 ? 'rgba(63,185,80,0.08)' : 'rgba(248,81,73,0.08)';

        cumulativeChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Cumulative Return',
                    data,
                    borderColor,
                    backgroundColor: bgColor,
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1c2128', borderColor: '#30363d', borderWidth: 1,
                        titleColor: '#e6edf3', bodyColor: '#8b949e',
                        callbacks: { label: ctx => ` ${ctx.parsed.y >= 0 ? '+' : ''}${ctx.parsed.y.toFixed(2)}%` }
                    }
                },
                scales: {
                    x: { ticks: { color: '#8b949e', font: { size: 11 }, maxRotation: 45 }, grid: { color: 'rgba(48,54,61,0.6)' } },
                    y: {
                        ticks: { color: '#8b949e', font: { size: 11 }, callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) + '%' },
                        grid: { color: 'rgba(48,54,61,0.6)' }
                    }
                }
            }
        });
    }

    // ── 9. Asset Performance Scatter ─────────────────────────────────────────
    function createScatterChart() {
        const canvas = document.getElementById('scatterChart');
        const emptyEl = document.getElementById('scatterEmpty');

        const points = [];
        state.assets.forEach(asset => {
            if (asset.type === 'savings') return;
            const cacheKey = `${asset.type}:${asset.symbol}`;
            const price = state.priceCache.prices?.[cacheKey] || 0;
            const changePct = state.priceCache.changePercents?.[cacheKey];
            if (price > 0 && changePct !== undefined && changePct !== null) {
                const qty = (asset.holdings?.p1?.qty || 0) + (asset.holdings?.p2?.qty || 0);
                const value = qty * price;
                if (value > 0) {
                    points.push({ x: parseFloat(changePct.toFixed(2)), y: parseFloat(value.toFixed(2)), label: asset.symbol });
                }
            }
        });

        if (points.length === 0) return;

        emptyEl.style.display = 'none';
        canvas.style.display = 'block';

        new Chart(canvas.getContext('2d'), {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Assets',
                    data: points,
                    backgroundColor: points.map(p => p.x >= 0 ? 'rgba(63,185,80,0.75)' : 'rgba(248,81,73,0.75)'),
                    borderColor: points.map(p => p.x >= 0 ? '#3fb950' : '#f85149'),
                    borderWidth: 1,
                    pointRadius: 7,
                    pointHoverRadius: 10
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1c2128', borderColor: '#30363d', borderWidth: 1,
                        titleColor: '#e6edf3', bodyColor: '#8b949e',
                        callbacks: {
                            label: ctx => {
                                const p = ctx.raw;
                                return [
                                    ` ${p.label}`,
                                    ` Change: ${p.x >= 0 ? '+' : ''}${p.x.toFixed(2)}%`,
                                    ` Value: $${p.y.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: "Today's Change (%)", color: '#8b949e' },
                        ticks: { color: '#8b949e', font: { size: 11 }, callback: v => v + '%' },
                        grid: { color: 'rgba(48,54,61,0.6)' }
                    },
                    y: {
                        title: { display: true, text: 'Total Value ($)', color: '#8b949e' },
                        ticks: { color: '#8b949e', font: { size: 11 }, callback: v => '$' + v.toLocaleString() },
                        grid: { color: 'rgba(48,54,61,0.6)' }
                    }
                }
            }
        });
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

        // Top 5
        const top10 = performers.slice(0, 5);
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

        // Bottom 5
        const bottom10 = performers.slice(-5).reverse();
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
