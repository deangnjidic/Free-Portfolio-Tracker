// News Page Script
(function() {
    'use strict';

    let state = null;
    let currentCategory = 'general';
    let newsCache = {
        general: [],
        portfolio: [],
        lastUpdated: { general: 0, portfolio: 0 }
    };

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        loadState();
        setupEventListeners();
        await fetchNews();
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

        document.getElementById('refreshNewsBtn').addEventListener('click', () => {
            // Clear cache and fetch fresh news
            newsCache.lastUpdated[currentCategory] = 0;
            newsCache[currentCategory] = [];
            fetchNews();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentCategory = e.target.dataset.category;
                fetchNews();
            });
        });
    }

    async function fetchNews() {
        const status = document.getElementById('newsStatus');
        status.textContent = 'Loading news...';
        status.className = 'news-status loading';

        // Cache for 10 minutes
        const cacheDuration = 600000;
        const now = Date.now();
        
        if (newsCache.lastUpdated[currentCategory] && 
            (now - newsCache.lastUpdated[currentCategory]) < cacheDuration &&
            newsCache[currentCategory] && newsCache[currentCategory].length > 0) {
            console.log('Using cached news:', newsCache[currentCategory].length, 'articles');
            renderNews(newsCache[currentCategory]);
            status.textContent = '';
            return;
        }

        try {
            console.log('Fetching fresh news for category:', currentCategory);
            let articles = [];
            
            if (currentCategory === 'general') {
                articles = await fetchGeneralNews();
            } else {
                articles = await fetchPortfolioNews();
            }
            
            console.log('Fetched articles:', articles.length);
            
            newsCache[currentCategory] = articles;
            newsCache.lastUpdated[currentCategory] = now;
            
            renderNews(articles);
            status.textContent = '';
        } catch (err) {
            console.error('News fetch error:', err);
            status.textContent = 'Failed to load news. Check your Finnhub API key and console for details.';
            status.className = 'news-status error';
        }
    }

    async function fetchGeneralNews() {
        const apiKey = window.APP_CONFIG.FINNHUB_KEY;
        console.log('Fetching general news with API key:', apiKey ? 'Present' : 'Missing');
        const url = `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`;
        
        const response = await fetch(url);
        console.log('General news response status:', response.status);
        if (!response.ok) throw new Error('Failed to fetch news: ' + response.status);
        
        const articles = await response.json();
        console.log('General news articles received:', articles.length);
        
        // Sort by datetime, most recent first
        articles.sort((a, b) => b.datetime - a.datetime);
        
        return articles.slice(0, 20);
    }

    async function fetchPortfolioNews() {
        if (!state || !state.assets || state.assets.length === 0) {
            return [{
                headline: 'No assets in portfolio',
                summary: 'Add stocks or crypto to your portfolio to see relevant news.',
                url: '#',
                image: '',
                datetime: Date.now() / 1000,
                source: 'Portfolio Tracker'
            }];
        }

        const apiKey = window.APP_CONFIG.FINNHUB_KEY;
        
        // Get unique stock symbols from portfolio
        const stockSymbols = [...new Set(
            state.assets
                .filter(a => a.type === 'stock')
                .map(a => a.symbol.toUpperCase())
        )];

        if (stockSymbols.length === 0) {
            return [{
                headline: 'No stocks in portfolio',
                summary: 'Add stocks to your portfolio to see company-specific news.',
                url: '#',
                image: '',
                datetime: Date.now() / 1000,
                source: 'Portfolio Tracker'
            }];
        }

        // Fetch news for each stock symbol (limit to first 5 symbols to avoid rate limiting)
        const symbolsToFetch = stockSymbols.slice(0, 5);
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const from = weekAgo.toISOString().split('T')[0];
        const to = today.toISOString().split('T')[0];
        
        const promises = symbolsToFetch.map(symbol => 
            fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey}`)
                .then(r => r.ok ? r.json() : [])
                .catch(() => [])
        );

        const results = await Promise.all(promises);
        const allArticles = results.flat();
        
        // Prioritize Yahoo Finance and other preferred sources
        const sourcePreference = ['Yahoo Finance', 'yahoo', 'Seeking Alpha', 'Benzinga', 'MarketWatch', 'CNBC'];
        
        allArticles.sort((a, b) => {
            // First, sort by source preference
            const aSourceIndex = sourcePreference.findIndex(pref => 
                (a.source || '').toLowerCase().includes(pref.toLowerCase())
            );
            const bSourceIndex = sourcePreference.findIndex(pref => 
                (b.source || '').toLowerCase().includes(pref.toLowerCase())
            );
            
            const aScore = aSourceIndex === -1 ? 999 : aSourceIndex;
            const bScore = bSourceIndex === -1 ? 999 : bSourceIndex;
            
                if (aScore !== bScore) {
                    return aScore - bScore;
                }
                // Sort by datetime, most recent first
                return b.datetime - a.datetime;
            });
            
            return allArticles.slice(0, 20);
        }
    
        function renderNews(articles) {
            const container = document.getElementById('newsContainer');
            
            if (!articles || articles.length === 0) {
                container.innerHTML = '<p class="no-news">No news available.</p>';
                return;
            }
    
            container.innerHTML = articles.map(article => {
                const date = new Date(article.datetime * 1000);
                const imageUrl = article.image || '';
                
                return `
                    <article class="news-card">
                    <div class="news-image" style="background-image: url('${imageUrl}')">
                        ${!article.image ? '<div class="no-image-text">📰</div>' : ''}
                    </div>
                    <div class="news-content">
                        <div class="news-meta">
                            <span class="news-source">${article.source || 'Unknown'}</span>
                            <span class="news-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
                        </div>
                        <h3 class="news-headline">
                            <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                                ${article.headline}
                            </a>
                        </h3>
                        <p class="news-summary">${article.summary || 'No summary available.'}</p>
                        ${article.related ? `<div class="news-tags">${article.related.split(',').slice(0, 3).join(', ')}</div>` : ''}
                    </div>
                </article>
            `;
        }).join('');
    }

})();
