// Writes site/prices.json: every orderable product id -> price in rupees, read from the built pages.
// The checkout backend checks each order's amount against this file, so a tampered page can't change the price.
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "site"), prices = {};
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".html")) for (const m of fs.readFileSync(p, "utf8").matchAll(/data-order[^>]*?data-id="([^"]+)"[^>]*?data-price="(\d+)"/g)) {
      if (prices[m[1]] && prices[m[1]] !== +m[2]) throw new Error("two prices for " + m[1]);
      prices[m[1]] = +m[2];
    }
  }
})(OUT);
fs.writeFileSync(path.join(OUT, "prices.json"), JSON.stringify(prices));
console.log("prices.json:", Object.keys(prices).length, "products");
