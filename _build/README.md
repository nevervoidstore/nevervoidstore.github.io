# Site build sources

## THE RULES (never skip, never forget)
1. **Every public design image is watermarked.** New mugs are added only with `add_mug.py` (or `mug_printrove.py`), which watermark the design preview and register it in `watermarked.json`. `build.sh` refuses to publish if any mug design preview is not registered. Never make or copy design images by hand.
2. **Print files and full-size artwork never go public.** `*-print.png` and `realmugs/` stay git-ignored; public images are screen-sized (max 1200×1600).
3. **Mug artwork stays exactly as uploaded to Printrove.** Prefer Printrove's own mock-ups for the product photos.
4. **Never mention AI, the supplier, or where/how products are made.** No fake reviews.
5. **Always pull the repo and copy `_build` first** (other sessions may have changed it), then build with `build.sh` and copy only changed files.
6. **Don't change prices, descriptions, checkout or Razorpay** without the owner's approval.

## Adding a new mug
`python3 _build/add_mug.py <slug> <print.png> <printrove-front.png> <printrove-back.png>`, add the product to `realmugs.js`, then run `build.sh`.


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
