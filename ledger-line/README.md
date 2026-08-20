# Ledger Line

A personal finance tracker: log income, expenses, and debts, split extra
cash into repayments (avalanche or snowball), set payoff-by-date goals,
and get repayment reminders — with optional Telegram alerts and Supabase
sync. Runs entirely client-side. 

## Deploy to GitHub Pages

1. **Create a new GitHub repo** (public or private, doesn't matter) and push
   this folder to it:

   ```bash
   git init
   git add .
   git commit -m "Ledger Line"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```

2. **Turn on Pages via Actions.** In the repo: Settings → Pages → under
   "Build and deployment", set **Source** to **GitHub Actions**.

3. That's it. The workflow in `.github/workflows/deploy.yml` builds the app
   and deploys it on every push to `main`. Check the **Actions** tab for
   progress — the first run takes a minute or two. Your app will be live at:

   ```
   https://<your-username>.github.io/<repo-name>/
   ```

   (`vite.config.js` uses a relative base path, so it works at that URL
   with no extra config, and also works if you ever move it to a custom
   domain or a user/organization page.)

## Local development

```bash
npm install
npm run dev
```

## Data & sync

- All data lives in your browser's `localStorage` by default — nothing
  leaves your device unless you turn on sync.
- **Supabase (optional):** open Settings in the app (gear icon) and enter
  your project URL + anon key to sync data across devices. The SQL to
  create the table is included right there in Settings.
- **Telegram (optional):** also in Settings — add a bot token and chat ID
  to send yourself a summary of upcoming repayments on demand.

Because this is a static site, Telegram sends and Supabase syncs only
happen while the app is open in a browser — there's no server here to run
things on a schedule. If you want reminders to fire automatically (e.g.
every morning) without opening the app, that needs a small scheduled job
running server-side, such as a Supabase Edge Function on a cron trigger.
That's a separate, optional piece — ask if you want it built.

## Tech

Vite + React + Tailwind CSS + lucide-react icons. No backend required.
