# Ledger Line

A personal finance tracker: log income, expenses, and debts, split extra
cash into repayments (avalanche or snowball), set payoff-by-date goals,
and get repayment reminders — with optional Telegram alerts and Supabase
sync. Runs entirely client-side.

One HTML file plus a service worker. No backend, no accounts, no build step.

---

## Install

1. Copy every file here into a repo, or a folder inside `kuburekeni.github.io`.
2. Push. GitHub Pages serves HTTPS.
3. Open the URL in Safari (iOS) or Chrome and **Add to Home Screen** if you want.

It works offline after the first load.

### After you edit index.html

Bump `CACHE` in `sw.js` — `ledgerline-v1` → `ledgerline-v2`. Otherwise installed
phones keep serving the cached old copy.

---

## Data & sync

- All data lives in your browser’s `localStorage` by default — nothing
  leaves your device unless you turn on sync.
- **Supabase (optional):** open Settings in the app (gear icon) and enter
  your project URL + anon key to sync data across devices. The SQL to
  create the table is included right there in Settings.
- **Telegram (optional):** also in Settings — add a bot token and chat ID
  to send yourself a summary of upcoming repayments on demand.

Because this is a static site, Telegram sends and Supabase syncs only
happen while the app is open in a browser — there’s no server here to run
things on a schedule.

---

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole app — HTML, CSS, JS, all inline |
| `manifest.webmanifest` | Name, icons, colours, standalone display |
| `sw.js` | Offline caching. Network first, cache as fallback |
