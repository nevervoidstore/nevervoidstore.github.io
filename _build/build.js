// Static site generator for nevervoidstore.github.io
// Usage: node src/build.js  (outputs into ./site)
const fs = require("fs"), path = require("path");
const SRC = __dirname, OUT = path.join(SRC, "..", "site");
const BASE = "https://nevervoidstore.com";
const TODAY = "2026-11-03";

// ---- load drawing code + products from the original catalogue ----
const drawCode = fs.readFileSync(path.join(SRC, "draw.js"), "utf8");
const prodCode = fs.readFileSync(path.join(SRC, "products.js"), "utf8");
const PRODUCTS = new Function(drawCode + "\n" + prodCode + "\nreturn PRODUCTS;")();

const EXTRA = {
  "mug-sleigh": {slug:"sleigh-all-day-christmas-mug", long:"A bold red “Sleigh” with “all day” in festive green, framed by drifting snowflakes. It's a cheerful pick for Secret Santa, office gift swaps or your own winter coffee."},
  "mug-tree": {slug:"merry-and-bright-christmas-tree-mug", long:"A small, hand-styled Christmas tree with red and gold baubles and a gold star, finished with “Merry & Bright” on a warm cream mug. A gentle, classic Christmas gift."},
  "mug-cocoa": {slug:"hot-cocoa-club-red-christmas-mug", long:"A festive red mug with a vintage-style “Hot Cocoa Club” badge and white snowflakes. It's made for hot chocolate season and looks great on a gift table."},
  "mug-ginger": {slug:"gingerbread-oh-snap-christmas-mug", long:"A cheeky gingerbread friend with icing buttons and a big “Oh Snap!”. It's a fun Christmas mug for cookie dunkers and anyone who likes a laugh with their coffee."},
  "mug-dogmom": {slug:"dog-mom-coffee-mug", long:"A happy brown dog face with “Dog Mom” and the line “fuelled by coffee & fur”. A sweet gift for any dog parent, for birthdays, Christmas or just because."},
  "mug-cat": {slug:"purrsonal-space-black-cat-mug", long:"A calm, slightly judgemental cat on a black mug with “Purrsonal Space”. For cat people who need their morning coffee before conversation."},
  "mug-paws": {slug:"paws-and-coffee-paw-print-mug", long:"Scattered coral paw prints with “Paws & Coffee” on a white mug. A light, playful gift for pet lovers of every kind."},
  "mug-custom": {slug:"custom-pet-portrait-mug", long:"Turn a photo of your dog, cat or any pet into a custom portrait on a mug, with their name if you like. You pick the style, and we send you a preview to approve before anything is printed.", steps:true},
  "case-plaid": {slug:"holiday-plaid-iphone-case", long:"Classic red-and-green tartan with fine gold lines. It's a cosy Christmas look on a glass phone case, made to order for your exact model."},
  "case-pines": {slug:"snowy-pines-christmas-iphone-case", long:"A quiet winter night: a crescent moon, falling snow and pine trees on deep navy. A calm Christmas glass phone case you can keep using all winter."},
  "case-cats": {slug:"cat-pattern-iphone-case", long:"A whole crowd of black and coral cat faces on blush pink. A playful glass phone case for cat lovers, made for your model."},
  "case-paws": {slug:"paw-print-iphone-case", long:"Paw prints scattered across soft sage green. A simple, pretty glass phone case for dog and cat people alike."},
  "case-custom": {slug:"custom-pet-iphone-case", long:"Your pet's portrait and name on a glass phone case. Send us a photo, choose a style, and approve the preview before we print.", steps:true}
};
PRODUCTS.forEach(p => Object.assign(p, EXTRA[p.id]));
// ---- real products (Printrove mock-ups) ----
const REAL = require(path.join(SRC, "real.js"));
REAL.forEach(r => {
  r.models = JSON.parse(fs.readFileSync(path.join(SRC, "real", r.folder + ".json"), "utf8"));
  r.imgFor = slug => `/images/cases/${r.folder}/${slug}.webp`;
  r.art = `<img class="photo" src="${r.imgFor(r.defaultModel)}" alt="${r.name}" width="600" height="800" loading="lazy">`;
  r.real = true; r.shownOn = "iPhone 16 Pro";
});
const MUGS = require(path.join(SRC, "realmugs.js"));
// handle-right is the default primary image; a mug can set view:"a" when its artwork faces the other side
MUGS.forEach(m => { m.view = m.view || "b"; m.alt = m.view === "a" ? "b" : "a"; Object.assign(m, {
  id: "mug-" + m.slug, type: "mug", cat: m.cats[0], price: 449, real: true, photoMug: true,
  photoSrc: path.join(SRC, "realmugs", `${m.slug}-${m.view}.webp`),
  art: `<img class="photo" src="/images/mugs/${m.slug}-${m.view}.webp" alt="${m.name}" width="620" height="620" loading="lazy">`
}); });
REAL.forEach(r => { r.photoSrc = path.join(SRC, "real", r.folder, r.defaultModel + ".webp"); });
PRODUCTS.unshift(...REAL, ...MUGS);
// Christmas glass case collection (Printrove library designs), shown on an iPhone 16 Pro frame
const CASES = require(path.join(SRC, "cases.js"));
CASES.forEach(c => PRODUCTS.push({
  id: "case-" + c.slug, slug: c.slug + "-glass-phone-case", type: "case", cat: c.cats[0], cats: c.cats, collection: "cases", isNew: true,
  name: c.name + " Glass Case", price: 699, code: c.code, orderName: `${c.name} Glass Case (design ${c.code})`, shownOn: "iPhone 16 Pro",
  desc: c.desc, long: `${c.desc} A glossy glass phone case, made to order for your exact phone model.`,
  photoSrc: path.join(SRC, "casedesigns", c.slug + ".webp"),
  art: `<img class="photo" src="/images/cases/designs/${c.slug}-sm.webp?v=4" alt="${c.name} glass phone case" width="480" height="640" loading="lazy">`,
  galleryArt: `<img id="pimg" class="photo" src="/images/cases/designs/${c.slug}.webp?v=4" alt="${c.name} glass phone case" width="1200" height="1600">` }));
PRODUCTS.filter(p => p.id === "case-knitted-puppies").forEach(p => { p.collection = "cases"; });
// placeholder (drawn) designs are hidden until real artwork replaces them
const HIDDEN = new Set(["mug-sleigh","mug-tree","mug-cocoa","mug-ginger","mug-dogmom","mug-cat","mug-paws","case-plaid","case-pines","case-cats","case-paws"]);
for (let i = PRODUCTS.length - 1; i >= 0; i--) if (HIDDEN.has(PRODUCTS[i].id)) PRODUCTS.splice(i, 1);
// custom products: photo tiles on the same Printrove mug / case photos as everything else
{ const cm = PRODUCTS.find(p => p.id === "mug-custom");
  Object.assign(cm, { photoMug: true, noExtras: true, view: "b", alt: "a", photoSrc: path.join(SRC, "realmugs", "custom-pet-portrait-mug-b.webp"),
    art: `<img class="photo" src="/images/mugs/custom-pet-portrait-mug-b.webp" alt="Custom Pet Portrait Mug" width="620" height="620" loading="lazy">` });
  const cc = PRODUCTS.find(p => p.id === "case-custom");
  Object.assign(cc, { photoSrc: path.join(SRC, "custom", "custom-pet-case.webp"),
    art: `<img class="photo" src="/images/cases/custom-pet-case.webp" alt="Custom Pet Glass Case" width="600" height="800" loading="lazy">` }); }
const MASTER_MODELS = REAL[0].models;
PRODUCTS.forEach(p => { if (p.type === "case" && !p.models) { p.models = MASTER_MODELS; p.imgFor = null; } });
// Razorpay Payment Page item field for each product (field label lowercased, spaces -> underscores)
PRODUCTS.forEach(p => { p.rzpItem = p.type === "mug" ? (p.id === "mug-custom" ? "custom_pet_mug" : "ceramic_mug") : (p.id === "case-custom" ? "custom_phone_case" : "glass_phone_case"); });

const IPHONES = ["iPhone 17 Pro Max","iPhone 17 Pro","iPhone 17","iPhone Air","iPhone 16 Pro Max","iPhone 16 Pro","iPhone 16","iPhone 15 Pro Max","iPhone 15 Pro","iPhone 15","iPhone 14 Pro","iPhone 14","iPhone 13"];
const rupee = n => "₹" + n.toLocaleString("en-IN");
// ---- SEASON SALE: change pct/ends or set on:false, then rebuild ----
const SALE = { on: true, pct: 20, ends: "2026-12-25", label: "Christmas Sale" };
const salePrice = p => SALE.on ? Math.floor(p.price * (1 - SALE.pct/100) / 10) * 10 + 9 : p.price;
const priceHtml = (p, cls="price") => SALE.on
  ? `<div class="${cls}"><span class="was">${rupee(p.price)}</span> <span class="now">${rupee(salePrice(p))}</span></div>`
  : `<div class="${cls}">${rupee(p.price)}</div>`;
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const typeLabel = p => p.type === "mug" ? "Mug" : "Glass phone case";
const catLabel = p => p.cat === "christmas" ? "Christmas" : "Pet";

const POL = require(path.join(SRC, "policies.js"));
const TEAM_API = process.env.TEAM_API || POL.CONTACT.teamApi || "";
// ---------- shared pieces ----------
const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,500&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">`;

