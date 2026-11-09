#!/bin/sh
# Full site build. Always run this, never the steps on their own: build.js clears site/, so images must be regenerated after it.
set -e
cd "$(dirname "$0")"
node src/build.js
python3 src/corp.py
node src/prices.js
node src/images.js
node src/version_assets.js > /dev/null
test -f site/images/og-home.jpg
n=$(ls site/images/share | wc -l); p=$(ls site/products | wc -l)
[ "$n" -eq "$p" ] || { echo "share images: $n, product pages: $p"; exit 1; }
echo "build ok: $p products, $n share images"
