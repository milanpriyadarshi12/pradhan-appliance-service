# Pradhan Appliance Service

A polished, responsive static website for Pradhan Appliance Service in
Bhubaneswar, Odisha. It is built with semantic HTML, modern CSS and vanilla
JavaScript — no framework, build step or runtime server is required.

## Run locally

Open `index.html` directly in a browser, or serve the folder with any static
server:

```bash
cd pradhan-appliance-service
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Features

- Compact horizontal hero image carousel with four local appliance-service
  images, autoplay, arrows, dots and touch/swipe support
- Blue seamless service-area ticker for Nayapalli, Patia and Rasulgarh
- Responsive navigation for desktop, tablet and mobile
- Hero, service cards, benefits, process, service areas and FAQ sections
- Self-contained local-image service gallery with accessible lightbox and touch-friendly close behavior
- Review carousel with auto-slide, pause-on-hover, swipe support and published
  reviews loaded from Google Sheets
- Review form with customer name, star rating, review text and validation
- Full review modal for all published Google Sheets reviews
- Booking form with validation and WhatsApp handoff to `7978997413`
- Direct phone and email links throughout the page
- Mobile bottom contact bar and desktop floating contact controls
- iPhone-safe modal scroll locking, safe-area spacing and local reviewer avatars
- `prefers-reduced-motion`, keyboard focus states, semantic labels and image
  alt text

## Review storage and moderation

Reviews use the configured Google Apps Script web app as the source of truth.
The site fetches only rows whose `Status` is `Published`. New submissions are
sent as JSON with `name`, `rating` and `review`; the Apps Script stores them as
`Pending` with the current date. A review appears on the site only after its
status is changed to `Published` in Google Sheets.

## Project structure

```text
index.html
css/style.css
js/script.js
assets/images/
  hero.jpeg
  logo.jpeg
  pradhan-appliance-care-logo.svg
  gallery/
```

The project has no third-party JavaScript dependencies. `package.json` is
included only as project metadata for editors and tooling; it is not required
to run the static site.

## Mobile and Safari notes

- The location ticker uses two equal-width content groups and a CSS transform
  animation; it does not depend on `scrollLeft` or a JavaScript animation loop.
- Hero and review sliders pause while the page is hidden and restart with one
  timer when the page becomes visible again.
- Review cards are rendered only when API data changes. Slide changes update
  the track transform and active dots without rebuilding card elements.
- The site was validated with static checks and a local HTTP server in this
  environment. Physical iPhone Safari hardware was not available, so final
  verification on an iPhone 15 remains recommended.