function head({title, desc, url, image, type="website", root="", jsonld=[]}) {
  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#1f4d36">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="Nevervoid Store">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:type" content="image/jpeg">${image.includes("/images/share/") ? `\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">` : ""}
<meta property="og:image:alt" content="${esc(title)}">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${image}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%231f4d36'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-family='Georgia' font-weight='700' font-size='18' fill='%23fbf6ec'%3EN%3C/text%3E%3C/svg%3E">
${fonts}
<link rel="stylesheet" href="${root}assets/store.css">
<link rel="stylesheet" href="${root}assets/festive.css">
<script defer src="${root}assets/festive.js"></script>
<script defer src="${root}assets/chat.js"></script>
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
${metaHead()}
</head>`;
}

function header(root, active) {
  return `<header>
  <div class="wrap">
    <a class="logo" href="${root}index.html">NevervoidStore</a>
    <div class="nav">
      <a class="navlink hide-sm${active==="shop"?" on":""}" href="${root}index.html">Shop</a>
      <a class="navlink${active==="blog"?" on":""}" href="${root}blog/index.html">Blog</a>
      <a class="ig corp" href="${root}corporate.html">Corporate gifting</a>
      <a class="ig-icon" href="https://instagram.com/nevervoidstore" rel="noopener" aria-label="NevervoidStore on Instagram" title="Instagram"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg></a>
    </div>
  </div>
</header>
<div class="trustbar" role="note"><div class="wrap tb-in">
  <span>A brand by <a href="${POL.CONTACT.photographySite}" rel="noopener">Nevervoid Photography</a></span>
  <span class="tb-dot">·</span>
  <span>Founded by ${POL.CONTACT.linkedin ? `<a href="${POL.CONTACT.linkedin}" rel="noopener">Antony Pratap</a> <a class="tb-li" href="${POL.CONTACT.linkedin}" rel="noopener" aria-label="Antony Pratap on LinkedIn">${POL.LI_ICON}</a>` : "Antony Pratap"}</span>
  <span class="tb-wide tb-dot">·</span><span class="tb-wide">🔒 Secure payments by Razorpay</span>
  <span class="tb-wide tb-dot">·</span><span class="tb-wide">🚚 Delivered across Karnataka</span>
</div></div>`;
}

function footer(root) {
  return `<footer>
  <div class="foot-links">
    <a href="${root}index.html">All products</a>
    <a href="${root}index.html#christmas">Christmas mugs &amp; cases</a>
    <a href="${root}index.html#pets">Pet gifts</a>
    <a href="${root}products/custom-pet-portrait-mug.html">Custom pet portrait mug</a>
    <a href="${root}corporate.html">Corporate gifting</a>
    <a href="${root}blog/index.html">Blog</a>
  </div>
  <div class="foot-links foot-policy">
    <a href="${root}policies/about.html">About us</a>
    <a href="${root}policies/contact.html">Contact</a>
    <a href="${root}policies/shipping.html">Shipping</a>
    <a href="${root}policies/returns.html">Returns &amp; refunds</a>
    <a href="${root}policies/returns.html#cancellation">Cancellation</a>
    <a href="${root}policies/privacy.html">Privacy</a>
    <a href="${root}policies/terms.html">Terms</a>
    <a href="#report" data-report>⚠️ Report an issue</a>
  </div>
  <p class="foot-brand">NevervoidStore is a brand by <a href="${POL.CONTACT.photographySite}" rel="noopener">Nevervoid Photography</a>, founded by ${POL.CONTACT.linkedin ? `<a href="${POL.CONTACT.linkedin}" rel="noopener">Antony Pratap</a>` : "Antony Pratap"}.</p>
  <div class="foot-social">
    <a href="https://instagram.com/nevervoidstore" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg></a>
    ${POL.CONTACT.linkedin ? `<a href="${POL.CONTACT.linkedin}" rel="noopener" aria-label="Antony Pratap on LinkedIn">${POL.LI_ICON}</a>` : ""}
    ${POL.CONTACT.whatsapp ? `<a href="https://wa.me/${POL.CONTACT.whatsapp}" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#25D366"/><path fill="#fff" d="M12 5.5a6.4 6.4 0 0 0-5.5 9.7L5.6 18l2.9-.8A6.4 6.4 0 1 0 12 5.5zm3.4 8.6c-.1.4-.8.7-1.1.8-.6.1-1 0-2-.4a6.7 6.7 0 0 1-2.7-2.4c-.2-.3-.7-1-.7-1.8s.4-1.2.6-1.4.3-.2.4-.2h.3c.1 0 .3 0 .4.3l.5 1.2v.3l-.4.5c-.1.1-.2.2-.1.4.3.6 1 1.4 2 1.8.2.1.3.1.4 0l.5-.6c.1-.2.3-.2.4-.1l1.2.5c.2.1.3.1.3.2s0 .5-.1.9z"/></svg></a>` : ""}
  </div>
  <p>Made-to-order mugs &amp; phone cases · Delivering across Karnataka · <a href="https://instagram.com/nevervoidstore" rel="noopener">@nevervoidstore</a></p>
</footer>
<div class="toast" id="toast"></div>
<script src="${root}assets/store.js"></script>
<script defer src="${root}assets/report.js"></script>
</body>
</html>`;
}

function orderBlock(p) {
  if (p.models) {
    const brands = [...new Set(p.models.map(m => m.brand))];
    return `<label class="field">Your phone model
        <select class="model" aria-label="Phone model"><option value="">Choose your phone</option>${brands.map(b => `<optgroup label="${b}">${p.models.filter(m=>m.brand===b).map(m=>`<option data-s="${m.slug}">${m.label}</option>`).join("")}</optgroup>`).join("")}</select></label>
      <p class="model-help">Phone not listed? Tap <b>Ask a question</b> and tell us your model.</p>
      <label class="field">Delivery pincode <span class="hint">(Karnataka only for now)</span>
        <input class="pin" type="text" inputmode="numeric" maxlength="6" placeholder="e.g. 560001" autocomplete="postal-code"></label>
      <div class="pin-msg" hidden></div>
      <button class="buy" type="button" data-order data-rzp="${p.rzpItem}" data-id="${p.id}" data-name="${esc(p.orderName || p.name)}" data-price="${salePrice(p)}">Order now · ${rupee(salePrice(p))}</button>
      <button class="ask" type="button" data-ask data-name="${esc(p.name)}">Ask a question</button>`;
  }
  return `${p.type==="case" ? `<label class="field">Your iPhone model
        <select class="model" aria-label="iPhone model"><option value="">Choose your iPhone</option>${IPHONES.map(m=>`<option>${m}</option>`).join("")}</select></label>` : ""}${p.rzpItem === "ceramic_mug" ? `
      <div class="mc-row" data-mugcolors><span class="mc-head">Mug colour <span class="mc-name">White</span></span><div class="mc-list cm-colors" role="radiogroup" aria-label="Mug colour"></div><span class="cm-note">The handle and the inside take the colour; the design is printed on white.</span></div>
      <script defer src="/assets/mugcolor.js"></script>` : ""}
      <label class="field">Delivery pincode <span class="hint">(Karnataka only for now)</span>
        <input class="pin" type="text" inputmode="numeric" maxlength="6" placeholder="e.g. 560001" autocomplete="postal-code"></label>
      <div class="pin-msg" hidden></div>
      <button class="buy" type="button" data-order data-rzp="${p.rzpItem}" data-id="${p.id}" data-name="${esc(p.orderName || p.name)}" data-price="${salePrice(p)}">Order now · ${rupee(salePrice(p))}</button>
      <button class="ask" type="button" data-ask data-name="${esc(p.name)}">Ask a question</button>`;
}

function card(p, root) {
  const href = `${root}products/${p.slug}.html`;
  return `<article class="card" data-cat="${(p.cats||[p.cat]).join(" ")}" data-type="${p.type}">
    <a class="stage ${p.cat}${p.photoMug ? " ph" : ""}" href="${href}" aria-label="${esc(p.name)}">${SALE.on ? `<span class="fx-badge">−${SALE.pct}%</span>` : ""}${p.art}</a>
    <div class="info">
      <div class="tags"><span class="tag">${p.type === "case" ? "Phone case" : typeLabel(p)}</span></div>
      <h3><a href="${href}">${esc(p.name)}</a></h3>
      <p>${esc(p.desc)}</p>
      ${priceHtml(p)}
      <a class="buy" href="${href}">View &amp; order</a>
    </div>
  </article>`;
}

const INITIALS = () => PRODUCTS.filter(p => p.collection === "initials").sort((a, b) => a.letter.localeCompare(b.letter));
function casesCard(root) {
  const items = PRODUCTS.filter(p => p.collection === "cases"); if (!items.length) return "";
  const lead = items.find(p => p.slug.startsWith("jolly-santa")) || items[0], href = `${root}cases/`;
  const from = Math.min(...items.map(salePrice)), was = Math.min(...items.map(p => p.price));
  return `<article class="card coll-card" data-cat="christmas" data-type="case">
    <a class="stage christmas" href="${href}" aria-label="Christmas Phone Cases">${SALE.on ? `<span class="fx-badge">−${SALE.pct}%</span>` : ""}${lead.art}<span class="coll-letters" aria-hidden="true">${items.length} designs</span></a>
    <div class="info">
      <div class="tags"><span class="tag">Collection</span></div>
      <h3><a href="${href}">Christmas Phone Cases</a></h3>
      <p>${items.length} festive glass cases, made for your exact phone.</p>
      <div class="price">${SALE.on ? `<span class="was">${rupee(was)}</span> ` : ""}<span class="now">From ${rupee(from)}</span></div>
      <a class="buy" href="${href}">See all designs</a>
    </div>
  </article>`;
}
function casesPage() {
  const items = PRODUCTS.filter(p => p.collection === "cases"), url = `${BASE}/cases/`;
  const desc = `${items.length} Christmas glass phone cases: Santa, gnomes, reindeer, snow globes, trees and patterns. Made to order for your exact iPhone, Galaxy or OnePlus model. Delivered across Karnataka.`;
  const jsonld = [{"@context":"https://schema.org","@type":"CollectionPage","name":"Christmas Phone Cases","url":url,"description":desc,
    "mainEntity":{"@type":"ItemList","itemListElement":items.map((p,i)=>({"@type":"ListItem","position":i+1,"url":`${BASE}/products/${p.slug}.html`,"name":p.name}))}},
    {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Shop","item":BASE+"/"},{"@type":"ListItem","position":2,"name":"Christmas Phone Cases","item":url}]}];
  const lead = items.find(p => p.slug.startsWith("jolly-santa")) || items[0];
  return `${head({title:"Christmas Phone Cases | Glass Cases for iPhone, Galaxy & OnePlus | Nevervoid Store", desc, url, image:`${BASE}/images/share/${lead.slug}.jpg`, root:"../", jsonld})}
<body>
${header("../","shop")}
<main class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Shop</a> › <span>Christmas Phone Cases</span></nav>
  <section class="cases-hero">
    <span class="eyebrow">Christmas phone cases</span>
    <h1>${items.length} festive glass cases, <em>made for your phone</em></h1>
    <p class="lead">Glossy glass cases, printed to order for your exact model: iPhone 11 to iPhone 17, Galaxy S22 to S25 and OnePlus 11 and 12. Pick a design, choose your phone, and we'll make it.</p>
    <div class="ini-price">${SALE.on ? `<s>${rupee(lead.price)}</s> ` : ""}<b>${rupee(salePrice(lead))}</b>${SALE.on ? ` <span>${SALE.label} · ${SALE.pct}% off</span>` : ""}</div>
  </section>
  <div class="grid">${items.map(p => card(p, "../")).join("\n")}</div>
</main>
${footer("../")}`;
}
function initialsCard(root) {
  const items = INITIALS(); if (!items.length) return "";
  const lead = items[0], href = `${root}initials/`;
  const from = Math.min(...items.map(salePrice)), was = Math.min(...items.map(p => p.price));
  return `<article class="card coll-card" data-cat="christmas" data-type="mug">
    <a class="stage christmas ph" href="${href}" aria-label="Christmas Initial Mugs">${SALE.on ? `<span class="fx-badge">−${SALE.pct}%</span>` : ""}<img class="photo" src="/images/mugs/${lead.slug}-${lead.view}.webp" alt="Christmas Initial Mugs" width="620" height="620" loading="lazy"><span class="coll-letters" aria-hidden="true">A–Z</span></a>
    <div class="info">
      <div class="tags"><span class="tag">Collection</span></div>
      <h3><a href="${href}">Christmas Initial Mugs</a></h3>
      <p>Their first letter in a Santa hat. Pick a letter A to Z.</p>
      <div class="price">${SALE.on ? `<span class="was">${rupee(was)}</span> ` : ""}<span class="now">From ${rupee(from)}</span></div>
      <a class="buy" href="${href}">Find your letter</a>
    </div>
  </article>`;
}
function initialsPage(letter) {
  const items = INITIALS(), have = Object.fromEntries(items.map(p => [p.letter, p]));
  const cur = (letter && have[letter]) || items[0], root = letter ? "../../" : "../";
  const pageUrl = L => `${BASE}/initials/${L.toLowerCase()}/`;
  const url = letter ? pageUrl(cur.letter) : `${BASE}/initials/`, wa = POL.CONTACT.whatsapp;
  const data = Object.fromEntries(items.map(p => [p.letter, { slug: p.slug, name: p.name, id: p.id, view: p.view, alt: p.alt, start: p.view === "a" ? "3.1416" : "0" }]));
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(L => have[L]
    ? `<a class="lt ok${L === cur.letter ? " on" : ""}" href="/initials/${L.toLowerCase()}/" data-letter="${L}" aria-current="${L === cur.letter ? "true" : "false"}" aria-label="Letter ${L}">${L}</a>`
    : `<span class="lt soon" aria-label="Letter ${L}, coming soon" title="Coming soon">${L}</span>`).join("");
  const desc = letter ? `A Christmas mug with a big festive letter ${cur.letter} in a Santa hat, printed on both sides. ${SALE.on ? rupee(salePrice(cur)) + " in the Christmas Sale. " : ""}Made to order, delivered across Karnataka.`
                      : "Christmas mugs with a big festive initial in a Santa hat, printed on both sides. Choose your letter and order. Made to order, delivered across Karnataka.";
  const title = letter ? `${cur.name} | Christmas Initial Mugs | Nevervoid Store` : "Christmas Initial Mugs A–Z | Personalised Letter Mugs | Nevervoid Store";
  const jsonld = [{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Shop","item":BASE+"/"},{"@type":"ListItem","position":2,"name":"Christmas Initial Mugs","item":`${BASE}/initials/`}].concat(letter ? [{"@type":"ListItem","position":3,"name":cur.name,"item":url}] : [])}];
  const askUrl = `https://wa.me/${wa}?text=${encodeURIComponent("Hi Antony, I'd like the Christmas initial mug with the letter ")}`;
  const shareText = L => `${have[L].name} · ${SALE.on ? rupee(salePrice(have[L])) + " in the Christmas Sale" : rupee(have[L].price)} at NevervoidStore`;
  const p = cur;
  return `${head({title, desc, url, image:`${BASE}/images/share/${cur.slug}.jpg`, root, jsonld})}
<body>
${header(root,"shop")}
<main class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${root}index.html">Shop</a> › <a href="/initials/">Christmas Initial Mugs</a></nav>
  <section class="pdp ini-grid">
    <div class="ini-title">
      <div class="tags"><span class="tag">Christmas · Initial mug</span></div>
      <h1 id="ini-name">${esc(cur.name)}</h1>
      ${priceHtml(cur,"pprice")}${SALE.on ? `<div class="save">You save ${rupee(cur.price - salePrice(cur))} · ${SALE.label} ends 25 Dec</div>` : ""}
    </div>
    <div class="gal-col ini-gal">
      <div class="gallery christmas ph" role="img" aria-label="${esc(p.name)} photo">${SALE.on ? `<span class="fx-badge big">−${SALE.pct}%</span>` : ""}<img id="pimg" class="photo" src="/images/mugs/${p.slug}-${p.view}.webp" alt="${esc(p.name)}" width="620" height="620"><div id="m3d" class="m3d" hidden data-wrap="/images/mugs/${p.slug}-wrap.webp" data-start="${p.view === "a" ? "3.1416" : "0"}"><span class="m3d-side" aria-live="polite"></span><span class="m3d-note">Illustration only · sides shown for a right-hand hold</span></div></div>
      <div class="views" role="group" aria-label="Mug views"><button type="button" class="view on" data-src="/images/mugs/${p.slug}-${p.view}.webp"><img src="/images/mugs/${p.slug}-${p.view}.webp" alt="" loading="lazy"><span>Handle right</span></button><button type="button" class="view" data-src="/images/mugs/${p.slug}-${p.alt}.webp"><img src="/images/mugs/${p.slug}-${p.alt}.webp" alt="" loading="lazy"><span>Handle left</span></button><button type="button" class="view v360" data-spin="1" aria-label="3D preview of the design"><svg viewBox="0 0 52 52" aria-hidden="true"><ellipse cx="26" cy="26" rx="19" ry="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M38 17l7 3-5 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="26" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" font-family="DM Sans,sans-serif">3D</text></svg><span>3D preview</span></button></div>
      <div class="ini-pick">
        <div class="pick-head"><b>Choose a letter</b><span id="ini-chosen">Showing ${cur.letter}</span></div>
        <div class="letters" role="group" aria-label="Choose a letter">${letters}</div>
        ${items.length < 26 ? `<p class="pick-note">Greyed-out letters are coming soon. Need one now? <a href="${askUrl}" target="_blank" rel="noopener">Ask on WhatsApp</a></p>` : ""}
      </div>
    </div>
    <div class="ini-buy">
      <div class="pnote">Made to order · delivering across Karnataka</div>
      <div class="share"><button type="button" class="share-btn" data-share-url="${pageUrl(cur.letter)}" data-share-title="${esc(cur.name)}" data-share-text="${esc(shareText(cur.letter))}" aria-haspopup="true"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" fill="none" stroke="currentColor" stroke-width="2"/></svg><span>Share</span></button><div class="share-menu" hidden role="menu"><a role="menuitem" data-net="wa" target="_blank" rel="noopener">WhatsApp</a><a role="menuitem" data-net="fb" target="_blank" rel="noopener">Facebook</a><a role="menuitem" data-net="x" target="_blank" rel="noopener">X</a><button type="button" role="menuitem" data-net="copy">Copy link</button></div></div>
      <p class="lead">A big festive initial in a Santa hat, strung with fairy lights, with a snowman, gifts and holly. Printed on both sides of an 11oz ceramic mug, so the letter faces you and whoever sits opposite.</p>
      <div class="buybox">
      ${orderBlock(cur)}
      </div>
    </div>
  </section>
  <figure class="flat-wrap ini-flat"><img src="/images/mugs/${p.slug}-flat.webp" alt="Full wrap design for the ${esc(p.name)}" loading="lazy"><figcaption>The full design, as it wraps around the mug. The NevervoidStore watermark is only on this online preview, not on your mug.</figcaption></figure>
</main>
${footer(root)}
<script>
(function(){
  var D = ${JSON.stringify(data)}, T = ${JSON.stringify(Object.fromEntries(items.map(i => [i.letter, shareText(i.letter)])))}, BASE = ${JSON.stringify(BASE)};
  function pick(L){
    var d = D[L]; if (!d) return;
    document.querySelectorAll(".letters .lt.ok").forEach(function(b){ var on = b.dataset.letter === L; b.classList.toggle("on", on); b.setAttribute("aria-current", on ? "true" : "false"); });
    document.getElementById("ini-name").textContent = d.name;
    document.getElementById("ini-chosen").textContent = "Showing " + L;
    document.title = d.name + " | Christmas Initial Mugs | Nevervoid Store";
    var img = document.getElementById("pimg"), views = document.querySelectorAll(".views .view:not(.v360)");
    var srcs = ["/images/mugs/" + d.slug + "-" + d.view + ".webp", "/images/mugs/" + d.slug + "-" + d.alt + ".webp"];
    views.forEach(function(v, i){ v.dataset.src = srcs[i]; var t = v.querySelector("img"); if (t) t.src = srcs[i]; });
    var on = document.querySelector(".views .view.on"), onIdx = Array.prototype.indexOf.call(views, on);
    if (img) { img.classList.add("swap"); img.src = srcs[onIdx >= 0 ? onIdx : 0]; img.onload = function(){ img.classList.remove("swap"); }; }
    var flat = document.querySelector(".ini-flat img"); if (flat) flat.src = "/images/mugs/" + d.slug + "-flat.webp";
    var box = document.getElementById("m3d");
    if (box) { box.dataset.wrap = "/images/mugs/" + d.slug + "-wrap.webp"; box.dataset.start = d.start;
      if (box._m) { box._m.destroy(); box._m = null; if (!box.hidden) { var b3 = document.querySelector(".views .v360"); if (b3) b3.click(); } } }
    document.querySelectorAll(".buybox [data-order], .buybox [data-ask]").forEach(function(b){ b.dataset.name = d.name; if (b.dataset.id) b.dataset.id = d.id; });
    var sb = document.querySelector(".share-btn"), u = BASE + "/initials/" + L.toLowerCase() + "/";
    if (sb) { sb.dataset.shareUrl = u; sb.dataset.shareTitle = d.name; sb.dataset.shareText = T[L];
      var m = sb.nextElementSibling, e = encodeURIComponent;
      m.querySelector('[data-net="wa"]').href = "https://wa.me/?text=" + e(T[L] + " " + u);
      m.querySelector('[data-net="fb"]').href = "https://www.facebook.com/sharer/sharer.php?u=" + e(u);
      m.querySelector('[data-net="x"]').href = "https://twitter.com/intent/tweet?text=" + e(T[L]) + "&url=" + e(u); }
    history.replaceState(null, "", "/initials/" + L.toLowerCase() + "/");
    var g = document.querySelector(".ini-gal .gallery"), r = g.getBoundingClientRect();
    if (r.top < 70 || r.top > window.innerHeight * 0.5) window.scrollTo({ top: window.scrollY + r.top - 80, behavior: "smooth" });
  }
  document.querySelectorAll(".letters .lt.ok").forEach(function(b){ b.addEventListener("click", function(ev){ ev.preventDefault(); pick(b.dataset.letter); }); });
  var q = (location.search.match(/letter=([A-Za-z])/) || [])[1]; if (q) pick(q.toUpperCase());
})();
</script>`;
}

