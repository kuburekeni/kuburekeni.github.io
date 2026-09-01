# The Avenues Family Dental — static site

38 pages of hand-editable static HTML. No framework, no build step required to host.

## Hosting
Upload the contents of this folder to any static host (Netlify, Cloudflare Pages,
GitHub Pages, or plain shared hosting). Nothing server-side is required except the
contact form — see below.

## Editing
Two options:

1. **Edit the HTML directly.** Every page is plain, readable HTML.
2. **Edit `build.py` and regenerate.** All page copy lives in the `DENTISTS`,
   `SERVICES` and `FUNDS` structures at the top. Change the copy, run
   `python3 build.py`, and every page regenerates with consistent nav, footer,
   breadcrumbs, schema and internal links. This is the safer option for anything
   that appears on more than one page.

Design tokens (colours, fonts, spacing) are CSS variables at the top of
`assets/site.css`. Change one value, it changes everywhere.

## Before launch — must do

1. **Contact form has no handler.** `contact-us.html` has a form with
   `action="#"`. Static hosting can't process it. Point it at Formspree, Netlify
   Forms, Basin, or the practice's own endpoint, and add spam protection.
2. **Images hotlink the old WordPress install.** All `<img>` tags point at
   `avenuesfamilydental.com.au/wp-content/uploads/`. Download them, put them in
   `assets/img/`, and update the paths. Compress them first — several are
   2500px wide and are being displayed at a fraction of that.
3. **Clinical copy needs sign-off.** Service pages marked `review=True` in
   `build.py` were written from scratch and describe treatment. A dentist at the
   practice must read and approve them. Only `preventative` uses the practice's
   own existing wording verbatim.
4. **Set up redirects** from the old WordPress URLs so existing search rankings
   carry over. The old URLs used trailing-slash directories
   (`/services/preventative/`); these files are `.html`. Either configure clean
   URLs on the host or add redirect rules. Canonical tags already point at the
   old-style URLs on the assumption you'll use clean URLs.
5. **Google Tag Manager** (`GTM-KD3HZX7`) was on the old site and is not in these
   pages. Re-add it if the practice still uses it.

## Issues found on the existing site, fixed here

- Dr Jungin Park was on the team page but missing from the nav dropdown entirely.
- Dr Mick Curtis's nav link pointed to `/dr-mick-curtis/`, the team page pointed
  to `/our-team/dr-mick-curtis/`.
- Nav listed 12 services; the services sidebar listed 14. Aligners and IV
  sedation were missing from the nav.
- The services sidebar linked "Crowns, Bridges, and Veneers" to
  `/crowns-bridges-and-veneers/` (no `/services/` prefix) while the nav used
  `/services/crowns-bridges-and-veneers/`.
- The no-gap page's booking button pointed at a *different* booking system
  (`apac.dentalhub.online`) to every other booking link on the site
  (`appointments.praktika.net.au`). All booking links here use Praktika —
  **confirm this is the correct one.**
- The contact page footer referenced the Health Complaints Commissioner
  (Victoria). This is a Queensland practice; only the Office of the Health
  Ombudsman (Qld) is referenced here.
- Opening hours appeared only on the contact page. They're now on every page via
  the footer and the live status card, and in structured data.
