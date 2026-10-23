# Save the Date website

Page 1: an antique photo booth prints the couple's strip, then CLICK TO ENTER.
Page 2: Save the Date, venue and live countdown.
Page 3: the Share Your Details form.

## Run locally

```
npm install
npm run dev        # http://localhost:5180
```

## Make it yours

- **Names, initials, date, venue, ceremony time:** edit `src/config.js`. `ceremonyISO` drives the countdown, so include the venue's UTC offset.
- **Photos:** put the photos in `public/photos/` (JPG is fine, colour is fine because the site converts them to black and white). Then list them in `boothPhotos` and `heroPhotos` in `src/config.js`. Landscape crops of about 7:6 fit the booth frames best.

## Going live (Cloudflare Workers)

The site is the Cloudflare Worker `savethedateoo`, connected to the GitHub repo, so every push to `main` goes live at https://savethedateoo.logshvac-293.workers.dev. `wrangler.jsonc` names the Worker and serves the built `dist/` folder as static assets. Build settings: build command `npm run build`, deploy command `npx wrangler deploy`. To deploy by hand: `npm run build`, then `npx wrangler deploy`. (`netlify.toml` is left over from the earlier Netlify setup.)

The details form saves each response to the **Google Sheet** through the Apps Script web app set as `sheetEndpoint` in `src/config.js`, and that works from the local dev server too. Each field's `name` becomes a column header in the sheet.
