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

## Going live (Cloudflare Pages)

The site deploys on Cloudflare Pages, connected to the GitHub repo, so every push to `main` goes live. Build settings: framework preset *None*, build command `npm run build`, build output directory `dist`, and the environment variable `NODE_VERSION` set to `24.15.0`. (`netlify.toml` is left over from the earlier Netlify setup.)

The details form saves each response to the **Google Sheet** through the Apps Script web app set as `sheetEndpoint` in `src/config.js`, and that works from the local dev server too. Each field's `name` becomes a column header in the sheet.
