// Google Merchant Center product feed (free listings + Shopping): site/google-feed.xml
// Built from the product pages' JSON-LD plus regular prices dumped by build.js (NV_DUMP).
// Images are the clean 1000x1000 product photos (Google rejects images with promo text, so not the share images).
const fs = require("fs"), path = require("path");
const ADMIN = require("./admin.js");
const SITE = path.join(__dirname, "..", "site"), BASE = "https://nevervoidstore.com";
const regular = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(__dirname, ".products.json"), "utf8")).map(r => [r[0], r[2]]));
const x = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MUG = "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Mugs";
const CASE = "Electronics > Communications > Telephony > Mobile Phone Accessories > Mobile Phone Cases";
const sale = ADMIN.SALE, today = new Date().toISOString().slice(0, 10);
const items = [];
for (const f of fs.readdirSync(path.join(SITE, "products")).filter(f => f.endsWith(".html")).sort()) {
  const slug = f.slice(0, -5), html = fs.readFileSync(path.join(SITE, "products", f), "utf8");
  let d = null;
  for (const m of html.matchAll(/application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { const j = JSON.parse(m[1]); const p = Array.isArray(j) ? j.find(o => o["@type"] === "Product") : j; if (p && p["@type"] === "Product") d = p; } catch (e) {} }
  if (!d || !regular[slug]) continue;
  const isCase = /case/.test(d.sku), price = Number(d.offers.price), reg = regular[slug];
  const img = fs.existsSync(path.join(SITE, "images", "products", slug + ".jpg")) ? `${BASE}/images/products/${slug}.jpg` : [].concat(d.image)[0];
  const extra = [].concat(d.image).filter(u => !/\/share\//.test(u) && u !== img);   // mug views (handle left/right)
  const type = (isCase ? "Phone cases" : "Mugs") + " > " + (/custom|pet-portrait/.test(slug) ? "Personalised" : (d.category || "Gifts").replace(/ (Mug|Case|Phone case)$/i, "").replace(/ Glass$/, ""));
  items.push(`<item>
<g:id>${x(d.sku)}</g:id>
<title>${x(d.name.slice(0, 150))}</title>
<description>${x(d.description.slice(0, 5000))}</description>
<link>${x(d.offers.url || BASE + "/products/" + f)}</link>
<g:image_link>${x(img)}</g:image_link>${extra.map(u => `\n<g:additional_image_link>${x(u)}</g:additional_image_link>`).join("")}
<g:availability>in_stock</g:availability>
<g:condition>new</g:condition>
<g:price>${reg}.00 INR</g:price>${price < reg ? `
<g:sale_price>${price}.00 INR</g:sale_price>
<g:sale_price_effective_date>${today}T00:00+05:30/${sale.ends}T23:59+05:30</g:sale_price_effective_date>` : ""}
<g:brand>NevervoidStore</g:brand>
<g:identifier_exists>no</g:identifier_exists>
<g:google_product_category>${x(isCase ? CASE : MUG)}</g:google_product_category>
<g:product_type>${x(type)}</g:product_type>${isCase ? "" : "\n<g:material>Ceramic</g:material>"}
<g:custom_label_0>${isCase ? "case" : "mug"}</g:custom_label_0>
</item>`);
}
fs.writeFileSync(path.join(SITE, "google-feed.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>NevervoidStore</title>
<link>${BASE}</link>
<description>Mugs and phone cases, made to order</description>
${items.join("\n")}
</channel>
</rss>
`);
console.log("google-feed.xml: " + items.length + " products");
