// Error Catcher — lightweight client-side error monitoring
// for Free Portfolio Tracker (https://freeportfoliotracker.com)
//
// There is no server/admin panel for this site, so this is the
// substitute for "check the error logs":
//   1. Catches uncaught exceptions and unhandled promise rejections
//      anywhere on the page.
//   2. Keeps a small rolling log in localStorage on the user's own
//      device (never sent anywhere) so a user who hits a bug can
//      grab it via window.FPT_ERRORS.copy() and paste it into a
//      bug report — no portfolio data is ever included.
//   3. Reports an anonymous event (message/file/line only — never
//      portfolio data) to GA4 via the existing gtag() so trends are
//      visible in Analytics. This goes through the same Consent
//      Mode v2 gating as every other gtag call on this site (see
//      cookie-consent.js): if the visitor hasn't granted analytics
//      consent, Google receives no storable/identifying hit.
//
// Loaded as early as possible (right after the Consent Mode stub in
// <head>) so it's listening before any other script on the page runs.

(() => {
    'use strict';

    const STORAGE_KEY = 'fpt_error_log';
    const MAX_STORED = 40;
    const MAX_GA_EVENTS_PER_LOAD = 8;

    let gaEventsSent = 0;
    const seenFingerprints = new Set();

    const truncate = (str, max) => {
        if (typeof str !== 'string') return str;
        return str.length > max ? str.slice(0, max) + '…' : str;
    };

    const readLog = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    };

    const writeLog = (entries) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_STORED)));
        } catch (e) { /* ignore quota errors */ }
    };

    // Strip our own origin off source URLs ("https://freeportfoliotracker.com/app.js?v=6"
    // -> "app.js?v=6") so the 100-char GA4 param budget goes toward the useful part.
    const shortenSource = (src) => {
        if (!src) return '';
        try {
            return src.replace(location.origin + '/', '');
        } catch (e) {
            return src;
        }
    };

    const reportToGA = (entry) => {
        if (typeof window.gtag !== 'function') return;
        if (gaEventsSent >= MAX_GA_EVENTS_PER_LOAD) return;
        gaEventsSent++;
        try {
            window.gtag('event', 'js_error', {
                error_type: entry.type || 'error',
                error_message: truncate(entry.message, 100),
                error_source: truncate(shortenSource(entry.source), 100),
                error_line: entry.line || 0,
                error_col: entry.col || 0,
                page_path: location.pathname
            });
        } catch (e) { /* never let reporting itself throw */ }
    };

    const record = (entry) => {
        entry.page = location.pathname;
        entry.ts = new Date().toISOString();

        // Dedupe repeats of the same error within this page load
        // (e.g. an error thrown on every animation frame) so one bug
        // doesn't flood the local log or the GA event quota.
        const fingerprint = `${entry.message}|${entry.source}|${entry.line}`;
        if (seenFingerprints.has(fingerprint)) return;
        seenFingerprints.add(fingerprint);

        const log = readLog();
        log.push(entry);
        writeLog(log);

        reportToGA(entry);
    };

    window.addEventListener('error', (event) => {
        try {
            // Resource load failures (broken <img>/<script>/<link>) surface
            // here too, but without message/filename/lineno — target is the
            // failed element instead.
            if (event.target && event.target !== window && event.target.tagName) {
                record({
                    type: 'resource',
                    message: `Failed to load ${event.target.tagName.toLowerCase()}`,
                    source: event.target.src || event.target.href || '',
                    line: 0
                });
                return;
            }

            record({
                type: 'error',
                message: event.message || 'Unknown error',
                source: event.filename || '',
                line: event.lineno || 0,
                col: event.colno || 0,
                stack: event.error && event.error.stack ? truncate(String(event.error.stack), 1000) : ''
            });
        } catch (e) { /* the catcher must never itself throw */ }
    }, true); // capture phase — needed to see resource errors, which don't bubble

    window.addEventListener('unhandledrejection', (event) => {
        try {
            const reason = event.reason;
            const isError = reason instanceof Error;
            record({
                type: 'unhandledrejection',
                message: isError ? reason.message : truncate(String(reason), 200),
                source: '',
                line: 0,
                stack: isError && reason.stack ? truncate(reason.stack, 1000) : ''
            });
        } catch (e) { /* ignore */ }
    });

    // Small public API so a user hitting a bug can self-report it, and so
    // it can be checked from the console during support/debugging without
    // needing an admin panel or server-side logs.
    window.FPT_ERRORS = {
        list: () => readLog(),
        clear: () => { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} },
        copy: () => {
            const text = JSON.stringify(readLog(), null, 2);
            const done = () => {
                if (window.UIFeedback && window.UIFeedback.toast) {
                    window.UIFeedback.toast.success('Error log copied — paste it into your bug report.');
                } else {
                    alert('Error log copied to clipboard.');
                }
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done).catch(() => window.prompt('Copy this error log:', text));
            } else {
                window.prompt('Copy this error log:', text);
            }
        }
    };
})();
