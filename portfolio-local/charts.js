// Portfolio Charts - Vanilla JS with Chart.js
(function() {
    'use strict';

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
            dean: '#ef4444',
            sam: '#06b6d4'
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
                        label: 'Dean',
                        data: [
                            totals.p1ByType.stock,
                            totals.p1ByType.crypto,
                            totals.p1ByType.metal,
                            totals.p1ByType.savings
                        ],
                        backgroundColor: colors.dean,
                        borderColor: colors.dean,
                        borderWidth: 1
                    },
                    {
                        label: 'Sam',
                        data: [
                            totals.p2ByType.stock,
                            totals.p2ByType.crypto,
                            totals.p2ByType.metal,
                            totals.p2ByType.savings
                        ],
                        backgroundColor: colors.sam,
                        borderColor: colors.sam,
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

        // 4. Historical Trend Line Chart
        const historicalCtx = document.getElementById('historicalChart').getContext('2d');
        
        const sortedSnapshots = [...state.snapshots].sort((a, b) => a.timestamp - b.timestamp);
        const dates = sortedSnapshots.map(s => new Date(s.date).toLocaleDateString());
        const totalValues = sortedSnapshots.map(s => s.totalValue);
        const deanValues = sortedSnapshots.map(s => s.deanTotal);
        const samValues = sortedSnapshots.map(s => s.samTotal);

        new Chart(historicalCtx, {
            type: 'line',
            data: {
                labels: dates.length > 0 ? dates : ['No data'],
                datasets: [
                    {
                        label: 'Total Portfolio',
                        data: totalValues.length > 0 ? totalValues : [0],
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Dean',
                        data: deanValues.length > 0 ? deanValues : [0],
                        borderColor: colors.dean,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Sam',
                        data: samValues.length > 0 ? samValues : [0],
                        borderColor: colors.sam,
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
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
    }
})();
