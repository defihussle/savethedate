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

## Going live (Netlify)

`netlify.toml` is set up already (build `npm run build`, publish `dist`). The details form uses **Netlify Forms**. After the first deploy, submissions show up under *Forms → details* in the Netlify dashboard, and you can turn on email notifications there. The form only submits on the deployed site, not on the local dev server.
