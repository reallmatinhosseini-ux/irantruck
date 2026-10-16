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

Stock photography (`images/st-*`, `images/lx-*`) is from Unsplash (Unsplash License); `media/hero.mp4` is Mixkit clip 52434, “Transport trucks gliding over black asphalt road among arid vegetation” (Mixkit License).

Brand logos (`images/brands/`) are the manufacturers' trademarks, sourced from Wikimedia Commons / Wikipedia and recoloured for a dark background; they indicate compatibility only. Part photography in `images/parts/` is from Unsplash (Unsplash License). LEO product photos in `images/leo/` and the studio shots in `images/studio/` are cut out from the LEO product catalogue supplied by Iran Truck Trading Group.

Engine photos in `images/studio/engine-*` are cut out from "Weichai WP 12 truck engine" photographs by Spielvogel on Wikimedia Commons (CC0).
