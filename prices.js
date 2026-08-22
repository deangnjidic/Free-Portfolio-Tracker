// Shared price-fetching service (Finnhub for stocks/crypto, metals.dev for metals)
//
// Usage model: this app is meant to be refreshed about once a day to take a
// snapshot, not polled continuously. That changes the optimization target for
// each provider:
//
//   - Finnhub free tier resets every 60s (60 calls/min). Since we only run
//     once a day, there's no long-term budget to protect within a single
//     run - the goal is just to get the whole portfolio's quotes as fast as
//     possible while staying under that per-minute ceiling. We do that with
//     a small concurrent pool instead of one request every 1.1s.
//
//   - metals.dev's free tier is ~100 calls PER MONTH (not per minute). That
//     budget has to last across many daily refreshes, so the win there is
//     minimizing call COUNT, not speed: their /v1/latest endpoint returns
//     every tracked metal in a single response, so one call covers gold,
//     silver, platinum, etc. together instead of one call each.
(function () {
    'use strict';

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Runs `items` through `worker` with at most `concurrency` in flight at once.
    async function runPool(items, concurrency, worker) {
        let index = 0;
        async function next() {
            while (index < items.length) {
                const i = index++;
                await worker(items[i]);
            }
        }
        const workers = Array.from({ length: Math.min(concurrency, items.length) }, next);
        await Promise.all(workers);
    }

    // Fetch one Finnhub quote, retrying with exponential backoff + jitter on 429.
    async function fetchQuoteWithRetry(symbol, apiKey) {
        let attempt = 0;
        while (attempt < 4) {
            let response;
            try {
                response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`);
            } catch (error) {
                console.error(`Error fetching ${symbol}:`, error);
                return null;
            }

            if (response.status === 429) {
                attempt++;
                const backoff = 1000 * Math.pow(2, attempt - 1) + Math.random() * 300;
                console.warn(`Rate limit hit for ${symbol}, retrying in ${Math.round(backoff)}ms...`);
                await delay(backoff);
                continue;
            }

            if (!response.ok) return null;
            return response.json();
        }
        console.warn(`Giving up on ${symbol} after repeated rate limiting`);
        return null;
    }

    // Fetch a combined list of stock + crypto symbols from Finnhub.
    // `symbols` is an array of { type, symbol }. Returns a Map keyed by "type:symbol".
    async function fetchFinnhubQuotes(symbols, apiKey, onProgress) {
        const results = new Map();
        if (!apiKey || symbols.length === 0) return results;

        const CONCURRENCY = 6;
        const SAFE_PER_MINUTE = 50; // headroom under Finnhub's real 60/min free-tier cap

        for (let start = 0; start < symbols.length; start += SAFE_PER_MINUTE) {
            const chunk = symbols.slice(start, start + SAFE_PER_MINUTE);

            await runPool(chunk, CONCURRENCY, async ({ type, symbol }) => {
                try {
                    const data = await fetchQuoteWithRetry(symbol, apiKey);
                    if (data && data.c && data.c > 0) {
                        let changePercent = 0;
                        if (data.pc && data.pc > 0) {
                            changePercent = ((data.c - data.pc) / data.pc) * 100;
                        }
                        results.set(`${type}:${symbol}`, {
                            price: data.c,
                            changePercent,
                            previousPrice: data.pc || data.c
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching ${symbol}:`, error);
                } finally {
                    if (onProgress) onProgress();
                }
            });

            // Only pace across minute windows for portfolios big enough to need it.
            if (start + SAFE_PER_MINUTE < symbols.length) {
                await delay(60000);
            }
        }

        return results;
    }

    // Fetch every tracked metal in ONE request via metals.dev's /v1/latest batch
    // endpoint, instead of one request per metal. Returns a Map keyed by "metal:<symbol>".
    async function fetchMetalsBatch(metals, baseCurrency, apiKey, onProgress) {
        const results = new Map();
        if (!apiKey || metals.length === 0) return results;

        try {
            const response = await fetch(
                `https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=${encodeURIComponent(baseCurrency)}&unit=toz`
            );

            if (response.ok) {
                const data = await response.json();
                metals.forEach(metal => {
                    const metalData = data.metals && data.metals[metal];
                    if (metalData && metalData.price) {
                        results.set(`metal:${metal}`, {
                            price: metalData.price,
                            changePercent: metalData.change_pct || 0,
                            previousPrice: metalData.price
                        });
                    }
                });
            } else {
                console.error(`metals.dev API error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching metals:', error);
        }

        if (onProgress) metals.forEach(() => onProgress());
        return results;
    }

    // Main entry point. Fetches prices for a whole portfolio in one pass and
    // returns a single Map keyed by "type:symbol" -> { price, changePercent, previousPrice }.
    async function refreshAll({ stocks = [], cryptos = [], metals = [], baseCurrency = 'USD', finnhubKey, metalsKey, onProgress } = {}) {
        const finnhubSymbols = [
            ...stocks.map(symbol => ({ type: 'stock', symbol })),
            ...cryptos.map(symbol => ({ type: 'crypto', symbol }))
        ];

        const [finnhubResults, metalResults] = await Promise.all([
            fetchFinnhubQuotes(finnhubSymbols, finnhubKey, onProgress),
            fetchMetalsBatch(metals, baseCurrency, metalsKey, onProgress)
        ]);

        const combined = new Map(finnhubResults);
        metalResults.forEach((value, key) => combined.set(key, value));
        return combined;
    }

    // Returns true if `timestamp` (ms epoch) falls on the same calendar day as now.
    function isSameLocalDay(timestamp) {
        if (!timestamp) return false;
        const a = new Date(timestamp);
        const b = new Date();
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    }

    window.PriceService = { refreshAll, isSameLocalDay };
})();
