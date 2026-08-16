// Shared Chart.js presentation for Charts, History, and Compare pages.
(function(global) {
    'use strict';

    const colors = Object.freeze({
        text: '#f4f4f5',
        muted: '#a1a1aa',
        subtle: '#71717a',
        grid: 'rgba(113, 113, 122, 0.16)',
        border: '#3f3f46',
        surface: '#18181b',
        stock: '#60a5fa',
        crypto: '#fbbf24',
        metal: '#a78bfa',
        savings: '#34d399',
        personOne: '#fb7185',
        personTwo: '#22d3ee',
        positive: '#34d399',
        negative: '#fb7185'
    });

    const doughnutCenterPlugin = {
        id: 'doughnutCenter',
        afterDatasetsDraw(chart, args, options) {
            if (!options?.display || chart.config.type !== 'doughnut') return;
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            const x = (chartArea.left + chartArea.right) / 2;
            const y = (chartArea.top + chartArea.bottom) / 2;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = colors.text;
            ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.fillText(options.text || '', x, y - 7);
            ctx.fillStyle = colors.subtle;
            ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.fillText(options.subtext || '', x, y + 12);
            ctx.restore();
        }
    };

    let applied = false;

    function apply() {
        if (applied || !global.Chart) return;
        applied = true;
        Chart.register(doughnutCenterPlugin);
        Chart.defaults.color = colors.muted;
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        Chart.defaults.font.size = 11;
        Chart.defaults.animation = false;
        Chart.defaults.resizeDelay = 120;
        Chart.defaults.devicePixelRatio = Math.min(global.devicePixelRatio || 1, 1.5);
        Chart.defaults.layout.padding = { top: 2, right: 4, bottom: 0, left: 2 };
        Chart.defaults.plugins.legend.position = 'bottom';
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
        Chart.defaults.plugins.legend.labels.boxWidth = 7;
        Chart.defaults.plugins.legend.labels.boxHeight = 7;
        Chart.defaults.plugins.legend.labels.padding = 18;
        Chart.defaults.plugins.legend.labels.color = colors.muted;
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(24, 24, 27, 0.97)';
        Chart.defaults.plugins.tooltip.borderColor = colors.border;
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.titleColor = colors.text;
        Chart.defaults.plugins.tooltip.bodyColor = colors.muted;
        Chart.defaults.plugins.tooltip.boxPadding = 4;
        Chart.defaults.scale.border.display = false;
        Chart.defaults.scale.grid.color = colors.grid;
        Chart.defaults.scale.grid.drawTicks = false;
        Chart.defaults.scale.ticks.color = colors.subtle;
        Chart.defaults.scale.ticks.padding = 8;
        Chart.defaults.elements.bar.borderRadius = 6;
        Chart.defaults.elements.bar.borderSkipped = false;
        Chart.defaults.elements.line.borderWidth = 2;
        Chart.defaults.elements.line.tension = 0.35;
        Chart.defaults.elements.point.radius = 0;
        Chart.defaults.elements.point.hoverRadius = 4;
        Chart.defaults.elements.point.hitRadius = 10;
        Chart.defaults.datasets.bar.maxBarThickness = 42;
        Chart.defaults.datasets.bar.categoryPercentage = 0.72;
        Chart.defaults.datasets.bar.barPercentage = 0.78;

        // Hover and resize interpolation can make responsive canvases visibly shake.
        if (Chart.defaults.transitions?.active?.animation) {
            Chart.defaults.transitions.active.animation.duration = 0;
        }
        if (Chart.defaults.transitions?.resize?.animation) {
            Chart.defaults.transitions.resize.animation.duration = 0;
        }
    }

    function formatCompactCurrency(value, currency) {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency || 'USD',
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(value);
    }

    global.PortfolioChartTheme = Object.freeze({ apply, colors, formatCompactCurrency });
})(window);
