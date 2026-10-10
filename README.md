# Iran Truck Trading Group — website

Static site for Iran Truck Trading Group, official representative of LEO in Iran.

Pages: `index.html`, `about.html`, `leo.html`, `products.html`, `contact.html` (English + Persian/RTL via the EN / فا switch).

- `src/pages/*.html` — page content (edit these)
- `src/partials/` — shared header and footer
- `build.py` — run `python3 build.py` to regenerate the root `*.html` pages after editing `src/`
- `css/style.css` — design system
- `js/i18n.js` — Persian translations; `js/main.js` — behaviour (no external libraries)
- `images/`, `media/` — photography, logos and the hero video

The generated pages are committed, so any static host (GitHub Pages) serves them as-is.

Stock photography (`images/st-*`, `images/lx-*`) is from Unsplash (Unsplash License); `media/hero.mp4` is from Mixkit (Mixkit License).
