# Shift Log

A tiny installable app for logging work shifts. No build tools, no backend —
everything lives in your browser's local storage, on your phone.

## What's in here

- `index.html` — the whole app (HTML/CSS/JS in one file)
- `manifest.json` — makes it installable ("Add to Home Screen")
- `sw.js` — service worker, so it still opens with no signal
- `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` — app icons

## Deploy to GitHub Pages

1. Create a new repo on GitHub (e.g. `shift-log`), or reuse an existing one.
2. Upload all the files in this folder to the repo root (or a `/docs` folder —
   just make sure it matches what you pick in step 3).
3. In the repo: **Settings → Pages → Source**, pick the branch and folder the
   files are in, then save.
4. GitHub gives you a URL like `https://yourusername.github.io/shift-log/`.
   Give it a minute or two after your first push before it's live.

Quick way from the command line, if you'd rather:

```bash
cd shift-logger
git init
git add .
git commit -m "Shift log app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/shift-log.git
git push -u origin main
```

Then turn on Pages for that repo (Settings → Pages → Source: `main` /
`root`).

## Installing it on your phone

**Android (Chrome):** open the GitHub Pages URL, tap the **⋮** menu →
**Add to Home screen** (Chrome may also show an install banner
automatically).

**iPhone (Safari):** open the URL, tap the **Share** icon → **Add to Home
Screen**. Safari doesn't show an auto-install prompt like Chrome does — this
manual step is the only way on iOS.

Once installed it opens full-screen, without browser chrome, like a normal
app.

## How the data works

- Shifts are stored in `localStorage`, scoped to that URL. That means:
  - Data stays on that one device/browser — it does **not** sync between
    your phone and a laptop.
  - Clearing your browser's site data/cache for the app will erase it.
  - Reinstalling from the same URL keeps your data; deploying to a
    **different** URL (e.g. moving repos) starts fresh.
- Use **Export CSV** any time you want a backup or to move data into a
  spreadsheet.

## Using it

- **Clock in / Clock out** on the punch card at the top for real-time
  logging — it timestamps the moment you tap.
- **Add manually** to log a past shift or fix a mistake (tap any entry in
  the list to edit or delete it).
- Stats up top total today / this week / this month / all time, including
  whatever shift is currently running.

## Customizing

Everything is in `index.html` — colors are CSS variables near the top of
the `<style>` block (`--bg`, `--amber`, `--paper`, etc.) if you want to
retheme it. No build step; edit and redeploy.