// Meta Pixel: loads only when an ID is configured; window.nvTrack is always defined so pages can call it safely
function metaHead() {
  const id = String(POL.CONTACT.metaPixel || "").replace(/\D/g, ""), dv = POL.CONTACT.metaDomainVerify || "";
  return (dv ? `<meta name="facebook-domain-verification" content="${esc(dv)}">\n` : "") + (id ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');window.nvTrack=function(e,p){try{fbq('track',e,p||{})}catch(x){}};</script>` : `<script>window.nvTrack=function(){};</script>`);
}
function thankYouPage() {
  const wa = POL.CONTACT.whatsapp;
  return `${head({title:"Thank you for your order | Nevervoid Store", desc:"Your NevervoidStore order is confirmed.", url:`${BASE}/thank-you.html`, image:`${BASE}/images/og-home.jpg`})}
<meta name="robots" content="noindex">
<body>
${header("","shop")}
<main class="wrap ty">
  <div class="ty-card">
    <div class="ty-tick" aria-hidden="true">✓</div>
    <h1>Thank you! Your order is in.</h1>
    <p class="lead">We've received your payment. Razorpay has sent the receipt to your phone and email.</p>
    <div id="ty-sum" class="co-sum" hidden></div>
    <ol class="ty-steps">
      <li><b>Today:</b> we check your design and details. If anything needs confirming, we'll WhatsApp you.</li>
      <li><b>1–2 days:</b> your item is printed to order.</li>
      <li><b>About 5–7 days:</b> delivered to your door, with tracking shared on WhatsApp.</li>
    </ol>
    <a class="buy ty-wa" id="ty-wa" href="https://wa.me/${wa}" target="_blank" rel="noopener">Message us on WhatsApp</a>
    <a class="ty-back" href="/">Continue shopping</a>
    <p class="ty-note">Anything arrives damaged? Send a photo within 48 hours and we'll replace it free. <a href="/policies/returns.html">Replacement policy</a></p>
  </div>
</main>
${footer("")}
<script>
(function(){ try {
  var o = JSON.parse(localStorage.getItem("nv_last") || "null"); if (!o || Date.now() - o.at > 3 * 864e5) return;
  if (!o.tracked && /[?&](paid=1|razorpay_payment_id=)/.test(location.search)) { window.nvTrack("Purchase", { value: Number(o.price) || 0, currency: "INR", content_name: o.name }); o.tracked = 1; localStorage.setItem("nv_last", JSON.stringify(o)); }
  var el = document.getElementById("ty-sum"), e = function(t){ return String(t).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); };
  el.innerHTML = (o.pic ? '<img src="' + e(o.pic) + '" alt="">' : "") + "<div><b>" + e(o.name) + "</b>" + (o.model ? "<span>" + e(o.model) + "</span>" : "") + '<div class="co-price"><b>₹' + Number(o.price).toLocaleString("en-IN") + "</b></div></div>";
  el.hidden = false;
  document.getElementById("ty-wa").href = "https://wa.me/${wa}?text=" + encodeURIComponent("Hi Antony! I just paid for " + o.name + (o.model ? " (" + o.model + ")" : "") + ". Please confirm my order.");
} catch (x) {} })();
</script>`;
}

function customMugPage(join) {
  const cp = PRODUCTS.find(p => p.id === "mug-custom"), price = salePrice(cp), url = `${BASE}/custom-mug/`;
  const desc = "Design a personalised name mug: type a name, pick 4 things that describe them, see your mug instantly. Made to order, delivered across Karnataka. Perfect for team gifts.";
  const traits = fs.readFileSync(path.join(SRC, "custommug", "traits.json"), "utf8");
  const themes = [["classic","Christmas Classic","#c41826","#1c603a"],["navy","Navy & Gold","#162c54","#b88c3c"],["sage","Charcoal & Sage","#2b2f33","#6e8c78"],["rose","Rose","#a8445e","#c9877a"]];
  const jsonld = [{"@context":"https://schema.org","@type":"Product","name":"Personalised Name Mug","description":desc,"image":`${BASE}/images/custom-name-mug.jpg`,"brand":{"@type":"Brand","name":"NevervoidStore"},
    "offers":{"@type":"Offer","priceCurrency":"INR","price":String(price),"availability":"https://schema.org/MadeToOrder","url":url}}];
  return `${join ? head({title:"Design your team mug | Nevervoid Store", desc:"Design your own name mug for your team gift.", url:`${BASE}/team/join/`, image:`${BASE}/images/custom-name-mug.jpg`, root:"../../"}) + '\n<meta name="robots" content="noindex">' : head({title:"Personalised Name Mug: Design Your Own | Nevervoid Store", desc, url, image:`${BASE}/images/custom-name-mug.jpg`, root:"../", jsonld})}
<body>
${header(join ? "../../" : "../","shop")}
<main class="wrap cm">
  ${join ? `<section class="cm-hero"><span class="eyebrow">Team gift</span><h1>Design your mug for <em id="cm-join-co">your team</em></h1>
    <p class="lead">Type your name, pick 4 things that describe you (or write a short message) and submit. That’s it: your organiser takes care of the rest, and you don’t pay anything.</p>
    <p id="cm-join-back" class="cm-ok" hidden>You’ve already sent a design. Change anything and submit again to update it.</p></section>` : `<nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Shop</a> › <span>Personalised name mug</span></nav>
  <section class="cm-hero"><span class="eyebrow">Design your own</span><h1>A mug that’s <em>all about them</em></h1>
    <p class="lead">Type a name, pick 4 things that describe them, and watch the mug design itself. Approve it, order it, and we print it for you.</p></section>`}
  <section class="pdp cm-grid">
    <div class="cm-preview">
      <div class="gallery ph cm-stage"><canvas id="cm-mug" width="620" height="620" aria-label="Your mug preview"></canvas></div>
      <div class="views cm-views"><button type="button" class="view cm-view on" data-v="r"><span>Front (name)</span></button><button type="button" class="view cm-view" data-v="l"><span>Back (monogram)</span></button></div>
      <figure class="flat-wrap"><canvas id="cm-flat" width="1020" height="456"></canvas><figcaption>The full print, as it wraps round the mug.</figcaption></figure>
    </div>
    <div class="cm-form">
      <label class="cm-step"><b>1. ${join ? "Your" : "Their"} name</b><input id="cm-name" maxlength="14" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="e.g. Priya" aria-describedby="cm-name-note cm-name-warn">
        <span id="cm-name-note" class="cm-note">Letters only, 2 to 14 characters (spaces, . ' and - are fine). First names or nicknames look best, and we print it exactly as shown.</span>
        <span id="cm-name-warn" class="cm-warn" aria-live="polite" hidden></span></label>
      <div class="cm-step"${join ? " hidden" : ""}><b>Name style</b><div id="cm-fonts" class="cm-fonts" role="radiogroup" aria-label="Name style"></div></div>
      <div class="cm-step"><b>2. What goes under the name?</b>
        <div class="cm-modes" role="tablist"><button type="button" class="cm-mode on" data-m="traits" role="tab" aria-selected="true">4 things they love</button><button type="button" class="cm-mode" data-m="msg" role="tab" aria-selected="false">A short message</button></div></div>
      <div class="cm-step" id="cm-pane-msg" hidden><label for="cm-msg"><b>Your message</b> <span id="cm-msg-count" class="muted">0/120</span></label>
        <textarea id="cm-msg" rows="3" maxlength="120" placeholder="e.g. To the best manager. Thank you for an amazing 2026!"></textarea>
        <p class="muted cm-small">Up to 120 characters. Letters, numbers and simple punctuation.</p></div>
      <div class="cm-step" id="cm-pane-traits"><b>Pick 4 things that describe ${join ? "you" : "them"}</b> <span id="cm-count" class="muted">0 of 4 chosen</span>
        <div class="cm-own"><input id="cm-own" maxlength="18" autocomplete="off" placeholder="Or type your own (1–2 words), e.g. Yoga" aria-label="Type your own"><button id="cm-own-add" type="button">Add</button></div><div id="cm-traits" class="cm-chips" role="group" aria-label="Things that describe them"></div></div>
      <div class="cm-step"${join ? " hidden" : ""}><b>3. Style</b><div class="cm-themes">${themes.map((t,i)=>`<label class="cm-theme"><input type="radio" name="cm-theme" value="${t[0]}"${i?"":" checked"}><span><i style="background:${t[2]}"></i><i style="background:${t[3]}"></i>${t[1]}</span></label>`).join("")}</div></div>
      <div class="cm-step"${join ? " hidden" : ""}><b>Mug colour</b> <span id="cm-color-name" class="muted">White</span><div id="cm-colors" class="cm-colors" role="radiogroup" aria-label="Mug colour"></div><span class="cm-note">The handle and the inside take the colour; the printed area stays white.</span></div>
      <p id="cm-hint" class="cm-hint" aria-live="polite">Type a name to start.</p>
      <div class="cm-actions"><button id="cm-approve" type="button" class="buy" disabled>Approve design</button><button id="cm-reset" type="button" class="ask">Reset</button></div>
      ${join ? `<div id="cm-joined" class="cm-ok tm-joined" hidden><span id="cm-joined-msg"></span> <button id="cm-again" type="button" class="linkbtn">Change my design</button></div>` : ""}
      <div id="cm-order" class="buybox" hidden>
        <p class="cm-ok">✓ Design approved: <span id="cm-summary"></span></p>
        <div class="pprice"><span class="was">${rupee(cp.price)}</span> <span class="now">${rupee(price)}</span></div>
        <label class="field">Delivery pincode <span class="hint">(Karnataka only for now)</span><input class="pin" type="text" inputmode="numeric" maxlength="6" placeholder="e.g. 560001" autocomplete="postal-code"></label>
        <div class="pin-msg" hidden></div>
        <button class="buy" type="button" data-order data-nobar data-rzp="custom_pet_mug" data-id="mug-name" data-name="Custom Name Mug" data-price="${price}">Order now · ${rupee(price)}</button>
        <img id="pimg" alt="" hidden>
        <p class="pnote">We print exactly the design you approved. 11oz white ceramic mug, made to order.</p>
      </div>
      ${join ? "" : `<div class="cm-team"><b>Gifting a whole team?</b> Paste your team list and see every person's mug at once, from ₹319 a mug. <a href="../team/">Make team mugs →</a></div>`}
    </div>
  </section>
</main>
${footer("../")}
<script>window.NV_TRAITS = ${traits};${join ? ` window.NV_JOIN = {api:${JSON.stringify(TEAM_API)}, t:new URLSearchParams(location.search).get("t")};` : ""}</script>
<script defer src="/assets/mugdesign.js"></script>
<script defer src="/assets/custom-mug.js"></script>`;
}
function teamPage() {
  const cp = PRODUCTS.find(p => p.id === "mug-custom"), url = `${BASE}/team/`;
  const desc = "Name mugs for your whole team: paste or upload your list, see a real preview of every person's mug, and get one quote. From ₹319 a mug, delivered across Karnataka.";
  const traits = fs.readFileSync(path.join(SRC, "custommug", "traits.json"), "utf8");
  const themes = [["classic","Christmas Classic","#c41826","#1c603a"],["navy","Navy & Gold","#162c54","#b88c3c"],["sage","Charcoal & Sage","#2b2f33","#6e8c78"],["rose","Rose","#a8445e","#c9877a"]];
  const cfg = {tiers:[[25,379],[50,349],[100,319]], small: salePrice(cp), wa: POL.CONTACT.whatsapp, api: TEAM_API};
  return `${head({title:"Team Name Mugs: Every Employee's Own Mug | Nevervoid Store", desc, url, image:`${BASE}/images/custom-name-mug.jpg`, root:"../"})}
<body>
${header("../","shop")}
<main class="wrap cm tm">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Shop</a> › <a href="../corporate.html">Corporate gifting</a> › <span>Team name mugs</span></nav>
  <section class="cm-hero"><span class="eyebrow">For teams</span><h1>Every person gets <em>their own mug</em></h1>
    <p class="lead">Paste your team list or upload a spreadsheet. You'll see a real preview of every single mug, then send it all to us in one tap for a quote. No checkout per person.</p></section>
  ${TEAM_API ? `<section class="tm-collect" id="tm-collect">
    <div id="tm-c-intro"><b>Rather let everyone design their own?</b> Get one link to share with your team. Each person designs their own mug, you see them all here, and you pay once.
      <button id="tm-c-start" type="button" class="linkbtn">Get a team link →</button></div>
    <div id="tm-c-form" hidden>
      <div class="tm-fields"><label class="field">Company<input id="tm-c-co" autocomplete="organization" placeholder="e.g. Acme Labs"></label><label class="field">Your name<input id="tm-c-who" autocomplete="name" placeholder="e.g. Kavya"></label>
      <label class="field">Your WhatsApp number<input id="tm-c-ph" inputmode="tel" autocomplete="tel" placeholder="e.g. 98765 43210"></label>
      <div class="field"><span>Style</span><span class="muted" style="font-weight:400">Everyone's mug uses the style you pick in step 1 below.</span></div></div>
      <p id="tm-c-hint" class="cm-hint" aria-live="polite"></p>
      <button id="tm-c-create" type="button" class="buy">Create team link</button></div>
    <div id="tm-c-live" hidden>
      <p class="tm-c-head"><b id="tm-c-title">Your team link</b> <span id="tm-c-count" class="tm-own-tag"></span> <span id="tm-c-state" class="muted"></span></p>
      <label class="field">Share this with your team<div class="tm-c-row"><input id="tm-c-join" readonly><button type="button" class="ask" data-copy="#tm-c-join">Copy</button><a id="tm-c-wa" class="ask" target="_blank" rel="noopener">WhatsApp</a></div></label>
      <label class="field">Your private page to see everyone's mugs (bookmark it, don't share it)<div class="tm-c-row"><input id="tm-c-dash" readonly><button type="button" class="ask" data-copy="#tm-c-dash">Copy</button></div></label>
      <div class="tm-more"><button id="tm-c-refresh" type="button" class="linkbtn">Refresh the list</button><button id="tm-c-toggle" type="button" class="linkbtn">Stop collecting</button></div>
      <p id="tm-c-msg" class="cm-hint" aria-live="polite"></p></div>
  </section>` : ""}
  <div id="tm-shared" class="cm-ok tm-shared" hidden>✓ This is a saved team order. Every mug below is exactly what we'll print.</div>
  <section class="tm-setup">
    <div class="tm-col">
      <div class="cm-step"><b>1. Style for the whole team</b><div class="cm-themes">${themes.map((t,i)=>`<label class="cm-theme"><input type="radio" name="tm-theme" value="${t[0]}"${i?"":" checked"}><span><i style="background:${t[2]}"></i><i style="background:${t[3]}"></i>${t[1]}</span></label>`).join("")}</div></div>
      <div class="cm-step"><b>Name style</b><div id="tm-fonts" class="cm-fonts" role="radiogroup" aria-label="Name style"></div></div>
      <div class="cm-step"><b>Mug colour</b> <span id="tm-color-name" class="muted">White</span><div id="tm-colors" class="cm-colors" role="radiogroup" aria-label="Mug colour"></div><span class="cm-note">The handle and the inside take the colour; the printed area stays white.</span></div>
      <div class="cm-step"><b>2. Under every name</b>
        <div class="cm-modes" role="tablist"><button type="button" class="cm-mode tm-mode on" data-m="traits" role="tab" aria-selected="true">4 things</button><button type="button" class="cm-mode tm-mode" data-m="msg" role="tab" aria-selected="false">A message</button></div>
        <p class="muted cm-small">This goes on everyone's mug. Anyone can have their own instead (see the list).</p></div>
      <div class="cm-step" id="tm-pane-traits"><b>The team's 4 things</b> <span id="tm-count" class="muted">0 of 4 chosen</span>
        <div class="cm-own"><input id="tm-own" maxlength="18" autocomplete="off" placeholder="Or type your own, e.g. Team player" aria-label="Type your own"><button id="tm-own-add" type="button">Add</button></div>
        <p id="tm-def-hint" class="cm-hint" aria-live="polite"></p>
        <div id="tm-traits" class="cm-chips tm-chips" role="group" aria-label="The team's 4 things"></div></div>
      <div class="cm-step" id="tm-pane-msg" hidden><label for="tm-msg"><b>The team's message</b> <span id="tm-msg-count" class="muted">0/120</span></label>
        <textarea id="tm-msg" rows="3" maxlength="120" placeholder="e.g. Thank you for an amazing 2026!"></textarea></div>
    </div>
    <div class="tm-col">
      <div class="cm-step"><label for="tm-list"><b>3. Your team, one person per line</b></label>
        <textarea id="tm-list" rows="9" spellcheck="false" placeholder="Priya
Rahul, Cricket, Coffee lover, Music lover, Traveller
Anita: Thank you for an amazing year!"></textarea>
        <div class="tm-howto"><span><b>Priya</b> gets the team's 4 things</span><span><b>Rahul, Cricket, …</b> gets his own 4</span><span><b>Anita: message</b> gets her own message</span></div>
        <div class="tm-files"><label class="ask tm-up">Upload Excel or CSV<input id="tm-file" type="file" accept=".xlsx,.csv,text/csv" hidden></label><a class="tm-tpl" href="/assets/team-template.xlsx" download>Download the Excel template</a></div>
        <p class="muted cm-small">You can also copy the columns straight from Excel or Google Sheets and paste them here.</p>
        <p id="tm-list-hint" class="cm-hint" aria-live="polite"></p></div>
    </div>
  </section>
  <section class="tm-results">
    <div id="tm-empty" class="tm-empty">Your mugs will appear here as you type names.</div>
    <div id="tm-sum" class="tm-sum" hidden>
      <div class="tm-sum-top"><div><b id="tm-n"></b> · <span id="tm-each"></span><small id="tm-tier"></small></div><div class="tm-total"><span>Estimated total</span><b id="tm-total"></b><small>plus delivery</small></div></div>
      <p id="tm-bad" class="tm-badmsg" hidden></p>
      <p id="tm-progress" class="muted cm-small" aria-live="polite"></p>
    </div>
    <div id="tm-grid" class="tm-grid" aria-live="polite"></div>
  </section>
  <section class="tm-send-box" id="tm-quote">
    <h2>4. Get your quote</h2>
    <p class="muted">We reply on WhatsApp with the final price and one payment link for the whole order. Nothing is printed until you approve.</p>
    <div class="tm-fields">
      <label class="field">Company<input id="tm-co" autocomplete="organization" placeholder="e.g. Acme Labs"></label>
      <label class="field">Your name<input id="tm-who" autocomplete="name" placeholder="e.g. Kavya"></label>
      <div class="field tm-ship"><span>Delivery</span><label><input type="radio" name="tm-ship" value="office" checked> To one office</label><label><input type="radio" name="tm-ship" value="homes"> To each person's home</label></div>
      <label class="field">Office pincode <span class="hint">(Karnataka)</span><input id="tm-pin" inputmode="numeric" maxlength="6" placeholder="e.g. 560001" autocomplete="postal-code"></label>
      <label class="field">Needed by <span class="hint">(optional)</span><input id="tm-when" type="date"></label>
    </div>
    <p id="tm-send-hint" class="cm-hint" aria-live="polite"></p>
    <div class="cm-actions"><button id="tm-send" type="button" class="buy" disabled>Send for a quote on WhatsApp</button></div>
    <div class="tm-more"><button id="tm-copy" type="button" class="linkbtn">Copy a link to these mugs</button><button id="tm-csv" type="button" class="linkbtn">Download the list</button></div>
    <div id="tm-admin" class="tm-admin" hidden><b>Owner tools</b><button id="tm-zip" type="button" class="buy">Download all print files (.zip)</button><p class="muted cm-small">2550 × 1140 PNG per person, numbered, with list.csv. Upload each to Printrove.</p></div>
  </section>
  <section class="tm-faq">
    <details><summary>How does payment work?</summary><p>We confirm the price on WhatsApp and send one payment link for the whole order. Teams of 25 or more pay team prices: ₹379 a mug for 25–49, ₹349 for 50–99 and ₹319 for 100+.</p></details>
    <details><summary>Can I change names after sending?</summary><p>Yes. Edit the list here and send again, or just tell us on WhatsApp. We print only after you approve the final list.</p></details>
    <details><summary>Fewer than 25 people?</summary><p>You can still use this page. Under 25 mugs we charge our regular price of ${rupee(salePrice(cp))} a mug, or each person can <a href="../custom-mug/">design their own</a>.</p></details>
  </section>
</main>
${footer("../")}
<script>window.NV_TRAITS = ${traits}; window.NV_TEAM = ${JSON.stringify(cfg)};</script>
<script defer src="/assets/mugdesign.js"></script>
<script defer src="/assets/team.js"></script>`;
}
// ---------- Send a Wish ----------
const WISH_OCC = JSON.parse(fs.readFileSync(path.join(SRC, "wish", "occasions.json"), "utf8"));
const WISH_PATH = "send-a-wish-custom-mug";      // nevervoidstore.com/send-a-wish-custom-mug/<occasion>/
const WISH_DEFAULT = "christmas";               // occasion the main page opens on (seasonal)
function wishPage(start) {
  const o = start ? WISH_OCC[start] : null, cp = PRODUCTS.find(p => p.id === "mug-custom"), price = salePrice(cp);
  const rel = start ? "../../" : "../", url = `${BASE}/${WISH_PATH}/${start ? WISH_OCC[start].seo.slug + "/" : ""}`;
  const title = o ? `${o.seo.title} | Send a Wish | Nevervoid Store` : "Send a Wish: Custom Mug with Your Own Message | Nevervoid Store";
  const desc = o ? o.seo.desc : "Send a wish on a custom mug: write your own message for a birthday, anniversary, Mom, Dad, a friend, thank you or Christmas, add your name, pick a design. Delivered across Karnataka.";
  const jsonld = [{"@context":"https://schema.org","@type":"Product","name": o ? o.seo.title : "Send a Wish Custom Mug","description":desc,"image":`${BASE}/images/send-a-wish.jpg`,"brand":{"@type":"Brand","name":"NevervoidStore"},
    "offers":{"@type":"Offer","priceCurrency":"INR","price":String(price),"availability":"https://schema.org/MadeToOrder","url":url}}];
  const first = start || WISH_DEFAULT;
  return `${head({title, desc, url, image:`${BASE}/images/send-a-wish.jpg`, root:rel, jsonld})}
<body>
${header(rel,"shop")}
<main class="wrap cm sw">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${rel}index.html">Shop</a> › ${o ? `<a href="/${WISH_PATH}/">Send a Wish</a> › <span>${o.label}</span>` : "<span>Send a Wish</span>"}</nav>
  <section class="sw-hero"><span class="eyebrow">${o ? esc(o.seo.h1) : "A custom mug with your own wish"}</span><h1>Send a Wish</h1>
    <p class="lead">Write your own wish for someone special, add your name and pick a design. We print it on a mug. Don’t just send a gift, send a wish made by you.</p></section>
  <div class="cm-grid sw-grid">
    <div class="cm-preview sw-stage">
      <canvas id="w-mug" width="620" height="620" aria-label="Live preview of your mug"></canvas>
      <div class="cm-views" role="group" aria-label="Mug side"><button type="button" class="cm-view on" data-v="r">Wish side</button><button type="button" class="cm-view" data-v="l">Design side</button></div>
      <p class="sw-note">Live preview on our real mug. Shown for a right-hand hold: the wish faces whoever drinks from it.</p>
    </div>
    <div class="cm-panel sw-panel">
      <div class="cm-step"><b>Occasion</b><div class="sw-occ" role="tablist" aria-label="Occasion">${Object.entries(WISH_OCC).map(([k,x])=>`<a class="sw-occ-chip${k===first?" on":""}" data-o="${k}" role="tab" aria-selected="${k===first}" href="/${WISH_PATH}/${x.seo.slug}/">${esc(x.label)}</a>`).join("")}</div></div>
      <label class="cm-step" for="w-wish"><b>1. Your wish</b> <span id="w-count" class="muted">0/100</span>
        <textarea id="w-wish" rows="3" maxlength="100" placeholder="${esc(WISH_OCC[first].def)}" aria-describedby="w-wish-note"></textarea>
        <span id="w-wish-note" class="cm-note">Up to 100 characters. Use the recipient’s name or how you call them, e.g. Amma, Appa, Priya.</span>
        <span id="w-wish-warn" class="cm-warn" aria-live="polite" hidden></span></label>
      <div class="sw-sugg" id="w-sugg" aria-label="Wish ideas"></div>
      <label class="cm-step" for="w-by"><b>2. By (your name)</b>
        <input id="w-by" maxlength="20" autocomplete="given-name" placeholder="Your name" aria-describedby="w-by-note">
        <span id="w-by-note" class="cm-note">Shown as “By: your name”. Letters only, 2 to 20 characters.</span>
        <span id="w-by-warn" class="cm-warn" aria-live="polite" hidden></span></label>
      <div class="cm-step"><b>3. Choose a design</b> <span class="muted">for the other side</span>
        <div class="sw-arts" id="w-arts" role="radiogroup" aria-label="Design"></div></div>
      <div class="cm-step"><b>Mug colour</b> <span id="w-color-name" class="muted">White</span><div id="w-colors" class="cm-colors" role="radiogroup" aria-label="Mug colour"></div><span class="cm-note">The handle and the inside take the colour; the design is printed on white.</span></div>
      <p id="w-hint" class="cm-hint" aria-live="polite"></p>
      <div class="buybox sw-buy" id="w-order">
        <label class="field">Delivery pincode <span class="hint">(Karnataka only for now)</span>
          <input class="pin" type="text" inputmode="numeric" maxlength="6" placeholder="e.g. 560001" autocomplete="postal-code"></label>
        <div class="pin-msg" hidden></div>
        <button class="buy sw-cta" type="button" data-order data-rzp="custom_pet_mug" data-id="mug-wish" data-name="Send a Wish Mug" data-price="${price}" disabled>Create My Mug · ${rupee(price)}</button>
        <button class="ask" type="button" data-ask data-name="Send a Wish Mug">Ask a question</button>
        <img id="pimg" alt="" hidden>
      </div>
      <p class="sw-tag">Made personal. Made to be remembered.</p>
      <ul class="checks"><li>We print exactly the wish you see, no edits</li><li>Made to order, delivered across Karnataka in about 5–7 days</li><li>Arrived broken? <a href="${rel}policies/returns.html">Free replacement or refund</a></li></ul>
      <div id="w-admin" hidden><button id="w-dl" type="button" class="ask">Download print file (2550 × 1140)</button></div>
    </div>
  </div>
  <section class="sw-more"><h2>A wish for every occasion</h2><p class="muted">${Object.values(WISH_OCC).map(x=>`<a href="/${WISH_PATH}/${x.seo.slug}/">${esc(x.seo.h1)}</a>`).join(" · ")}</p></section>
</main>
${footer(rel)}
<script>window.NV_WISH = ${JSON.stringify({occ: Object.fromEntries(Object.entries(WISH_OCC).map(([k,x])=>[k,{label:x.label,title:x.title,ink:x.ink,accent:x.accent,gold:x.gold,arts:x.arts,def:x.def,wishes:x.wishes,slug:x.seo.slug}])), start: first, path: WISH_PATH})};</script>
<script defer src="/assets/mugdesign.js"></script>
<script defer src="/assets/wish.js"></script>`;
}
// old address: keep working (design links in past orders) and pass on to the new one
function wishRedirect() {
  const to = `/${WISH_PATH}/`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Send a Wish | Nevervoid Store</title><link rel="canonical" href="${BASE}${to}"><meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${to}"><script>location.replace("${to}" + location.search + location.hash);</script></head><body><a href="${to}">Send a Wish</a></body></html>`;
}
function wishCard(root) {
  const cp = PRODUCTS.find(p => p.id === "mug-custom"), href = `${root}${WISH_PATH}/`;
  return `<article class="card coll-card" data-cat="christmas" data-type="mug">
    <a class="stage ph" href="${href}" aria-label="Send a Wish mug">${SALE.on ? `<span class="fx-badge">−${SALE.pct}%</span>` : ""}<img class="photo" src="/images/send-a-wish.jpg" alt="Send a Wish mug" width="620" height="620" loading="lazy"></a>
    <div class="info"><div class="tags"><span class="tag">Personalised</span></div>
      <h3><a href="${href}">Send a Wish</a></h3><p>Your own wish and name on a mug: birthday, love, Mom, Dad, Christmas and more.</p>
      <div class="price">${SALE.on ? `<span class="was">${rupee(cp.price)}</span> ` : ""}<span class="now">${rupee(salePrice(cp))}</span></div>
      <a class="buy" href="${href}">Write a wish</a></div></article>`;
}
function nameMugCard(root) {
  const cp = PRODUCTS.find(p => p.id === "mug-custom"), href = `${root}custom-mug/`;
  return `<article class="card coll-card" data-cat="christmas pets" data-type="mug">
    <a class="stage ph" href="${href}" aria-label="Personalised name mug">${SALE.on ? `<span class="fx-badge">−${SALE.pct}%</span>` : ""}<img class="photo" src="/images/custom-name-mug.jpg" alt="Personalised name mug" width="620" height="620" loading="lazy"><span class="coll-letters" aria-hidden="true">Design yours</span></a>
    <div class="info"><div class="tags"><span class="tag">Personalised</span></div>
      <h3><a href="${href}">Your Name Mug</a></h3><p>Their name and 4 things they love, designed live.</p>
      <div class="price">${SALE.on ? `<span class="was">${rupee(cp.price)}</span> ` : ""}<span class="now">${rupee(salePrice(cp))}</span></div>
      <a class="buy" href="${href}">Design yours</a></div></article>`;
}
// ---------- CSS ----------
const extraCss = `
.nav{display:flex;gap:8px;align-items:center}
.navlink{font-size:14px;font-weight:500;text-decoration:none;color:var(--muted);padding:0 6px}
.navlink.on{color:var(--ink)}
.ig-icon{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:#fff;color:var(--ink)}
.ig-icon:hover{color:var(--green)}
.ig.corp{background:var(--green);color:#fff;border-color:var(--green)}
.info h3 a{text-decoration:none}
.card .stage{text-decoration:none}
.card .buy{margin-top:6px}
.crumbs{font-size:13px;color:var(--muted);padding:18px 0 0}
.crumbs a{color:var(--muted)}
.pdp{display:grid;grid-template-columns:1.05fr .95fr;gap:40px;padding:22px 0 48px;align-items:start}
.gal-col{position:sticky;top:80px;align-self:start}
.views{display:flex;gap:10px;margin-top:12px}
.views .view{flex:1;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:6px 10px;cursor:pointer;font:inherit;font-size:13px;color:var(--muted)}
.views .view img{width:52px;height:52px;object-fit:contain}
.views .view.on{border-color:var(--green);color:var(--ink);box-shadow:0 0 0 1px var(--green) inset}
.flat-wrap{margin:12px 0 0;background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px}
.flat-wrap img{width:100%;height:auto;display:block;border-radius:8px}
.flat-wrap figcaption{font-size:12.5px;color:var(--muted);margin-top:8px;text-align:center}
.pdp .gallery{position:relative;background:#fff;border:1px solid var(--line);border-radius:24px;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;padding:36px}
.pdp .gallery.christmas{background:radial-gradient(circle at 50% 40%,#fff 0,#f1ebdf 75%)}
.pdp .gallery.pets{background:radial-gradient(circle at 50% 40%,#fff 0,#e9efe4 75%)}
.pdp .gallery svg{height:100%;width:auto;max-width:100%}
.pdp h1{font-family:Fraunces,serif;font-weight:700;font-size:clamp(30px,4vw,42px);line-height:1.08;letter-spacing:-.01em;margin:8px 0 10px}
.pdp .pprice{font-size:26px;font-weight:700;margin-bottom:4px}
.pdp .pnote{font-size:13.5px;color:var(--muted);margin-bottom:16px}
.pdp .lead{font-size:16.5px;color:#36413b;margin-bottom:20px}
.pdp .buybox{display:grid;gap:10px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px}
.field{display:grid;gap:6px;font-size:13.5px;font-weight:700}
.field .hint{font-weight:400;color:var(--muted)}
.pin{font:inherit;font-size:15px;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--cream)}
.pin-msg{font-size:13.5px;line-height:1.5;padding:10px 12px;border-radius:10px;background:#fbeeee;color:#7a1d23}
.pin-msg.ok{background:#e9f2ec;color:#1f4d36}
.pin-msg a{color:inherit;font-weight:700}
.buy.alt-wa{background:#fff;color:var(--ink);border:1px solid var(--line);margin-top:0}
.buy.alt-wa:hover{background:#f4f1ea}
.pay-note{font-size:12.5px;color:var(--muted);text-align:center}
.pdp .buy{font-size:16px;padding:14px}
.checks{list-style:none;display:grid;gap:8px;margin:18px 0 0}
.checks li{font-size:14.5px;display:flex;gap:8px}
.checks li::before{content:"✓";color:var(--green);font-weight:700}
.specs{margin-top:26px;border-top:1px solid var(--line)}
.specs h2,.pdp-steps h2{font-family:Fraunces,serif;font-size:20px;text-align:left;margin:18px 0 10px}
.specs dl{display:grid;grid-template-columns:140px 1fr;gap:8px 14px;font-size:14.5px}
.specs dt{color:var(--muted)}
.pdp-steps ol{padding-left:20px;display:grid;gap:6px;font-size:14.5px;color:#36413b}
.related{padding:10px 0 50px}
.related h2{text-align:left;font-size:26px}
.related .grid{grid-template-columns:repeat(4,1fr)}
.card .stage,.thumb,.post .cover,.pcard .stage{position:relative;overflow:hidden}
.pdp .gallery{overflow:hidden}
.stage img.photo,.gallery img.photo,.thumb img.photo,.cover img.photo{position:absolute;inset:14px;width:calc(100% - 28px);height:calc(100% - 28px);object-fit:contain;display:block}
.pdp .gallery img.photo{inset:28px;width:calc(100% - 56px);height:calc(100% - 56px)}
/* mug photos: image background is pure white, so the frame matches it and the mug fills the frame */
.stage.ph,.gallery.ph,.pdp .gallery.ph{background:#fff}
.stage.ph img.photo,.pdp .gallery.ph img.photo{inset:0;width:100%;height:100%}
.views .view img{background:#fff;border-radius:8px}
.views .view svg{width:52px;height:52px;flex:none;color:var(--green);background:#fff;border-radius:8px}
.gallery img,.stage img,.flat-wrap img,.views img,.m3d canvas{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-user-drag:none}
.share{position:relative;margin:12px 0 16px}
.share-btn{display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid var(--line);color:var(--ink);border-radius:99px;padding:7px 14px;font:inherit;font-size:14px;font-weight:600;cursor:pointer}
.share-btn svg circle{fill:currentColor}
.share-btn:hover{border-color:var(--green);color:var(--green)}
.share-menu{position:absolute;z-index:20;top:calc(100% + 6px);left:0;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.12);padding:6px;display:flex;flex-direction:column;min-width:170px}
.share-menu[hidden]{display:none}
.share-menu a,.share-menu button{display:block;text-align:left;padding:9px 12px;border-radius:8px;color:var(--ink);text-decoration:none;font:inherit;font-size:14px;background:none;border:0;cursor:pointer}
.share-menu a:hover,.share-menu button:hover{background:#f4efe6}
.coll-card .stage{position:relative}
.pdp .gallery.christmas,.pdp .gallery.pets{background:#fff}
#pcanvas{position:absolute;inset:28px;width:calc(100% - 56px);height:calc(100% - 56px);object-fit:contain;animation:pcIn .25s ease}@keyframes pcIn{from{opacity:.4}to{opacity:1}}
.co-wrap{position:fixed;inset:0;z-index:200;pointer-events:none}
.co-wrap.open{pointer-events:auto}
.co-back{position:absolute;inset:0;background:rgba(20,28,24,.45);opacity:0;transition:opacity .25s}
.co-wrap.open .co-back{opacity:1}
.co{position:absolute;left:50%;bottom:0;transform:translate(-50%,105%);width:min(520px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:22px 22px 0 0;padding:22px 20px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px rgba(0,0,0,.18);transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.co-wrap.open .co{transform:translate(-50%,0)}
@media (min-width:700px){.co{top:50%;bottom:auto;border-radius:22px;transform:translate(-50%,-40%);opacity:0;transition:transform .25s,opacity .25s}.co-wrap.open .co{transform:translate(-50%,-50%);opacity:1}}
.co h2{font-family:Fraunces,Georgia,serif;font-size:24px;margin:0 0 14px}
.co-x{position:absolute;right:14px;top:12px;width:36px;height:36px;border-radius:50%;border:0;background:#f3efe7;font-size:22px;cursor:pointer}
.co-sum{display:flex;gap:14px;align-items:center;background:#faf6ef;border:1px solid var(--line);border-radius:14px;padding:10px;margin-bottom:16px}
.co-sum img{width:76px;height:76px;object-fit:contain;background:#fff;border-radius:10px;flex:none}
.co-sum b{display:block;font-size:15px}.co-sum span{display:block;font-size:13px;color:var(--muted)}
.co-price{margin:4px 0 2px}.co-price s{color:var(--muted);font-size:13px}.co-price b{display:inline;color:#a8332f;font-size:18px}
.co-form label{display:block;font-size:13px;font-weight:600;margin:0 0 10px;color:var(--ink)}
.co-form input,.co-form textarea{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:12px;border:1px solid #d8d0c2;border-radius:12px;font:inherit;font-size:16px;background:#fff}
.co-form input:focus,.co-form textarea:focus{outline:2px solid var(--green);border-color:var(--green)}
.co-row{display:grid;grid-template-columns:1.4fr 1fr;gap:10px}
.co-err{background:#fdecea;color:#a8332f;border-radius:10px;padding:9px 12px;font-size:14px;margin:4px 0 10px}
.co-pay{width:100%;margin-top:4px;font-size:16px;padding:15px}
.co-ic{width:18px;height:18px;vertical-align:-3px;fill:currentColor;margin-right:4px}
.co-chips{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 2px}.co-chips i{font-style:normal;font-size:12px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:2px 8px;color:#3a463f}
label small{font-weight:400;color:var(--muted);font-size:11.5px}
.co-trust{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 14px;margin:10px 0 2px;font-size:12px;color:var(--muted)}.co-trust span{display:inline-flex;align-items:center;gap:5px}.co-trust svg{width:16px;height:16px;color:var(--green)}
.co-ways svg{width:16px;height:16px;fill:currentColor;flex:none}
.co-row label small{font-weight:400;color:var(--muted);font-size:11.5px}
.co-ways{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:12px 0 6px}
.co-ways span{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#3a463f;border:1px solid var(--line);border-radius:8px;padding:5px 9px;background:#fff}
.co-note{font-size:12px;color:var(--muted);text-align:center;margin:6px 0 0}
body.co-lock{overflow:hidden}
.buybar{position:fixed;left:0;right:0;bottom:0;z-index:80;display:none;align-items:center;gap:12px;background:#fff;border-top:1px solid var(--line);padding:10px 14px calc(10px + env(safe-area-inset-bottom));box-shadow:0 -6px 20px rgba(0,0,0,.08);transform:translateY(110%);transition:transform .25s}
.buybar.show{transform:none}
.bb-p{display:flex;flex-direction:column;line-height:1.15}.bb-p s{font-size:12px;color:var(--muted)}.bb-p b{font-size:20px;color:#a8332f}.bb-p span{font-size:11px;color:var(--muted)}
.buybar .buy{flex:1;margin:0;padding:14px;font-size:16px}
@media (max-width:860px){.buybar{display:flex}body.has-buybar .wa-wrap{bottom:86px}}
.ty{padding:30px 0 60px}.ty-card{max-width:560px;margin:0 auto;background:#fff;border:1px solid var(--line);border-radius:22px;padding:30px 24px;text-align:center}
.ty-tick{width:64px;height:64px;margin:0 auto 12px;border-radius:50%;background:var(--green);color:#fff;font-size:34px;line-height:64px}
.ty h1{font-family:Fraunces,Georgia,serif;font-size:clamp(26px,4vw,34px);margin:0 0 8px}
.ty .co-sum{text-align:left;margin:18px 0}
.ty-steps{text-align:left;margin:18px 0;padding-left:20px;line-height:1.5}.ty-steps li{margin:8px 0}
.ty-wa{display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;margin-top:8px}
.ty-back{display:block;margin:14px 0 6px;color:var(--green);font-weight:600}
.ty-note{font-size:13px;color:var(--muted)}
.cm-hero{padding:14px 0 18px;max-width:720px}.cm-hero h1{font-family:Fraunces,Georgia,serif;font-size:clamp(30px,4.4vw,48px);line-height:1.06;margin:8px 0 10px}.cm-hero h1 em{color:#a8332f}
.pdp.cm-grid{align-items:start}.cm-grid>*{min-width:0}.cm canvas{max-width:100%}
.cm-own{display:flex;gap:8px;margin-top:10px}.cm-own input{flex:1;min-width:0;padding:12px;font:inherit;font-size:16px;border:1px solid #d8d0c2;border-radius:12px;background:#fff}.cm-own input:focus{outline:2px solid var(--green);border-color:var(--green)}.cm-own button{padding:0 18px;border:0;border-radius:12px;background:var(--green);color:#fff;font:inherit;font-weight:700;cursor:pointer}
.cm-chip.custom{border-style:dashed}.cm-modes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.cm-mode{padding:12px;border:1px solid var(--line);border-radius:12px;background:#fff;font:inherit;font-size:15px;font-weight:600;cursor:pointer;color:var(--ink)}.cm-mode.on{background:var(--green);color:#fff;border-color:var(--green)}
#cm-msg{display:block;width:100%;box-sizing:border-box;margin-top:8px;padding:12px;font:inherit;font-size:16px;border:1px solid #d8d0c2;border-radius:12px;background:#fff;resize:vertical}#cm-msg:focus{outline:2px solid var(--green);border-color:var(--green)}.cm-small{font-size:12px;margin:6px 0 0}.cm-chip.custom.on{border-style:solid}
.cm-stage{padding:0!important;display:flex;align-items:center;justify-content:center;background:#fff}.cm-stage canvas{width:100%;height:auto;display:block}
.cm-views{grid-template-columns:1fr 1fr}.cm-views .view{justify-content:center}
#cm-flat{width:100%;height:auto;display:block;border-radius:10px;border:1px solid var(--line);background:#fff}
.cm-step{display:block;margin:0 0 20px}.cm-step[hidden]{display:none!important}.cm-step>b{font-size:16px}
#cm-name{display:block;width:100%;box-sizing:border-box;margin-top:8px;padding:14px;font:inherit;font-size:20px;border:1px solid #d8d0c2;border-radius:12px;background:#fff}
#cm-name:focus{outline:2px solid var(--green);border-color:var(--green)}
.cm-note{display:block;margin-top:8px;font-size:12.5px;line-height:1.45;color:var(--muted);font-weight:400}
.cm-warn{display:block;margin-top:6px;padding:7px 10px;border-radius:9px;background:#fff6e5;color:#7a5200;font-size:13px;font-weight:600}.cm-warn.bad{background:#fbeeee;color:#a8332f}
.swipe-nav{position:absolute;top:50%;transform:translateY(-50%);z-index:4;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.92);box-shadow:0 2px 10px rgba(0,0,0,.15);color:var(--ink);font-size:20px;line-height:1;cursor:pointer;display:grid;place-items:center}
.swipe-nav.prev{left:10px}.swipe-nav.next{right:10px}
.swipe-pos{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:4;font-size:12px;font-weight:600;background:rgba(255,255,255,.92);padding:4px 10px;border-radius:999px;color:var(--ink);box-shadow:0 1px 6px rgba(0,0,0,.1);white-space:nowrap}
.swipe-hint{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:rgba(20,30,24,.45);color:#fff;font-weight:600;font-size:16px;text-align:center;border-radius:inherit;animation:swh 2.8s ease forwards;pointer-events:none}
.swipe-hint span{display:grid;gap:8px;justify-items:center}.swipe-hint i{font-style:normal;font-size:30px;animation:swx 1.1s ease-in-out 2}
@keyframes swx{0%,100%{transform:translateX(0)}50%{transform:translateX(-26px)}}@keyframes swh{0%,80%{opacity:1}100%{opacity:0}}
[data-swipe]{touch-action:pan-y}[data-swipe].leaving{transition:transform .22s ease,opacity .22s ease;opacity:0}
.mc-row{display:grid;gap:2px;margin:0 0 4px}.mc-head{font-weight:600;font-size:14px}.mc-name{font-weight:400;color:var(--muted);margin-left:4px}@font-face{font-family:NVDancingH;src:url(/assets/fonts/dancing-script-latin-700-normal.woff2) format("woff2");font-weight:700;font-display:swap}
.sw-hero{text-align:center;padding:18px 0 6px}.sw-hero h1{font-family:NVDancingH,cursive;font-weight:700;font-size:clamp(48px,9vw,78px);color:#b3202a;margin:4px 0 6px;line-height:1.05}
.sw-hero .lead{max-width:560px;margin:0 auto}
.sw-stage{background:radial-gradient(120% 90% at 50% 18%,#fffdf8 0,#f6efe3 70%);position:relative}
.sw-stage::before{content:"";position:absolute;top:-16px;left:-12px;width:110px;height:110px;background:url(/assets/wish/holly.svg) no-repeat center/contain;transform:rotate(-14deg);pointer-events:none}
.sw:not(.sw-xmas) .sw-stage::before{display:none}
.sw-stage .cm-views{display:flex;justify-content:center;gap:8px;margin-top:10px}.sw-stage .cm-view{padding:9px 18px;border-radius:999px;border:1px solid #d8d0c2;background:#fff;font:inherit;font-size:14px;font-weight:600;color:var(--ink);cursor:pointer}.sw-stage .cm-view.on{background:var(--green);border-color:var(--green);color:#fff}
.sw-note{font-size:12.5px;color:var(--muted);text-align:center;margin:8px 0 0}
.sw-occ{display:flex;gap:6px;overflow-x:auto;margin-top:8px;padding:2px 2px 6px;scrollbar-width:none;-webkit-overflow-scrolling:touch}.sw-occ::-webkit-scrollbar{display:none}
.sw-occ-chip{flex:none;padding:9px 14px;border-radius:999px;border:1px solid #d8d0c2;background:#fff;color:var(--ink);font-size:14px;font-weight:600;text-decoration:none;white-space:nowrap}.sw-occ-chip.on{background:var(--green);border-color:var(--green);color:#fff}
.sw-art canvas{width:100%;height:auto;aspect-ratio:1;border-radius:10px;display:block}
.sw-more{margin:10px 0 34px;text-align:center}.sw-more h2{font-family:NVDancingH,cursive;color:#b3202a;font-size:34px;margin:0 0 6px}.sw-more a{color:var(--green);font-weight:600}
#w-wish,#w-by{display:block;width:100%;box-sizing:border-box;margin-top:8px;padding:12px 14px;font:inherit;font-size:16px;border:1px solid #d8d0c2;border-radius:12px;background:#fff}
#w-wish{font-family:NVDancingH,cursive;font-size:22px;line-height:1.35;resize:none;color:#8f1d24}
#w-wish:focus,#w-by:focus{outline:2px solid var(--green);border-color:transparent}
.sw-sugg{display:flex;gap:6px;flex-wrap:wrap;margin:-6px 0 16px}.sw-sugg button{font:inherit;font-size:12.5px;padding:6px 10px;border-radius:999px;border:1px dashed #cdbfa6;background:#fffaf1;color:var(--ink);cursor:pointer}
.sw-arts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
.sw-art{display:grid;gap:4px;padding:6px;border:1px solid #d8d0c2;border-radius:14px;background:#fff;cursor:pointer;color:var(--ink);min-width:0}
.sw-art img{width:100%;height:auto;aspect-ratio:1;object-fit:contain;border-radius:10px}.sw-art span{font-size:11.5px;line-height:1.25;text-align:center}
.sw-art.on{border-color:var(--green);box-shadow:0 0 0 2px var(--green) inset;background:#f2f8f4}
.sw-buy{margin-top:6px}.sw-cta{font-size:17px}.sw-cta:disabled{opacity:.55;cursor:not-allowed}
.sw-tag{text-align:center;font-family:NVDancingH,cursive;font-size:22px;color:#1c603a;margin:12px 0 4px}
@media (max-width:520px){.sw-arts{grid-template-columns:repeat(2,1fr)}.sw-stage::before{width:76px;height:76px}}
.mc-row .cm-colors{margin-top:6px}
.cm-colors{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.cm-color{display:grid;justify-items:center;gap:4px;width:72px;padding:8px 4px 6px;border:1px solid #d8d0c2;border-radius:12px;background:#fff;cursor:pointer;color:var(--ink)}
.cm-color i{width:30px;height:30px;border-radius:50%;border:1px solid rgba(0,0,0,.18);box-shadow:inset 0 -3px 6px rgba(0,0,0,.12)}
.cm-color small{font-size:11px;color:var(--muted);line-height:1.2;text-align:center}.cm-color.on{border-color:var(--green);box-shadow:0 0 0 2px var(--green) inset;background:#f2f8f4}
.cm-fonts{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px;margin-top:10px}
.cm-font{display:grid;gap:2px;justify-items:center;padding:10px 6px 8px;border:1px solid #d8d0c2;border-radius:12px;background:#fff;cursor:pointer;color:var(--ink);min-width:0}
.cm-font.on{border-color:var(--green);box-shadow:0 0 0 2px var(--green) inset;background:#f2f8f4}
.cm-font-name{font-size:24px;line-height:1.25;padding:0 8px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cm-font small{font-size:11.5px;color:var(--muted);font-family:inherit}
.cm-chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px;margin-top:10px}
.cm-chip{display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid var(--line);border-radius:12px;background:#fff;font:inherit;font-size:14px;color:var(--ink);cursor:pointer;text-align:left}
.cm-chip svg{width:22px;height:22px;flex:none;color:var(--green)}
.cm-chip.on{background:var(--green);border-color:var(--green);color:#fff}.cm-chip.on svg{color:#fff}
.cm-chip.full{opacity:.5}
.cm-themes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.cm-theme input{position:absolute;opacity:0}.cm-theme span{display:flex;align-items:center;gap:6px;padding:10px;border:1px solid var(--line);border-radius:12px;background:#fff;font-size:14px;cursor:pointer}
.cm-theme i{width:16px;height:16px;border-radius:50%;display:inline-block}.cm-theme input:checked+span{border:2px solid var(--green);padding:9px}
.cm-hint{font-size:14px;color:var(--muted);margin:4px 0 12px}.cm-hint.warn{color:#a8332f;font-weight:600}
.cm-actions{display:flex;gap:10px}.cm-actions .buy{flex:2}.cm-actions .ask{flex:1;margin:0}
#cm-approve:disabled{opacity:.45;cursor:not-allowed}
.cm-ok{background:#eef6f0;color:var(--green);border-radius:10px;padding:10px 12px;font-size:14px}
.cm-team{margin-top:22px;padding:14px;border:1px dashed #cdbfa6;border-radius:14px;font-size:14px;background:#fffaf1}.cm-team a{color:var(--green);font-weight:700}
.tm-setup{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start}.tm-setup>*{min-width:0}
.tm-chips{max-height:260px;overflow:auto;padding:2px}
#tm-list,#tm-msg{display:block;width:100%;box-sizing:border-box;margin-top:8px;padding:12px;font:inherit;font-size:15px;line-height:1.6;border:1px solid #d8d0c2;border-radius:12px;background:#fff;resize:vertical}#tm-list:focus,#tm-msg:focus{outline:2px solid var(--green);border-color:transparent}
.tm-howto{display:grid;gap:4px;margin:10px 0;font-size:13px;color:var(--muted)}.tm-howto b{color:var(--ink);font-weight:600}
.tm-files{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.tm-up{cursor:pointer;margin:0}.tm-tpl{color:var(--green);font-weight:700;font-size:14px}
.cm-hint.good{color:var(--green);font-weight:600}
.tm-shared{margin:0 0 18px}
.tm-results{margin:26px 0;border-top:1px solid var(--line);padding-top:22px}
.tm-empty{padding:30px;text-align:center;color:var(--muted);border:1px dashed #d8d0c2;border-radius:16px;background:#fff}
.tm-sum{position:sticky;top:8px;z-index:5;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px 16px;margin-bottom:16px;box-shadow:0 6px 20px rgba(0,0,0,.06)}
.tm-sum-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.tm-sum-top small{display:block;color:var(--green);font-size:13px;margin-top:2px}
.tm-total{text-align:right}.tm-total span,.tm-total small{display:block;font-size:12px;color:var(--muted)!important;margin:0}.tm-total b{font-size:22px}
.tm-badmsg{margin:10px 0 0;padding:8px 10px;border-radius:10px;background:#fbeeee;color:#7a1d23;font-size:13.5px}
.tm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
.tm-card{margin:0;background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column}.tm-card.bad{border-color:#d9898d;box-shadow:0 0 0 2px #f6d9da}
.tm-img{position:relative;display:block;border:0;padding:0;background:#f4f1ec;cursor:pointer;aspect-ratio:1}.tm-img img{width:100%;height:100%;object-fit:cover;display:block}.tm-img img[src=""]{visibility:hidden}
.tm-turn{position:absolute;right:8px;bottom:8px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.9);display:grid;place-items:center;font-size:15px;color:var(--ink)}
.tm-card figcaption{padding:10px 12px 12px;display:grid;gap:3px;font-size:13px}.tm-card figcaption b{font-size:14px}.tm-card figcaption>span{color:var(--muted);line-height:1.4}
.tm-own-tag{font-style:normal;font-size:11px;background:#eef6f0;color:var(--green);padding:1px 6px;border-radius:6px}
.tm-err{color:#a8332f!important;font-weight:600}.tm-note{color:#7a5200!important;font-size:12px}
.tm-dl1{margin-top:6px;font:inherit;font-size:12.5px;padding:6px;border:1px solid var(--line);border-radius:8px;background:#fff;cursor:pointer}
.tm-send-box{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;margin:10px 0 26px}.tm-send-box h2{margin:0 0 4px;font-family:Fraunces,Georgia,serif}
.tm-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0 6px}.tm-fields input:not([type=radio]){font:inherit;font-size:16px;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--cream);font-weight:400}
.tm-ship{align-content:start}.tm-ship label{font-weight:400;display:flex;gap:8px;align-items:center}
.tm-more{display:flex;flex-wrap:wrap;gap:16px;margin-top:12px}.linkbtn{background:none;border:0;padding:0;font:inherit;font-size:14px;color:var(--green);font-weight:700;text-decoration:underline;cursor:pointer}
.cm [hidden]{display:none!important}.tm-admin{margin-top:18px;padding:14px;border:1px dashed #cdbfa6;border-radius:14px;display:grid;gap:8px}
.tm-faq{max-width:760px;margin-bottom:30px}
.tm-collect{margin:0 0 22px;padding:16px;border:1px dashed #cdbfa6;border-radius:16px;background:#fffaf1;font-size:14.5px;display:grid;gap:10px}.tm-collect .linkbtn{margin-left:4px}
.tm-c-row{display:flex;gap:8px;margin-top:2px}.tm-c-row input{flex:1;min-width:0;font:inherit;font-size:14px;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:#fff;font-weight:400}.tm-c-row .ask{margin:0;white-space:nowrap}
.tm-c-row .ask,.tm-up{display:inline-flex;align-items:center;justify-content:center;margin:0;padding:8px 14px;border:1px solid #cdbfa6;border-radius:10px;background:#fff;font:inherit;font-weight:700;font-size:14px;color:var(--ink);text-decoration:none;cursor:pointer}
.tm-c-head{margin:0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.tm-locked .cm-theme{opacity:.55;pointer-events:none}.tm-locked .cm-theme input:checked+span{opacity:1}
.tm-joined{display:block;margin-top:10px}
@media (max-width:760px){.tm-setup,.tm-fields{grid-template-columns:1fr;gap:0 12px}.tm-grid{grid-template-columns:1fr 1fr;gap:10px}.tm-sum-top b{font-size:15px}.tm-total b{font-size:19px}.tm-fields{gap:12px}}
.shown-on{font-size:13px;color:var(--muted);text-align:center;margin:10px 0 0}
.model-help{font-size:12.5px;color:var(--muted);margin:-4px 0 2px}
.cases-hero{padding:16px 0 22px;max-width:760px}
.cases-hero h1{font-family:Fraunces,Georgia,serif;font-size:clamp(30px,4.4vw,48px);line-height:1.06;margin:8px 0 12px}.cases-hero h1 em{color:#a8332f}
.coll-letters{position:absolute;right:12px;bottom:12px;background:var(--green);color:#fff;font-weight:700;font-size:14px;padding:5px 11px;border-radius:99px}
.chip-link{display:inline-flex;align-items:center;padding:8px 14px;border-radius:99px;border:1px solid var(--green);color:var(--green);font-size:14px;font-weight:600;text-decoration:none;background:#fff}
.chip-link:hover{background:var(--green);color:#fff}
.ini-hero{display:grid;grid-template-columns:1.1fr .9fr;gap:36px;align-items:center;padding:20px 0 30px}
.ini-hero h1{font-family:Fraunces,Georgia,serif;font-size:clamp(32px,4.6vw,52px);line-height:1.05;margin:8px 0 14px}
.ini-hero h1 em{color:var(--red,#a8332f)}
.ini-price{font-size:18px;margin:14px 0 4px}.ini-price s{color:var(--muted)}.ini-price b{font-size:28px;color:#a8332f}.ini-price span{display:inline-block;margin-left:6px;background:#a8332f;color:#fff;font-size:13px;font-weight:700;padding:4px 10px;border-radius:99px;vertical-align:middle}
.ini-pic{background:#fff;border:1px solid var(--line);border-radius:22px;overflow:hidden}.ini-pic img{width:100%;height:auto;display:block}
.ini-pick{padding:10px 0 34px}.ini-pick h2,section h2{font-family:Fraunces,Georgia,serif}
.letters{display:grid;grid-template-columns:repeat(13,1fr);gap:8px;margin-top:14px}
.lt{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:12px;font-family:Fraunces,Georgia,serif;font-size:22px;font-weight:700;text-decoration:none;border:1px solid var(--line);background:#fff;color:var(--muted)}
.lt.ok{background:var(--green);border-color:var(--green);color:#fff;box-shadow:0 4px 12px rgba(31,77,54,.25)}
.lt{cursor:pointer;padding:0}
.lt.ok{background:#fff;color:var(--green);border:2px solid var(--green);box-shadow:none}
.lt.ok:hover{background:#eef4f0}
.lt.ok.on{background:var(--green);color:#fff;box-shadow:0 4px 12px rgba(31,77,54,.25)}
.lt.soon{cursor:not-allowed;opacity:.38;background:#f6f1e8}
.pdp.ini-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);grid-template-areas:"gal title" "gal buy";grid-template-rows:auto 1fr;column-gap:44px;row-gap:0;align-items:start;padding:10px 0 26px}
.ini-title{grid-area:title}.ini-gal{grid-area:gal}.ini-buy{grid-area:buy}
.ini-title h1{font-family:Fraunces,Georgia,serif;font-size:clamp(28px,3.6vw,44px);line-height:1.08;margin:6px 0 10px}
.ini-gal .ini-pick{margin:16px 0 0}
.ini-gal .letters{display:grid;grid-template-columns:repeat(13,1fr);gap:6px;margin-top:10px}
.ini-gal .lt{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:10px;font-family:Fraunces,Georgia,serif;font-size:17px;font-weight:700;text-decoration:none}
.ini-flat{margin:6px 0 40px}
#pimg{transition:opacity .18s}#pimg.swap{opacity:.35}
@media (max-width:860px){.pdp.ini-grid{grid-template-columns:1fr;grid-template-areas:"title" "gal" "buy";row-gap:14px}.ini-title h1{font-size:28px;margin:4px 0 6px}.ini-title .save{margin-bottom:12px}.ini-gal .letters{grid-template-columns:repeat(9,1fr)}.ini-gal .lt{font-size:18px}.ini-gal .gal-col,.ini-gal{position:static}}
.ini .ini-pick{margin:16px 0 4px;padding:0}
.pick-head{display:flex;justify-content:space-between;align-items:baseline;font-size:15px}.pick-head span{color:var(--muted);font-size:14px}
.ini .letters{grid-template-columns:repeat(9,1fr);gap:6px;margin-top:10px}
.ini .lt{font-size:18px;border-radius:10px}
.pick-note{font-size:13px;color:var(--muted);margin:10px 0 0}.pick-note a{color:var(--green);font-weight:600}
@media (max-width:760px){.ini-hero{grid-template-columns:1fr}.ini-pic{order:-1}.letters{grid-template-columns:repeat(7,1fr)}}
.m3d{position:absolute;inset:0;z-index:2;background:#fff;border-radius:inherit;overflow:hidden}
.m3d[hidden]{display:none}
.m3d canvas{width:100%!important;height:100%!important;display:block}
.m3d-side{position:absolute;top:14px;left:50%;transform:translateX(-50%);background:var(--green);color:#fff;font-size:13px;font-weight:600;padding:6px 14px;border-radius:99px;white-space:nowrap;pointer-events:none}
.m3d-side:empty{display:none}
.m3d-note{position:absolute;left:8px;right:8px;bottom:10px;text-align:center;color:var(--muted);font-size:12px;line-height:1.3;pointer-events:none}
@media (max-width:520px){.m3d-note{font-size:11px;bottom:8px}}
@media (max-width:520px){.views{gap:6px}.views .view{gap:6px;padding:5px 6px;font-size:12px}.views .view img,.views .view svg{width:40px;height:40px}}
.foot-policy{font-size:13px}
.foot-brand{margin-bottom:4px;color:var(--ink)}
.foot-social{display:flex;gap:14px;justify-content:center;margin:10px 0 8px}
.foot-social a{color:var(--ink);display:inline-flex}
.li-inline{display:inline-flex;vertical-align:-3px;margin-left:4px}
.foot-brand a{font-weight:600}
.foot-policy a{font-weight:400;color:var(--muted)}
.trustbar{background:#f3ece0;border-bottom:1px solid var(--line);font-size:13px;color:#4c5a52}
.tb-in{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px 8px;padding:7px 0;text-align:center}
.trustbar a{color:var(--green);font-weight:600;text-decoration:none}.trustbar a:hover{text-decoration:underline}
.tb-li{display:inline-flex;vertical-align:-3px}.tb-li svg{width:15px;height:15px}
@media (max-width:640px){.tb-wide,.tb-dot{display:none}.trustbar{font-size:12px}.tb-in{padding:6px 0;gap:2px 10px}}
.trust-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.trust-links a{font-size:13px;text-decoration:none;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 12px}
.checks a,.trust a{color:var(--green);font-weight:600}
.policy{max-width:760px;margin:0 auto;padding:10px 20px 50px}
.policy h1{font-family:Fraunces,serif;font-size:clamp(30px,4.6vw,42px);line-height:1.1;margin:10px 0 6px}
.policy .meta{margin-bottom:22px}
.policy .lead{font-size:18px;color:#2b332f;background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 18px}
.policy h2{font-family:Fraunces,serif;font-size:23px;text-align:left;margin:30px 0 10px}
.policy p,.policy li,.policy td,.policy th{font-size:16px;line-height:1.65;color:#2b332f}
.policy p,.policy ul,.policy ol,.policy table{margin:0 0 14px}
.policy ul,.policy ol{padding-left:22px}
.policy table{width:100%;border-collapse:collapse}
.policy th,.policy td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line)}
.policy a{color:var(--green);font-weight:600}
.policy-nav{display:flex;flex-wrap:wrap;gap:8px;margin:30px 0 0;padding-top:20px;border-top:1px solid var(--line)}
.policy-nav a{font-size:13.5px;text-decoration:none;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 12px}
.policy-nav a.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.contact-list{list-style:none;padding-left:0!important}
.foot-links{display:flex;flex-wrap:wrap;gap:8px 18px;justify-content:center;margin-bottom:10px}
.foot-links a{font-weight:500;color:var(--ink)}
.intro-seo{max-width:760px;margin:0 auto;padding:10px 20px 40px;text-align:center;color:var(--muted);font-size:15px}
.blog-hero{padding:44px 0 18px;text-align:center}
.blog-hero h1{font-family:Fraunces,serif;font-size:clamp(32px,5vw,46px);letter-spacing:-.01em}
.blog-hero p{color:var(--muted);margin-top:8px}
.posts{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:20px 0 56px}
.pcard{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;text-decoration:none;display:flex;flex-direction:column}
.pcard .stage{aspect-ratio:16/10;padding:16px}
.pcard .stage svg{height:100%;width:auto;max-width:100%}
.pcard .pb{padding:16px 18px 20px;border-top:1px solid var(--line)}
.pcard h2{font-family:Fraunces,serif;font-size:20px;font-weight:500;line-height:1.25;text-align:left;margin:6px 0 8px}
.pcard p{font-size:14px;color:var(--muted)}
.meta{font-size:12.5px;color:var(--muted);font-weight:500;letter-spacing:.02em}
.post{max-width:720px;margin:0 auto;padding:10px 20px 40px}
.post .cover{border-radius:22px;border:1px solid var(--line);aspect-ratio:16/8;display:flex;align-items:center;justify-content:center;padding:20px;margin:18px 0 26px}
.post .cover svg{height:100%;width:auto}
.post h1{font-family:Fraunces,serif;font-size:clamp(30px,4.6vw,44px);line-height:1.1;letter-spacing:-.01em;margin:10px 0 10px}
.post .body{font-size:17px;line-height:1.7;color:#2b332f}
.post .body p,.post .body ul,.post .body table{margin:0 0 18px}
.post .body h2{font-family:Fraunces,serif;font-size:26px;text-align:left;margin:34px 0 12px;line-height:1.2}
.post .body h3{font-size:18px;margin:24px 0 8px}
.post .body ul{padding-left:22px}
.post .body li{margin-bottom:6px}
.post .body table{width:100%;border-collapse:collapse;font-size:15px}
.post .body th,.post .body td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line)}
.post .body th{background:#fff}
.inline-prod{display:flex;gap:16px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px 16px;margin:0 0 18px;text-decoration:none}
.inline-prod .thumb{width:96px;height:96px;flex:none;display:flex;align-items:center;justify-content:center}
.inline-prod .thumb svg{height:100%;width:auto}
.inline-prod b{display:block;font-family:Fraunces,serif;font-weight:500;font-size:18px}
.inline-prod span{font-size:14px;color:var(--muted)}
.inline-prod em{font-style:normal;font-weight:700;color:var(--green);font-size:14px}
.cta-box{background:var(--green);color:#fff;border-radius:18px;padding:22px;margin:26px 0}
.cta-box b{font-family:Fraunces,serif;font-size:22px;display:block;margin-bottom:6px}
.cta-box a{display:inline-block;margin-top:12px;background:#fff;color:var(--ink);font-weight:700;text-decoration:none;padding:10px 16px;border-radius:10px}
@media (max-width:760px){
  .posts{grid-template-columns:1fr}
  .hide-sm{display:none}
  .pdp{grid-template-columns:1fr;gap:22px}
  .gal-col{position:static}
  .pdp .gallery{position:relative;top:auto;padding:20px}
  .ig.corp{white-space:nowrap;padding:7px 11px;font-size:13px}
  .related .grid{grid-template-columns:1fr 1fr}
  .specs dl{grid-template-columns:110px 1fr}
}
/* ===== standard product tile (every card in every grid) ===== */
.card .stage,.card .stage.christmas,.card .stage.pets,.card .stage.ph{aspect-ratio:1/1;padding:0;background:#fff;border-bottom:1px solid var(--line)}
.card .stage img.photo{position:absolute;inset:7%;width:86%;height:86%;object-fit:contain}
.card .stage svg{position:absolute;inset:7%;width:86%;height:86%;max-width:none}
.card .fx-badge{left:auto;right:10px;top:10px}
.card .info{border-top:0}
.card .tags{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card .info h3{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.4em}
.card .info .price{margin-top:auto}
.card .info .buy{margin-top:8px}
.coll-letters{right:10px;bottom:10px}
`;

// ---------- JS ----------
const storeJs = `/* ============================================================
   NEVERVOID STORE SETTINGS — edit here, every page uses these.
   payLinks: paste a Razorpay Payment Link per product id ("" = order via DM)
   whatsapp: number with country code, digits only, e.g. "919876543210"
   ============================================================ */
const CONFIG = {
  instagram: "nevervoidstore",
  whatsapp: "__WA__",
  // Razorpay Payment Page (long form: https://pages.razorpay.com/pl_XXXX/view). Empty = WhatsApp ordering only.
  razorpayPage: "__RZP__",
  rzpPages: __RZPPAGES__,
  // Checkout backend (Google Apps Script). Set = pay in Razorpay's window on our page; empty = Payment Page above.
  api: "__API__",
  // Field names on that page (label in lowercase, spaces as underscores)
  rzpFields: { product: "product", model: "phone_model", pincode: "pincode" },
  payLinks: {
    "mug-sleigh": "", "mug-tree": "", "mug-cocoa": "", "mug-ginger": "",
    "mug-dogmom": "", "mug-cat": "", "mug-paws": "", "mug-custom": "",
    "case-plaid": "", "case-pines": "", "case-cats": "", "case-paws": "", "case-custom": ""
  }
};

(function(){
  const dmUrl = "https://ig.me/m/" + CONFIG.instagram;
  const rupee = n => "₹" + Number(n).toLocaleString("en-IN");
  let tt;
  function toast(m){ const t=document.getElementById("toast"); if(!t) return; t.textContent=m; t.classList.add("show"); clearTimeout(tt); tt=setTimeout(()=>t.classList.remove("show"),2600); }
  function copy(text, msg){ try{ navigator.clipboard.writeText(text).then(()=>toast(msg),()=>toast(msg)); }catch(e){ toast(msg); } }
  function send(text){
    window.nvTrack("Lead", { content_name: "WhatsApp question" });
    if (CONFIG.whatsapp){ location.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(text); return; }
    copy(text, "Order details copied. Paste them in your Instagram DM");
    setTimeout(()=>{ location.href = dmUrl; }, 900);
  }
  window.nvToast = toast;
  // product view for ads reporting
  (function(){ const b = document.querySelector(".buybox [data-order]"); if (b && b.dataset.id) window.nvTrack("ViewContent", { content_ids: [b.dataset.id], content_type: "product", content_name: b.dataset.name, value: +b.dataset.price || 0, currency: "INR" }); })();
  const isKA = p => /^5[6-9]\\d{4}$/.test(p);
  function showPinMsg(box, pin){
    const m = box.querySelector(".pin-msg"); if (!m) return;
    m.hidden = false; m.classList.remove("ok");
    const wa = CONFIG.whatsapp ? "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent("Hi Antony! Please let me know when you deliver to pincode " + pin + ".") : "";
    m.innerHTML = "Sorry, we deliver only within Karnataka for now (pincodes starting 56–59)." + (wa ? ' <a href="' + wa + '" target="_blank" rel="noopener">Tell me when you deliver to ' + pin + '</a>' : "");
  }
  document.querySelectorAll(".pin").forEach(el => el.addEventListener("input", () => {
    el.value = el.value.replace(/\\D/g, "").slice(0, 6);
    const box = el.closest(".buybox"), m = box && box.querySelector(".pin-msg"); if (!m) return;
    if (el.value.length < 6) { m.hidden = true; return; }
    if (isKA(el.value)) { m.hidden = false; m.classList.add("ok"); m.textContent = "✓ We deliver to " + el.value + "."; }
    else showPinMsg(box, el.value);
  }));

  // ---------- on-site checkout sheet: collect delivery details, show the summary, then hand over to Razorpay to pay ----------
  const esc2 = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  let sheet = null;
  function rzpUrl(item) { return (CONFIG.rzpPages && CONFIG.rzpPages[item]) || CONFIG.razorpayPage; }
  function openCheckout(btn, model, pin) {
    const img = document.getElementById("pimg"), cv = document.getElementById("pcanvas");
    const pic = cv && !cv.hidden ? cv.toDataURL("image/jpeg", 0.8) : (img ? img.currentSrc || img.src : "");
    const name = btn.dataset.name.split(" | design ")[0].replace(/ \(design [^)]*\)$/, ""), price = +btn.dataset.price;
    const wasEl = document.querySelector(".pprice .was, .price .was"), was = wasEl ? wasEl.textContent : "";
    let saved = {}; try { saved = JSON.parse(localStorage.getItem("nv_addr") || "{}"); } catch (e) {}
    if (!sheet) { sheet = document.createElement("div"); sheet.className = "co-wrap"; document.body.appendChild(sheet); }
    sheet.innerHTML =
      '<div class="co-back" data-close></div><div class="co" role="dialog" aria-modal="true" aria-labelledby="co-t">' +
      '<button class="co-x" type="button" data-close aria-label="Close">×</button>' +
      '<h2 id="co-t">Checkout</h2>' +
      '<div class="co-sum">' + (pic ? '<img src="' + esc2(pic) + '" alt="">' : "") + '<div><b>' + esc2(name.split(" | ")[0]) + '</b>' + (name.split(" | ").length > 1 ? '<span class="co-chips">' + name.split(" | ").slice(1).map(x => '<i>' + esc2(x) + '</i>').join("") + '</span>' : "") + (model ? '<span>' + esc2(model) + '</span>' : "") +
      '<div class="co-price">' + (was ? '<s>' + esc2(was) + '</s> ' : "") + '<b>' + rupee(price) + '</b></div><span class="co-free">Made to order · delivered in about 5–7 days</span></div></div>' +
      '<form class="co-form" novalidate>' +
      '<label>Full name<input name="n" autocomplete="name" required value="' + esc2(saved.n || "") + '"></label>' +
      '<label>Mobile number<input name="p" type="tel" inputmode="numeric" maxlength="10" autocomplete="tel-national" placeholder="10-digit mobile" required value="' + esc2(saved.p || "") + '"></label>' +
      '<label>Email <small>(we send your order confirmation here)</small><input name="e" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required value="' + esc2(saved.e || "") + '"></label>' +
      '<label>House / flat, street, area<textarea name="a" rows="2" autocomplete="street-address" required>' + esc2(saved.a || "") + '</textarea></label>' +
      '<div class="co-row"><label>City<input name="c" autocomplete="address-level2" required value="' + esc2(saved.c || "") + '"></label>' +
      '<label>Pincode<input name="z" inputmode="numeric" maxlength="6" autocomplete="postal-code" required value="' + esc2(pin || saved.z || "") + '"></label></div>' +
      '<div class="co-err" hidden></div>' +
      '<button class="buy co-pay" type="submit"><svg class="co-ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg> Pay ' + rupee(price) + ' securely</button>' +
      '<div class="co-ways" aria-label="Ways to pay">' +
        '<span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 18h4" stroke="currentColor" stroke-width="1.8"/></svg>UPI apps</span>' +
        '<span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2 10h20" stroke="currentColor" stroke-width="1.8"/></svg>Cards</span>' +
        '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Netbanking</span>' +
        '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H3z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="16" cy="13.5" r="1.5"/></svg>Wallets</span>' +
      '</div>' +
      '<div class="co-trust"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>Secured by Razorpay</span>' +
        '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></svg>5–7 day delivery</span>' +
        '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Free replacement if damaged</span></div>' +
      '<p class="co-note">' + (CONFIG.api ? "The secure payment window opens right here." : "Next, Razorpay’s secure page opens with your details filled in. Tap Pay there.") + ' <a href="#report" data-report>Trouble paying?</a></p>' +
      '</form></div>';
    requestAnimationFrame(() => sheet.classList.add("open")); document.body.classList.add("co-lock");
    sheet.querySelectorAll("[data-close]").forEach(x => x.addEventListener("click", closeCheckout));
    const form = sheet.querySelector("form"), err = sheet.querySelector(".co-err");
    (form.n.value ? form.a : form.n).focus({ preventScroll: true });
    form.addEventListener("submit", ev => {
      ev.preventDefault();
      const v = { e: form.e.value.trim(), n: form.n.value.trim(), p: form.p.value.replace(/\\D/g, ""), a: form.a.value.trim().replace(/\\s+/g, " "), c: form.c.value.trim(), z: form.z.value.trim() };
      const bad = !v.n ? [form.n, "Please enter your name"] : !/^[6-9]\\d{9}$/.test(v.p) ? [form.p, "Please enter a valid 10-digit mobile number"] : !/^[^@\\s]+@[^@\\s]+\\.[a-z]{2,}$/i.test(v.e) ? [form.e, "Please enter your email so we can send your order confirmation"] :
        v.a.length < 8 ? [form.a, "Please enter your full delivery address"] : !v.c ? [form.c, "Please enter your city"] :
        !isKA(v.z) ? [form.z, "We deliver within Karnataka only for now (pincodes starting 56–59)"] : null;
      if (bad) { err.hidden = false; err.textContent = bad[1]; bad[0].focus(); return; }
      try { localStorage.setItem("nv_addr", JSON.stringify(v)); localStorage.setItem("nv_last", JSON.stringify({ name, model, price, pic: pic && pic.length < 200000 ? pic : "", at: Date.now() })); } catch (e) {}
      if (CONFIG.api) { payHere(btn, v, name, price, model, form, err); return; }
      const f = CONFIG.rzpFields, q = new URLSearchParams();
      q.set(btn.dataset.rzp, "1");
      q.set(f.product, btn.dataset.name + " | Ship to: " + v.n + ", " + v.a + ", " + v.c + " " + v.z + ", +91 " + v.p);
      if (model) q.set(f.model, model);
      q.set(f.pincode, v.z); q.set("email", v.e); q.set("phone", v.p); q.set("full_name", v.n); q.set("name", v.n); q.set("address", v.a); q.set("city", v.c);
      form.querySelector(".co-pay").textContent = "Opening secure payment…";
      window.nvTrack("InitiateCheckout", { value: price, currency: "INR", content_name: name, content_ids: [btn.dataset.id], content_type: "product" });
      location.href = rzpUrl(btn.dataset.rzp) + (rzpUrl(btn.dataset.rzp).includes("?") ? "&" : "?") + q.toString();
    });
  }
  // Razorpay Checkout on our page: the backend creates the order at the listed price, the payment is verified, the order is logged
  let rzpLoad = null;
  function loadRzp() { if (!rzpLoad) rzpLoad = new Promise((ok, no) => { const sc = document.createElement("script"); sc.src = "https://checkout.razorpay.com/v1/checkout.js"; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); }); return rzpLoad; }
  function api(body) { return fetch(CONFIG.api, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) }).then(r => r.json()); }
  function payHere(btn, v, name, price, model, form, err) {
    const payBtn = form.querySelector(".co-pay"), label = payBtn.textContent;
    const parts = btn.dataset.name.split(" | "), design = (parts.find(x => /^design /.test(x)) || "").replace(/^design /, "");
    const options = parts.slice(1).filter(x => !/^design /.test(x)).join(" | ");
    const reset = msg => { payBtn.disabled = false; payBtn.textContent = label; if (msg) { err.hidden = false; err.textContent = msg; } };
    payBtn.disabled = true; payBtn.textContent = "Opening secure payment…"; err.hidden = true;
    window.nvTrack("InitiateCheckout", { value: price, currency: "INR", content_name: name, content_ids: [btn.dataset.id], content_type: "product" });
    Promise.all([api({ a: "order", id: btn.dataset.id, product: parts[0], options: options, design: design ? "https://" + design.replace("https://", "").replace("http://", "") : "", model: model || "",
      customer: { name: v.n, phone: v.p, email: v.e, address: v.a, city: v.c, pincode: v.z } }), loadRzp()]).then(([o]) => {
      if (!o.ok) { reset(o.err || "Couldn’t start the payment. Please try again."); return; }
      const rz = new window.Razorpay({
        key: o.key, order_id: o.order_id, amount: o.amount, currency: "INR", name: "NevervoidStore", description: parts[0].slice(0, 120),
        image: location.origin + "/images/nv-logo.png", prefill: { name: v.n, contact: "+91" + v.p, email: v.e }, theme: { color: "#1f4d36" },
        modal: { ondismiss: () => reset("") },
        handler: r => {
          payBtn.textContent = "Confirming your payment…";
          api({ a: "verify", order_id: r.razorpay_order_id, payment_id: r.razorpay_payment_id, signature: r.razorpay_signature })
            .catch(() => ({})).then(() => { location.href = "/thank-you.html?paid=1"; });
        }
      });
      rz.on("payment.failed", e => reset("Payment didn’t go through" + (e && e.error && e.error.description ? ": " + e.error.description : "") + ". You can try again."));
      closeCheckout(); rz.open();
    }).catch(() => {
      // backend unreachable: fall back to the Razorpay Payment Page so nobody gets stuck
      if (CONFIG.razorpayPage) { const q = new URLSearchParams(); q.set(btn.dataset.rzp, "1"); q.set(CONFIG.rzpFields.product, btn.dataset.name + " | Ship to: " + v.n + ", " + v.a + ", " + v.c + " " + v.z + ", +91 " + v.p); q.set("phone", v.p); q.set("full_name", v.n); location.href = rzpUrl(btn.dataset.rzp) + (rzpUrl(btn.dataset.rzp).includes("?") ? "&" : "?") + q.toString(); }
      else reset("Couldn’t reach the payment service. Please try again in a minute.");
    });
  }
  function closeCheckout() { if (!sheet) return; sheet.classList.remove("open"); document.body.classList.remove("co-lock"); }
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeCheckout(); });
  // sticky buy bar on phones: price + Buy now, shown once the main button scrolls out of view
  const mainBuy = document.querySelector(".buybox [data-order]:not([data-nobar])");
  if (mainBuy && CONFIG.razorpayPage) {
    const bar = document.createElement("div"); bar.className = "buybar";
    const wasEl = document.querySelector(".pprice .was");
    bar.innerHTML = '<div class="bb-p">' + (wasEl ? '<s>' + esc2(wasEl.textContent) + '</s>' : "") + '<b>' + rupee(+mainBuy.dataset.price) + '</b><span>🔒 Secure checkout</span></div><button type="button" class="buy">Buy now</button>';
    document.body.appendChild(bar); document.body.classList.add("has-buybar");
    bar.querySelector("button").addEventListener("click", () => { mainBuy.closest(".buybox").scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => mainBuy.click(), 450); });
    new IntersectionObserver(es => bar.classList.toggle("show", !es[0].isIntersecting && es[0].boundingClientRect.top > 0)).observe(mainBuy);
  }
  document.querySelectorAll("[data-order]").forEach(btn => {
    const pay = CONFIG.payLinks[btn.dataset.id];
    if (pay) btn.textContent = "Pay securely · " + rupee(btn.dataset.price);
    if (CONFIG.razorpayPage && !pay) {
      btn.textContent = "Buy now · " + rupee(btn.dataset.price);
      const alt = document.createElement("button");
      alt.type = "button"; alt.className = "buy alt-wa"; alt.textContent = "Order on WhatsApp instead";
      alt.addEventListener("click", () => {
        const box = btn.closest(".buybox"), sel = box && box.querySelector(".model"), pinEl = box && box.querySelector(".pin");
        const model = sel ? sel.value : "", pin = pinEl ? pinEl.value.trim() : "";
        if (sel && !model){ toast("Please choose your phone model first"); sel.focus(); return; }
        if (pinEl && !/^\\d{6}$/.test(pin)){ toast("Please enter your 6-digit delivery pincode"); pinEl.focus(); return; }
        if (pinEl && !isKA(pin)){ showPinMsg(box, pin); return; }
        send("Hi Antony! I'd like to order: " + btn.dataset.name + " (" + rupee(btn.dataset.price) + ")" + (model ? " for " + model : "") + ". Delivery pincode: " + pin + ".");
      });
      btn.after(alt);
      const note = document.createElement("div"); note.className = "pay-note";
      note.textContent = "🔒 Secure payment by Razorpay · UPI, cards & netbanking";
      alt.after(note);
    }
    btn.addEventListener("click", () => {
      const box = btn.closest(".buybox"), sel = box && box.querySelector(".model");
      const model = sel ? sel.value : "";
      if (sel && !model){ toast("Please choose your phone model first"); sel.focus(); return; }
      const pinEl = box && box.querySelector(".pin"), pin = pinEl ? pinEl.value.trim() : "";
      if (pinEl && !/^\\d{6}$/.test(pin)){ toast("Please enter your 6-digit delivery pincode"); pinEl.focus(); return; }
      if (pinEl && !isKA(pin)){ showPinMsg(box, pin); return; }
      const text = "Hi Antony! I'd like to order: " + btn.dataset.name + " (" + rupee(btn.dataset.price) + ")" + (model ? " for " + model : "") + ". Delivery pincode: " + pin + ".";
      if (pay){ if (model) copy(text, "Opening checkout. Please DM us your model: " + model); location.href = pay; return; }
      if (CONFIG.razorpayPage && btn.dataset.rzp){ openCheckout(btn, model, pin); return; }
      if (false){
        const f = CONFIG.rzpFields, q = new URLSearchParams();
        q.set(btn.dataset.rzp, "1"); q.set(f.product, btn.dataset.name);
        if (model) q.set(f.model, model);
        q.set(f.pincode, pin);
        location.href = rzpUrl(btn.dataset.rzp) + (rzpUrl(btn.dataset.rzp).includes("?") ? "&" : "?") + q.toString();
        return;
      }
      send(text);
    });
  });
  document.querySelectorAll(".model").forEach(sel => sel.addEventListener("change", () => {
    // show the design on the phone the shopper picked
    const o = sel.selectedOptions[0], note = document.getElementById("shown-on"), cv = document.getElementById("pcanvas"), img = document.getElementById("pimg");
    if (!o || !o.value || !o.dataset.s) return;
    if (cv && sel.closest(".buybox")) { previewOn(cv, o.dataset.s, o.value); return; }
    if (img && img.dataset.base && sel.closest(".buybox")) {
      const n = new Image(); n.onload = () => { img.src = n.src; if (note) note.textContent = "Shown on your " + o.value + "."; }; n.src = img.dataset.base + o.dataset.s + ".webp";
    }
  }));
  // live preview: the chosen design on the chosen phone model (frame + print-area mask + design)
  const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  let RECTS = null, previewSeq = 0;
  async function previewOn(cv, slug, label) {
    const seq = ++previewSeq, img = document.getElementById("pimg"), note = document.getElementById("shown-on");
    try {
      if (!RECTS) RECTS = await (await fetch("/images/cases/frames/rects.json?v=4")).json();
      const [art, frame, mask] = await Promise.all([loadImg(cv.dataset.art), loadImg("/images/cases/frames/" + slug + "-frame.webp?v=4"), loadImg("/images/cases/frames/" + slug + "-mask.png?v=4")]);
      if (seq !== previewSeq) return;
      const S = cv.width / 1200, ctx = cv.getContext("2d"), [x0, y0, x1, y1] = RECTS[slug];
      ctx.clearRect(0, 0, cv.width, cv.height);
      const rw = (x1 - x0) * S, rh = (y1 - y0) * S, r = Math.max(rw / art.width, rh / art.height), dw = art.width * r, dh = art.height * r;
      ctx.drawImage(art, x0 * S + (rw - dw) / 2, y0 * S + (rh - dh) / 2, dw, dh);       // cover, centred, never stretched
      ctx.globalCompositeOperation = "destination-in"; ctx.drawImage(mask, 0, 0, cv.width, cv.height);
      ctx.globalCompositeOperation = "source-over"; ctx.drawImage(frame, 0, 0, cv.width, cv.height);
      cv.hidden = false; if (img) img.style.visibility = "hidden";
      if (note) note.textContent = "Shown on your " + label + ".";
    } catch (e) { cv.hidden = true; if (img) img.style.visibility = ""; }
  }
  // share: native share sheet on phones, otherwise a small menu
  document.querySelectorAll(".share-btn").forEach(btn => {
    const menu = btn.nextElementSibling, url = btn.dataset.shareUrl, title = btn.dataset.shareTitle, text = btn.dataset.shareText;
    const e = encodeURIComponent;
    menu.querySelector('[data-net="wa"]').href = "https://wa.me/?text=" + e(text + " " + url);
    menu.querySelector('[data-net="fb"]').href = "https://www.facebook.com/sharer/sharer.php?u=" + e(url);
    menu.querySelector('[data-net="x"]').href = "https://twitter.com/intent/tweet?text=" + e(text) + "&url=" + e(url);
    menu.querySelector('[data-net="copy"]').addEventListener("click", ev => {
      const b = ev.currentTarget, done = () => { b.textContent = "Link copied"; setTimeout(() => { b.textContent = "Copy link"; menu.hidden = true; }, 1400); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, () => prompt("Copy this link:", url)); else prompt("Copy this link:", url);
    });
    btn.addEventListener("click", async () => {
      if (navigator.share && matchMedia("(pointer:coarse)").matches) { try { await navigator.share({ title, text, url }); } catch (err) {} return; }
      menu.hidden = !menu.hidden;
    });
    document.addEventListener("click", ev => { if (!btn.parentElement.contains(ev.target)) menu.hidden = true; });
  });
  // discourage saving design images (screenshots can't be prevented; public images are watermarked and screen-sized)
  document.addEventListener("contextmenu", ev => { if (ev.target.closest(".gallery, .stage, .flat-wrap, .views, .m3d")) ev.preventDefault(); });
  document.addEventListener("dragstart", ev => { if (ev.target.closest && ev.target.closest(".gallery, .stage, .flat-wrap, .views")) ev.preventDefault(); });
  // 3D preview only on capable devices: WebGL2, 4+ cores, 4GB+ memory (where reported), no data saver or slow network
  (function(){
    const b = document.querySelector(".views .v360"); if (!b) return;
    let ok = false;
    try {
      const c = document.createElement("canvas"), gl = c.getContext("webgl2");
      ok = !!gl; if (gl) { const x = gl.getExtension("WEBGL_lose_context"); if (x) x.loseContext(); }
    } catch (e) { ok = false; }
    const n = navigator, cn = n.connection || {};
    if ((n.hardwareConcurrency || 4) < 4) ok = false;
    if (n.deviceMemory && n.deviceMemory < 4) ok = false;
    if (cn.saveData || /(^|-)(2g|3g)$/.test(cn.effectiveType || "")) ok = false;
    if (!ok) b.remove();
  })();
  document.querySelectorAll(".views .view").forEach(v => v.addEventListener("click", async () => {
    const img = document.getElementById("pimg"), box = document.getElementById("m3d");
    v.parentElement.querySelectorAll(".view").forEach(x => x.classList.toggle("on", x === v));
    if (v.dataset.spin && box) {
      box.hidden = false; if (img) img.style.visibility = "hidden";
      if (box._m) box._m.wake();
      else { try { const mod = await import("/assets/mug3d.js"); const lab = box.querySelector(".m3d-side"), names = ["Faces you", "Centre · opposite the handle", "Faces the person opposite"]; box._m = mod.mount(box, box.dataset.wrap, +box.dataset.start, k => { lab.textContent = names[k]; }); } catch (e) { box.hidden = true; if (img) img.style.visibility = ""; } }
      return;
    }
    if (box) box.hidden = true;
    if (img) { img.style.visibility = ""; img.src = v.dataset.src; }
  }));
  document.querySelectorAll("[data-ask]").forEach(b => b.addEventListener("click", () =>
    send("Hi Antony! I have a question about the " + b.dataset.name + ".")));

  // trust line switches once Razorpay links exist
  if (CONFIG.razorpayPage || Object.values(CONFIG.payLinks).some(Boolean)) document.querySelectorAll("[data-paytrust]").forEach(el => {
    if (el.tagName === "LI") el.textContent = "Secure checkout via Razorpay: UPI, cards & netbanking";
    else el.innerHTML = "<b>Secure checkout</b>UPI, cards &amp; netbanking via Razorpay";
  });

  // catalogue filters (index page)
  const filters = document.getElementById("filters");
  if (filters){
    const apply = f => {
      document.querySelectorAll("#filters button").forEach(x => x.classList.toggle("on", x.dataset.f === f));
      document.querySelectorAll("#grid .card").forEach(c => { c.style.display = (f==="all" || c.dataset.cat.split(" ").includes(f) || c.dataset.type===f) ? "" : "none"; });
    };
    filters.addEventListener("click", e => { const b = e.target.closest("button"); if (b){ apply(b.dataset.f); history.replaceState(null,"", b.dataset.f==="all" ? location.pathname : "#" + b.dataset.f); }});
    const h = location.hash.slice(1); if (["christmas","pets","mug","case"].includes(h)) apply(h);
  }
})();
`;

// ---------- pages ----------
const org = {"@type":"Organization","@id":BASE+"/#org","name":"NevervoidStore","founder":Object.assign({"@type":"Person","name":"Antony Pratap"}, POL.CONTACT.linkedin ? {"sameAs":[POL.CONTACT.linkedin]} : {}),"parentOrganization":{"@type":"Organization","name":"Nevervoid Photography","url":POL.CONTACT.photographySite},"url":BASE+"/","logo":BASE+"/images/og-home.jpg","sameAs":["https://instagram.com/nevervoidstore"]};

function galleryHtml(p) {
  return `<div class="gal-col"><div class="gallery ${p.cat}${p.photoMug ? " ph" : ""}" role="img" aria-label="${esc(p.name)} mock-up">${SALE.on ? `<span class="fx-badge big">−${SALE.pct}%</span>` : ""}${p.photoMug ? `<img id="pimg" class="photo" src="/images/mugs/${p.slug}-${p.view}.webp" alt="${esc(p.name)}" width="620" height="620"><div id="m3d" class="m3d" hidden data-wrap="/images/mugs/${p.slug}-wrap.webp" data-start="${p.view === "a" ? "3.1416" : "0"}"><span class="m3d-side" aria-live="polite"></span><span class="m3d-note">Illustration only · sides shown for a right-hand hold</span></div>` : p.real ? `<img id="pimg" class="photo" data-base="/images/cases/${p.folder}/" src="${p.imgFor(p.defaultModel)}" alt="${esc(p.name)}" width="600" height="800">` : (p.galleryArt || p.art)}${p.code ? `<canvas id="pcanvas" class="photo" width="1200" height="1600" hidden data-art="/images/cases/designs/${p.slug.replace(/-glass-phone-case$/, "")}-art.webp?v=4"></canvas>` : ""}</div>${p.shownOn ? `<p class="shown-on" id="shown-on">Shown on an ${p.shownOn}. Choose your phone to see it on yours.</p>` : ""}${p.photoMug ? `<div class="views" role="group" aria-label="Mug views"><button type="button" class="view on" data-src="/images/mugs/${p.slug}-${p.view}.webp"><img src="/images/mugs/${p.slug}-${p.view}.webp" alt="" loading="lazy"><span>${p.view === "a" ? "Handle left" : "Handle right"}</span></button><button type="button" class="view" data-src="/images/mugs/${p.slug}-${p.alt}.webp"><img src="/images/mugs/${p.slug}-${p.alt}.webp" alt="" loading="lazy"><span>${p.alt === "a" ? "Handle left" : "Handle right"}</span></button>${p.noExtras ? "" : `<button type="button" class="view v360" data-spin="1" aria-label="3D preview of the design"><svg viewBox="0 0 52 52" aria-hidden="true"><ellipse cx="26" cy="26" rx="19" ry="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M38 17l7 3-5 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="26" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" font-family="DM Sans,sans-serif">3D</text></svg><span>3D preview</span></button>`}</div>${p.noExtras ? "" : `<figure class="flat-wrap"><img src="/images/mugs/${p.slug}-flat.webp" alt="Full wrap design for the ${esc(p.name)}" loading="lazy"><figcaption>The full design, as it wraps around the mug. The NevervoidStore watermark is only on this online preview, not on your mug.</figcaption></figure>`}` : ""}</div>`;
}

function productPage(p) {
  const url = `${BASE}/products/${p.slug}.html`, img = `${BASE}/images/share/${p.slug}.jpg`;
  const imgs = p.photoMug ? [img, `${BASE}/images/mugs/${p.slug}-b.webp`, `${BASE}/images/mugs/${p.slug}-a.webp`] : [img];
  const title = `${p.name} | ${catLabel(p)} ${typeLabel(p)} | Nevervoid Store`;
  const desc = `${p.desc} ${SALE.on ? SALE.label + " " + rupee(salePrice(p)) + " (was " + rupee(p.price) + ")" : rupee(p.price)}, made to order and delivered across Karnataka.`.slice(0, 158);
  const others = PRODUCTS.filter(x => x.id !== p.id);
  // same type only (cases with cases, mugs with mugs), single initial letters left out, picks vary per page
  const pool = others.filter(x => x.type === p.type && x.collection !== "initials");
  const seed = [...p.slug].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const rot = arr => arr.length ? arr.map((_, i) => arr[(i + seed) % arr.length]) : arr;
  const related = [...rot(pool.filter(x => x.cat === p.cat)), ...rot(pool.filter(x => x.cat !== p.cat))].slice(0, 4);
  const jsonld = [
    {"@context":"https://schema.org","@type":"Product","name":p.name,"description":p.long,"image":imgs,"sku":p.id,
     "brand":{"@type":"Brand","name":"Nevervoid Store"},"category":`${catLabel(p)} ${typeLabel(p)}`,
     "offers":{"@type":"Offer","url":url,"priceCurrency":"INR","price":String(salePrice(p)),...(SALE.on ? {"priceValidUntil":SALE.ends} : {}),"availability":"https://schema.org/MadeToOrder","itemCondition":"https://schema.org/NewCondition","seller":{"@id":BASE+"/#org"}}},
    {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Shop","item":BASE+"/"},
      {"@type":"ListItem","position":2,"name":catLabel(p)+" gifts","item":BASE+"/#"+p.cat},
      {"@type":"ListItem","position":3,"name":p.name,"item":url}]}
  ];
  const specs = p.type === "case"
    ? [["Type","Glass phone case"],["Models",`${p.models.length} models: iPhone 11 to iPhone 17 Pro Max, Galaxy S22 Ultra to S25, OnePlus 11 to 12R`],["Print","Full-colour design, printed to order"],["Dispatch","3–5 days, then about 5–8 days to arrive"],["Delivers to","Anywhere in Karnataka (pincodes 56–59)"]]
    : p.type === "mug"
    ? [["Type","11oz ceramic mug"],["Print","Full-colour design, printed to order"],["Theme",catLabel(p)],["Dispatch","3–5 days, then about 5–8 days to arrive"],["Delivers to","Anywhere in Karnataka (pincodes 56–59)"]]
    : [["Type","Printed iPhone case"],["Models","iPhone 13 to iPhone 17 Pro Max, and iPhone Air"],["Print","Full-colour design, printed to order"],["Dispatch","3–5 days, then about 5–8 days to arrive"],["Delivers to","Anywhere in Karnataka (pincodes 56–59)"]];
  return `${head({title, desc, url, image: img, type:"product", root:"../", jsonld})}
<body>
${header("../","")}
<main class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Shop</a> › ${p.collection === "initials" ? `<a href="../initials/">Initials</a>` : p.collection === "cases" ? `<a href="../cases/">Phone cases</a>` : `<a href="../index.html#${p.cat}">${catLabel(p)} gifts</a>`} › <span>${esc(p.name)}</span></nav>
  <section class="pdp">
    ${(() => {
      // swipe between designs of the same kind (all cases, or all ready-made mugs)
      const isDesign = x => x.collection !== "initials" && !/custom/.test(x.id + x.slug);
      const seq = PRODUCTS.filter(x => x.type === p.type && isDesign(x)), i = seq.findIndex(x => x.id === p.id), n = seq.length;
      const at = k => seq[(i + k + n) % n];
      return n > 1 && i >= 0 ? galleryHtml(p).replace('<div class="gallery ', `<div data-swipe data-prev="/products/${at(-1).slug}.html" data-next="/products/${at(1).slug}.html" data-next-img="${at(1).collection === "cases" ? `/images/cases/designs/${at(1).slug.replace("-glass-phone-case", "")}.webp?v=4` : at(1).photoMug ? `/images/mugs/${at(1).slug}-b.webp` : ""}" data-pos="${i + 1}" data-n="${n}" data-kind="${p.type === "case" ? "case designs" : "mug designs"}" class="gallery `) : galleryHtml(p);
    })()}
    <script defer src="/assets/swipe.js"></script>
    <div>
      <div class="tags"><span class="tag">${catLabel(p)} · ${typeLabel(p)}</span></div>
      <h1>${esc(p.name)}</h1>
      ${priceHtml(p,"pprice")}${SALE.on ? `<div class="save">You save ${rupee(p.price - salePrice(p))} · ${SALE.label} ends 25 Dec</div>` : ""}
      <div class="pnote">Made to order · delivering across Karnataka</div>
      <div class="share"><button type="button" class="share-btn" data-share-url="${BASE}/products/${p.slug}.html" data-share-title="${esc(p.name)}" data-share-text="${esc(p.name)} · ${SALE.on ? rupee(salePrice(p)) + " in the Christmas Sale" : rupee(p.price)} at NevervoidStore" aria-haspopup="true"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" fill="none" stroke="currentColor" stroke-width="2"/></svg><span>Share</span></button><div class="share-menu" hidden role="menu"><a role="menuitem" data-net="wa" target="_blank" rel="noopener">WhatsApp</a><a role="menuitem" data-net="fb" target="_blank" rel="noopener">Facebook</a><a role="menuitem" data-net="x" target="_blank" rel="noopener">X</a><button type="button" role="menuitem" data-net="copy">Copy link</button></div></div>
      <p class="lead">${esc(p.long)}</p>
      <div class="buybox">
      ${orderBlock(p)}
      </div>
      <ul class="checks">
        <li data-paytrust>Order on WhatsApp. We confirm every detail before you pay</li>
        <li>Printed fresh when you order</li>
        <li>Arrived broken? <a href="../policies/returns.html">Free replacement or refund</a></li>
      </ul>
      <div class="trust-links"><a href="../policies/shipping.html">🚚 Ships in 3–5 days</a><a href="../policies/returns.html">↺ Easy replacements</a><a href="../policies/privacy.html">🔒 Your data stays private</a></div>
      ${p.steps ? `<div class="pdp-steps"><h2>How custom orders work</h2><ol><li>Place your order and DM us a clear, well-lit photo of your pet.</li><li>Pick a style: watercolour, cartoon, minimal line art and more.</li><li>We send you a preview. Ask for changes until you love it.</li><li>We print and ship once you approve.</li></ol></div>` : ""}
      <div class="specs"><h2>Details</h2><dl>${specs.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl></div>
    </div>
  </section>
  <section class="related">
    <h2>You might also like</h2>
    <div class="grid">${related.map(r => card(r, "../")).join("\n")}</div>
  </section>
</main>
${footer("../")}`;
}

function indexPage() {
  const title = "Christmas Mugs, Pet Mugs & Phone Cases | NevervoidStore Bengaluru";
  const desc = (SALE.on ? SALE.label + ": " + SALE.pct + "% off. " : "") + "Made-to-order Christmas mugs, pet mugs, custom pet portrait gifts and phone cases. Delivered across Karnataka. Order by 12 December for Christmas.";
  const jsonld = [
    Object.assign({"@context":"https://schema.org"}, org),
    {"@context":"https://schema.org","@type":"WebSite","name":"Nevervoid Store","url":BASE+"/"},
    {"@context":"https://schema.org","@type":"ItemList","itemListElement":PRODUCTS.map((p,i)=>({"@type":"ListItem","position":i+1,"url":`${BASE}/products/${p.slug}.html`,"name":p.name}))}
  ];
  return `${head({title, desc, url: BASE+"/", image: BASE+"/images/og-home.jpg", root:"", jsonld})}
<body>
${header("","shop")}
<main id="top">
  <div class="wrap">
    <section class="hero">
      <span class="eyebrow">Christmas Drop 2026</span>
      <h1>Mugs &amp; phone cases, <em>made to order</em> for you</h1>
      <p>Cosy Christmas designs and cute pet prints. Or send us a photo of your pet and we'll turn it into a custom portrait for your mug or case.</p>
      <div class="deadline">🎁 Order by 12 December for delivery before Christmas</div>
    </section>
    <div class="trust">
      <div data-paytrust><b>Easy ordering</b>Order on WhatsApp. We confirm every detail before you pay</div>
      <div><b>Made to order</b>Printed fresh when you order</div>
      <div><b>Delivering across Karnataka</b>Dispatched in 3–5 days, delivered in about 5–8 days. <a href="policies/shipping.html">Details</a></div>
      <div><b>Damage-free promise</b>Arrived broken? We replace it. <a href="policies/returns.html">See policy</a></div>
    </div>
    <div class="filters" id="filters">
      <button class="on" data-f="all">All</button>
      <button data-f="christmas">🎄 Christmas</button>
      <button data-f="pets">🐾 Pets</button>
      <button data-f="mug">Mugs</button>
      <button data-f="case">Phone cases</button>
      <a class="chip-link" href="initials/">🔤 Initials A–Z</a>
    </div>
    <div class="grid" id="grid">
${(() => { const list = PRODUCTS.filter(p => !p.collection).map(p => card(p, "")); list.splice(0, 0, nameMugCard("")); list.splice(1, 0, wishCard("")); list.splice(2, 0, initialsCard("")); list.splice(4, 0, casesCard("")); return list.join("\n"); })()}
    </div>
  </div>
  <section class="band">
    <div class="wrap">
      <h2>How ordering works</h2>
      <div class="steps">
        <div><div class="n">1</div><b>Pick your design</b><span>Open any product. For cases, choose your phone model.</span></div>
        <div><div class="n">2</div><b>Pay securely</b><span>UPI, card or netbanking through Razorpay. You get a receipt by email straight away.</span></div>
        <div><div class="n">3</div><b>We print &amp; ship</b><span>Your order is made fresh and shipped with tracking.</span></div>
      </div>
    </div>
  </section>
  <div class="faq">
    <h2>Questions</h2>
    <details><summary>How do custom pet orders work?</summary><p>Order the custom mug or case, then DM us a clear, well-lit photo of your pet on Instagram (@nevervoidstore). We create a custom portrait in your chosen style (watercolour, cartoon, minimal line art and more), touch it up, and send you a preview to approve before printing. Free changes until you're happy.</p></details>
    <details><summary>When will my order arrive?</summary><p>Dispatched in 3–5 days, delivered in about 5–8 days. You'll get tracking details once it ships.</p></details>
    <details><summary>Do you do bulk or corporate orders?</summary><p>Yes. See our <a href="corporate.html">corporate gifting page</a> for logo mugs, team pet mugs and bulk pricing from ₹319 a piece.</p></details>
    <details><summary>What if it arrives damaged?</summary><p>Send us a photo or unboxing video within 48 hours of delivery and we'll ship a free replacement.</p></details>
  </div>
  <p class="intro-seo">Nevervoid Store makes Christmas mugs, pet mugs, custom pet portrait mugs and glass phone cases to order, delivered across Karnataka. Each piece is printed fresh for you.</p>
</main>
${footer("")}`;
}

// ---------- blog ----------
const POSTS = require(path.join(SRC, "posts.js"));
const byId = id => PRODUCTS.find(p => p.id === id);
const fmtDate = d => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric", timeZone:"UTC"});
const readMins = html => Math.max(2, Math.round(html.replace(/<[^>]+>/g," ").split(/\s+/).length / 200));
function renderBody(html){
  return html.replace(/\{\{product:([a-z-]+)\}\}/g, (_, id) => { const p = byId(id);
    return `<a class="inline-prod" href="../products/${p.slug}.html"><div class="thumb">${p.art}</div><div><b>${esc(p.name)}</b><span>${esc(p.desc)}</span><br><em>${SALE.on ? `<s>${rupee(p.price)}</s> ${rupee(salePrice(p))}` : rupee(p.price)} · View &amp; order →</em></div></a>`; })
  .replace(/\{\{cta:corporate\}\}/g, `<div class="cta-box"><b>Gifting for a whole team?</b>Logo mugs and team pet mugs from ₹319 a piece, with a sample before you commit.<br><a href="../corporate.html">See corporate pricing</a></div>`);
}
function postPage(post){
  const url = `${BASE}/blog/${post.slug}.html`, cover = byId(post.cover), img = `${BASE}/images/products/${cover.slug}.jpg`;
  const jsonld = [
    {"@context":"https://schema.org","@type":"BlogPosting","headline":post.title,"description":post.desc,"image":[img],"datePublished":post.date,"dateModified":post.date,
     "author":{"@type":"Organization","name":"Nevervoid Store","url":BASE+"/"},"publisher":{"@type":"Organization","name":"Nevervoid Store","logo":{"@type":"ImageObject","url":BASE+"/images/og-home.jpg"}},"mainEntityOfPage":url},
    {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Shop","item":BASE+"/"},
      {"@type":"ListItem","position":2,"name":"Blog","item":BASE+"/blog/index.html"},
      {"@type":"ListItem","position":3,"name":post.title,"item":url}]}];
  const more = POSTS.filter(x => x.slug !== post.slug);
  return `${head({title: post.title + " | Nevervoid Store", desc: post.desc, url, image: img, type:"article", root:"../", jsonld})}
<body>
${header("../","blog")}
<main>
  <article class="post">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Shop</a> › <a href="index.html">Blog</a></nav>
    <h1>${esc(post.title)}</h1>
    <div class="meta">${fmtDate(post.date)} · ${readMins(post.body)} min read</div>
    <div class="cover stage ${cover.cat}">${cover.art}</div>
    <div class="body">${renderBody(post.body)}</div>
  </article>
  <section class="wrap related">
    <h2>More from the blog</h2>
    <div class="posts" style="grid-template-columns:repeat(2,1fr)">${more.map(m => postCard(m)).join("")}</div>
  </section>
</main>
${footer("../")}`;
}
function postCard(post){
  const c = byId(post.cover);
  return `<a class="pcard" href="${post.slug}.html"><div class="stage ${c.cat}">${c.art}</div><div class="pb"><div class="meta">${fmtDate(post.date)} · ${readMins(post.body)} min read</div><h2>${esc(post.title)}</h2><p>${esc(post.excerpt)}</p></div></a>`;
}
function blogIndex(){
  const url = BASE + "/blog/index.html";
  const jsonld = [{"@context":"https://schema.org","@type":"Blog","name":"Nevervoid Store Blog","url":url,
    "blogPost":POSTS.map(p=>({"@type":"BlogPosting","headline":p.title,"url":`${BASE}/blog/${p.slug}.html`,"datePublished":p.date}))}];
  return `${head({title:"Gift Ideas & Guides | Nevervoid Store Blog", desc:"Gift ideas, corporate gifting guides and pet portrait tips from Nevervoid Store, makers of custom mugs and phone cases in Bengaluru.", url, image: BASE+"/images/og-home.jpg", root:"../", jsonld})}
<body>
${header("../","blog")}
<main class="wrap">
  <section class="blog-hero"><span class="eyebrow">The Nevervoid blog</span><h1>Gift ideas &amp; guides</h1><p>Practical ideas for Christmas gifts, team gifting and custom pet portraits.</p></section>
  <div class="posts">${POSTS.map(postCard).join("")}</div>
</main>
${footer("../")}`;
}

// ---------- policies ----------
const { CONTACT, PAGES } = POL;
function policyPage(pg){
  const url = `${BASE}/policies/${pg.slug}.html`;
  const jsonld = [{"@context":"https://schema.org","@type": pg.slug==="contact" ? "ContactPage" : (pg.slug==="about" ? "AboutPage" : "WebPage"),"name":pg.title,"url":url,"dateModified":"2026-11-04","publisher":{"@id":BASE+"/#org"}}];
  return `${head({title: pg.title + " | NevervoidStore", desc: pg.desc, url, image: BASE+"/images/og-home.jpg", root:"../", jsonld})}
<body>
${header("../","")}
<main class="policy">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Shop</a> › <span>${pg.title}</span></nav>
  <h1>${pg.title}</h1>
  <div class="meta">Last updated ${CONTACT.updated}</div>
  ${pg.body()}
  <nav class="policy-nav" aria-label="Policies">${PAGES.map(x => `<a class="${x.slug===pg.slug?"on":""}" href="${x.slug}.html">${x.nav}</a>`).join("")}</nav>
</main>
${footer("../")}`;
}

// ---------- write ----------
fs.rmSync(OUT, {recursive:true, force:true});
fs.mkdirSync(path.join(OUT,"assets"), {recursive:true});
fs.mkdirSync(path.join(OUT,"products"), {recursive:true});
fs.mkdirSync(path.join(OUT,"images","products"), {recursive:true});
fs.writeFileSync(path.join(OUT,"assets","store.css"), fs.readFileSync(path.join(SRC,"base.css"),"utf8") + extraCss);
fs.writeFileSync(path.join(OUT,"assets","store.js"), storeJs.replace("__WA__", POL.CONTACT.whatsapp).replace("__RZP__", POL.CONTACT.razorpayPage || "").replace("__RZPPAGES__", JSON.stringify(POL.CONTACT.rzpPages || {})).replace("__API__", (POL.CONTACT.checkoutApi || process.env.CHECKOUT_ON) ? TEAM_API : ""));
fs.writeFileSync(path.join(OUT,"assets","festive.css"), fs.readFileSync(path.join(SRC,"festive.css"),"utf8"));
fs.copyFileSync(path.join(SRC,"mug3d.js"), path.join(OUT,"assets","mug3d.js"));
fs.writeFileSync(path.join(OUT,"assets","report.js"), fs.readFileSync(path.join(SRC,"report.js"),"utf8").replace("__WA__", POL.CONTACT.whatsapp));
fs.writeFileSync(path.join(OUT,"assets","chat.js"), fs.readFileSync(path.join(SRC,"chat.js"),"utf8").replace("__WA__", require(path.join(SRC,"policies.js")).CONTACT.whatsapp));
fs.writeFileSync(path.join(OUT,"assets","festive.js"), fs.readFileSync(path.join(SRC,"festive.js"),"utf8").replace("__SALE__", JSON.stringify(SALE)));
fs.writeFileSync(path.join(OUT,"index.html"), indexPage());
fs.mkdirSync(path.join(OUT,"custom-mug"),{recursive:true}); fs.writeFileSync(path.join(OUT,"custom-mug","index.html"), customMugPage());
fs.copyFileSync(path.join(SRC,"custommug","custom-mug.js"), path.join(OUT,"assets","custom-mug.js"));
fs.copyFileSync(path.join(SRC,"custommug","mugdesign.js"), path.join(OUT,"assets","mugdesign.js"));
fs.copyFileSync(path.join(SRC,"custommug","mugcolor.js"), path.join(OUT,"assets","mugcolor.js"));
fs.copyFileSync(path.join(SRC,"custommug","wish.js"), path.join(OUT,"assets","wish.js"));
fs.copyFileSync(path.join(SRC,"custommug","swipe.js"), path.join(OUT,"assets","swipe.js"));
fs.mkdirSync(path.join(OUT,"assets","wish"),{recursive:true}); fs.readdirSync(path.join(SRC,"wish")).forEach(f => fs.copyFileSync(path.join(SRC,"wish",f), path.join(OUT,"assets","wish",f)));
if (fs.existsSync(path.join(SRC,"send-a-wish.jpg"))) fs.copyFileSync(path.join(SRC,"send-a-wish.jpg"), path.join(OUT,"images","send-a-wish.jpg"));
fs.mkdirSync(path.join(OUT,"send-a-wish"),{recursive:true}); fs.writeFileSync(path.join(OUT,"send-a-wish","index.html"), wishRedirect());
fs.mkdirSync(path.join(OUT,WISH_PATH),{recursive:true}); fs.writeFileSync(path.join(OUT,WISH_PATH,"index.html"), wishPage());
Object.entries(WISH_OCC).forEach(([k,x]) => { fs.mkdirSync(path.join(OUT,WISH_PATH,x.seo.slug),{recursive:true}); fs.writeFileSync(path.join(OUT,WISH_PATH,x.seo.slug,"index.html"), wishPage(k)); });
fs.copyFileSync(path.join(SRC,"nv-logo.png"), path.join(OUT,"images","nv-logo.png"));
fs.copyFileSync(path.join(SRC,"custommug","team.js"), path.join(OUT,"assets","team.js"));
fs.copyFileSync(path.join(SRC,"custommug","team-template.xlsx"), path.join(OUT,"assets","team-template.xlsx"));
fs.mkdirSync(path.join(OUT,"team"),{recursive:true}); fs.writeFileSync(path.join(OUT,"team","index.html"), teamPage());
if (TEAM_API) { fs.mkdirSync(path.join(OUT,"team","join"),{recursive:true}); fs.writeFileSync(path.join(OUT,"team","join","index.html"), customMugPage(true)); }
fs.mkdirSync(path.join(OUT,"assets","custommug"),{recursive:true}); for (const f of ["mug-a.jpg","mug-b.jpg","map-a-s.png","map-a-v.png","map-b-s.png","map-b-v.png","tint-a.png","tint-b.png","iconindex.json"]) fs.copyFileSync(path.join(SRC,"custommug",f), path.join(OUT,"assets","custommug",f));
fs.mkdirSync(path.join(OUT,"assets","fonts"),{recursive:true}); for (const f of fs.readdirSync(path.join(SRC,"custommug","fonts"))) fs.copyFileSync(path.join(SRC,"custommug","fonts",f), path.join(OUT,"assets","fonts",f));
if (fs.existsSync(path.join(SRC,"custommug","sample.jpg"))) fs.copyFileSync(path.join(SRC,"custommug","sample.jpg"), path.join(OUT,"images","custom-name-mug.jpg"));
fs.mkdirSync(path.join(OUT,"cases"),{recursive:true}); fs.writeFileSync(path.join(OUT,"cases","index.html"), casesPage());
fs.mkdirSync(path.join(OUT,"initials"),{recursive:true}); fs.writeFileSync(path.join(OUT,"initials","index.html"), initialsPage());
INITIALS().forEach(p => { const d = path.join(OUT,"initials",p.letter.toLowerCase()); fs.mkdirSync(d,{recursive:true}); fs.writeFileSync(path.join(d,"index.html"), initialsPage(p.letter)); });
PRODUCTS.forEach(p => fs.writeFileSync(path.join(OUT,"products",p.slug+".html"), productPage(p)));
fs.writeFileSync(path.join(OUT,".nojekyll"), "");
fs.mkdirSync(path.join(OUT,"images","cases"),{recursive:true}); fs.mkdirSync(path.join(OUT,"images","cases","designs"),{recursive:true}); for (const f of fs.readdirSync(path.join(SRC,"casedesigns"))) fs.copyFileSync(path.join(SRC,"casedesigns",f), path.join(OUT,"images","cases","designs",f)); fs.mkdirSync(path.join(OUT,"images","cases","frames"),{recursive:true}); for (const f of fs.readdirSync(path.join(SRC,"caseframes"))) if (/\.(webp|png|json)$/.test(f)) fs.copyFileSync(path.join(SRC,"caseframes",f), path.join(OUT,"images","cases","frames",f)); fs.copyFileSync(path.join(SRC,"custom","custom-pet-case.webp"), path.join(OUT,"images","cases","custom-pet-case.webp"));
fs.writeFileSync(path.join(OUT,"thank-you.html"), thankYouPage());
fs.mkdirSync(path.join(OUT,"policies"), {recursive:true});
PAGES.forEach(pg => fs.writeFileSync(path.join(OUT,"policies",pg.slug+".html"), policyPage(pg)));
fs.mkdirSync(path.join(OUT,"blog"), {recursive:true});
fs.writeFileSync(path.join(OUT,"blog","index.html"), blogIndex());
POSTS.forEach(p => fs.writeFileSync(path.join(OUT,"blog",p.slug+".html"), postPage(p)));
fs.writeFileSync(path.join(OUT,"robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);
const urls = [BASE+"/", BASE+"/custom-mug/", BASE+"/"+WISH_PATH+"/", ...Object.values(WISH_OCC).map(x => `${BASE}/${WISH_PATH}/${x.seo.slug}/`), BASE+"/team/", BASE+"/cases/", BASE+"/initials/", ...INITIALS().map(p => `${BASE}/initials/${p.letter.toLowerCase()}/`), BASE+"/corporate.html", BASE+"/blog/index.html", ...PAGES.map(pg=>`${BASE}/policies/${pg.slug}.html`), ...POSTS.map(p=>`${BASE}/blog/${p.slug}.html`), ...PRODUCTS.map(p=>`${BASE}/products/${p.slug}.html`)];
fs.writeFileSync(path.join(OUT,"sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT,"404.html"), `${head({title:"Page not found | Nevervoid Store", desc:"This page doesn't exist. Browse our Christmas mugs, pet mugs and phone cases.", url:BASE+"/404.html", image:BASE+"/images/og-home.jpg", root:"/"})}
<body>${header("/","")}<main class="wrap" style="text-align:center;padding:80px 20px"><h1 style="font-family:Fraunces,serif;font-size:40px">This page wandered off</h1><p style="color:var(--muted);margin:10px 0 24px">Let's get you back to the mugs.</p><a class="buy" style="display:inline-block;padding:12px 22px" href="/index.html">Browse all products</a></main>${footer("/")}`);
// image manifest for the renderer
fs.writeFileSync(path.join(SRC,"images.json"), JSON.stringify(PRODUCTS.map(p=>({slug:p.slug, cat:p.cat, art:p.art, photo: p.photoSrc || null, name:p.name, type:typeLabel(p), price:p.price, sale: SALE.on ? salePrice(p) : null, pct: SALE.pct})), null, 0));
// copy mug photos
fs.mkdirSync(path.join(OUT,"images","mugs"),{recursive:true});
for (const f of fs.readdirSync(path.join(SRC,"realmugs"))) if (!/-print\.png$/.test(f)) fs.copyFileSync(path.join(SRC,"realmugs",f), path.join(OUT,"images","mugs",f));
// copy real product images
REAL.forEach(r => { const dst = path.join(OUT,"images","cases",r.folder); fs.mkdirSync(dst,{recursive:true});
  for (const f of fs.readdirSync(path.join(SRC,"real",r.folder))) fs.copyFileSync(path.join(SRC,"real",r.folder,f), path.join(dst,f)); });
console.log("built", PRODUCTS.length, "product pages");
