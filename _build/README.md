# Site build sources

Pages are generated, not hand-edited.

1. `node _build/build.js` (writes ./site from draw.js + products.js + base.css)
2. `python3 _build/corp.py` (SEO version of corporate-src.html)
3. `node _build/images.js` (product + share images, needs Playwright)
4. `node _build/version_assets.js` (adds ?v= versions to scripts and styles so browsers never use stale copies; always run last)

Paths in the scripts assume the original layout (src/ next to site/); copy _build to src/ before running.
Store settings (WhatsApp number, Razorpay links) live in assets/store.js.


## Design files are never committed
Print files (`*-print.png`) and the full-resolution artwork stay off this public repo and off the website. Public design images are screen-sized and watermarked (`watermark()` in mug_printrove.py). To rebuild, render the mugs from the original artwork into `_build/realmugs/` locally (it is git-ignored), or copy `images/mugs/*` there for the photos only.


## Always build with build.sh
`build.js` clears `site/`, so the share and product images must be regenerated after it. `build.sh` runs every step in order and fails if any product is missing its share image. Never publish after running `build.js` alone.
