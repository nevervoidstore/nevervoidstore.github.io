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
  r.real = true;
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
</header>`;
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
</body>
</html>`;
}

function orderBlock(p) {
  if (p.models) {
    const brands = [...new Set(p.models.map(m => m.brand))];
    return `<label class="field">Your phone model
        <select class="model" aria-label="Phone model"><option value="">Choose your phone</option>${brands.map(b => `<optgroup label="${b}">${p.models.filter(m=>m.brand===b).map(m=>`<option${p.imgFor ? ` data-img="${p.imgFor(m.slug)}"` : ""}>${m.label}</option>`).join("")}</optgroup>`).join("")}</select></label>
      <label class="field">Delivery pincode <span class="hint">(Karnataka only for now)</span>
        <input class="pin" type="text" inputmode="numeric" maxlength="6" placeholder="e.g. 560001" autocomplete="postal-code"></label>
      <div class="pin-msg" hidden></div>
      <button class="buy" type="button" data-order data-rzp="${p.rzpItem}" data-id="${p.id}" data-name="${esc(p.name)}" data-price="${salePrice(p)}">Order now · ${rupee(salePrice(p))}</button>
      <button class="ask" type="button" data-ask data-name="${esc(p.name)}">Ask a question</button>`;
  }
  return `${p.type==="case" ? `<label class="field">Your iPhone model
        <select class="model" aria-label="iPhone model"><option value="">Choose your iPhone</option>${IPHONES.map(m=>`<option>${m}</option>`).join("")}</select></label>` : ""}
      <label class="field">Delivery pincode <span class="hint">(Karnataka only for now)</span>
        <input class="pin" type="text" inputmode="numeric" maxlength="6" placeholder="e.g. 560001" autocomplete="postal-code"></label>
      <div class="pin-msg" hidden></div>
      <button class="buy" type="button" data-order data-rzp="${p.rzpItem}" data-id="${p.id}" data-name="${esc(p.name)}" data-price="${salePrice(p)}">Order now · ${rupee(salePrice(p))}</button>
      <button class="ask" type="button" data-ask data-name="${esc(p.name)}">Ask a question</button>`;
}

function card(p, root) {
  const href = `${root}products/${p.slug}.html`;
  return `<article class="card" data-cat="${(p.cats||[p.cat]).join(" ")}" data-type="${p.type}">
    <a class="stage ${p.cat}${p.photoMug ? " ph" : ""}" href="${href}" aria-label="${esc(p.name)}">${SALE.on ? `<span class="fx-badge">−${SALE.pct}%</span>` : ""}${p.art}</a>
    <div class="info">
      <div class="tags"><span class="tag">${typeLabel(p)}</span>${p.isNew?'<span class="tag new">· New</span>':''}</div>
      <h3><a href="${href}">${esc(p.name)}</a></h3>
      <p>${esc(p.desc)}</p>
      ${priceHtml(p)}
      <a class="buy" href="${href}">View &amp; order</a>
    </div>
  </article>`;
}

const INITIALS = () => PRODUCTS.filter(p => p.collection === "initials").sort((a, b) => a.letter.localeCompare(b.letter));
function initialsCard(root) {
  const items = INITIALS(); if (!items.length) return "";
  const lead = items[0], href = `${root}initials/`;
  const from = Math.min(...items.map(salePrice)), was = Math.min(...items.map(p => p.price));
  return `<article class="card coll-card" data-cat="christmas" data-type="mug">
    <a class="stage christmas ph" href="${href}" aria-label="Christmas Initial Mugs">${SALE.on ? `<span class="fx-badge">−${SALE.pct}%</span>` : ""}<img class="photo" src="/images/mugs/${lead.slug}-${lead.view}.webp" alt="Christmas Initial Mugs" width="620" height="620" loading="lazy"><span class="coll-letters" aria-hidden="true">A–Z</span></a>
    <div class="info">
      <div class="tags"><span class="tag">Collection</span><span class="tag new">· New</span></div>
      <h3><a href="${href}">Christmas Initial Mugs</a></h3>
      <p>Their first letter in a Santa hat. Pick a letter A to Z.</p>
      <div class="price">${SALE.on ? `<span class="was">${rupee(was)}</span> ` : ""}<span class="now">From ${rupee(from)}</span></div>
      <a class="buy" href="${href}">Find your letter</a>
    </div>
  </article>`;
}
function initialsPage() {
  const items = INITIALS(), url = `${BASE}/initials/`, have = Object.fromEntries(items.map(p => [p.letter, p]));
  const lead = items[0], wa = POL.CONTACT.whatsapp;
  const data = Object.fromEntries(items.map(p => [p.letter, { slug: p.slug, name: p.name, id: p.id, view: p.view, alt: p.alt, start: p.view === "a" ? "3.1416" : "0" }]));
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(L => have[L]
    ? `<button type="button" class="lt ok${L === lead.letter ? " on" : ""}" data-letter="${L}" aria-pressed="${L === lead.letter}" aria-label="Letter ${L}">${L}</button>`
    : `<button type="button" class="lt soon" disabled aria-label="Letter ${L}, coming soon" title="Coming soon">${L}</button>`).join("");
  const desc = "Christmas mugs with a big festive initial in a Santa hat, printed on both sides. Choose your letter and order. Made to order, delivered across Karnataka.";
  const jsonld = [
    {"@context":"https://schema.org","@type":"CollectionPage","name":"Christmas Initial Mugs","url":url,"description":desc,
      "mainEntity":{"@type":"ItemList","itemListElement":items.map((p,i)=>({"@type":"ListItem","position":i+1,"url":`${BASE}/products/${p.slug}.html`,"name":p.name}))}},
    {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Shop","item":BASE+"/"},{"@type":"ListItem","position":2,"name":"Christmas Initial Mugs","item":url}]}];
  const askUrl = `https://wa.me/${wa}?text=${encodeURIComponent("Hi Antony, I'd like the Christmas initial mug with the letter ")}`;
  return `${head({title:"Christmas Initial Mugs A–Z | Personalised Letter Mugs | Nevervoid Store", desc, url, image:`${BASE}/images/share/${lead.slug}.jpg`, root:"../", jsonld})}
<body>
${header("../","shop")}
<main class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Shop</a> › <span>Christmas Initial Mugs</span></nav>
  <section class="pdp ini">
    ${galleryHtml(lead)}
    <div>
      <div class="tags"><span class="tag">Christmas · Initial mug</span><span class="tag new">· New</span></div>
      <h1 id="ini-name">${esc(lead.name)}</h1>
      ${priceHtml(lead,"pprice")}${SALE.on ? `<div class="save">You save ${rupee(lead.price - salePrice(lead))} · ${SALE.label} ends 25 Dec</div>` : ""}
      <div class="pnote">Made to order · delivering across Karnataka</div>
      <div class="ini-pick">
        <div class="pick-head"><b>Choose a letter</b><span id="ini-chosen">Selected: ${lead.letter}</span></div>
        <div class="letters" role="group" aria-label="Choose a letter">${letters}</div>
        ${items.length < 26 ? `<p class="pick-note">Greyed-out letters are coming soon. Need one now? <a href="${askUrl}" target="_blank" rel="noopener">Ask on WhatsApp</a></p>` : ""}
      </div>
      <div class="share"><button type="button" class="share-btn" data-share-url="${url}" data-share-title="Christmas Initial Mugs" data-share-text="Christmas initial mugs · ${SALE.on ? rupee(salePrice(lead)) + " in the Christmas Sale" : rupee(lead.price)} at NevervoidStore" aria-haspopup="true"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" fill="none" stroke="currentColor" stroke-width="2"/></svg><span>Share</span></button><div class="share-menu" hidden role="menu"><a role="menuitem" data-net="wa" target="_blank" rel="noopener">WhatsApp</a><a role="menuitem" data-net="fb" target="_blank" rel="noopener">Facebook</a><a role="menuitem" data-net="x" target="_blank" rel="noopener">X</a><button type="button" role="menuitem" data-net="copy">Copy link</button></div></div>
      <p class="lead">A big festive initial in a Santa hat, strung with fairy lights, with a snowman, gifts and holly. Printed on both sides of an 11oz ceramic mug, so the letter faces you and whoever sits opposite.</p>
      <div class="buybox">
      ${orderBlock(lead)}
      </div>
    </div>
  </section>
</main>
${footer("../")}
<script>
(function(){
  var D = ${JSON.stringify(data)};
  function pick(L, push){
    var d = D[L]; if (!d) return;
    document.querySelectorAll(".letters .lt.ok").forEach(function(b){ var on = b.dataset.letter === L; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    document.getElementById("ini-name").textContent = d.name;
    document.getElementById("ini-chosen").textContent = "Selected: " + L;
    var img = document.getElementById("pimg"), views = document.querySelectorAll(".views .view:not(.v360)");
    var srcs = ["/images/mugs/" + d.slug + "-" + d.view + ".webp", "/images/mugs/" + d.slug + "-" + d.alt + ".webp"];
    views.forEach(function(v, i){ v.dataset.src = srcs[i]; var t = v.querySelector("img"); if (t) t.src = srcs[i]; });
    var on = document.querySelector(".views .view.on"), onIdx = Array.prototype.indexOf.call(views, on);
    if (img) img.src = srcs[onIdx >= 0 ? onIdx : 0];
    var flat = document.querySelector(".flat-wrap img"); if (flat) flat.src = "/images/mugs/" + d.slug + "-flat.webp";
    var box = document.getElementById("m3d");
    if (box) { box.dataset.wrap = "/images/mugs/" + d.slug + "-wrap.webp"; box.dataset.start = d.start;
      if (box._m) { box._m.destroy(); box._m = null; if (!box.hidden) { var b3 = document.querySelector(".views .v360"); if (b3) b3.click(); } } }
    document.querySelectorAll(".buybox [data-order], .buybox [data-ask]").forEach(function(b){ b.dataset.name = d.name; if (b.dataset.id) b.dataset.id = d.id; });
    if (push) history.replaceState(null, "", "?letter=" + L);
  }
  document.querySelectorAll(".letters .lt.ok").forEach(function(b){ b.addEventListener("click", function(){ pick(b.dataset.letter, true); }); });
  var q = (location.search.match(/letter=([A-Za-z])/) || [])[1]; if (q) pick(q.toUpperCase(), false);
})();
</script>`;
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
}`;

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
    if (CONFIG.whatsapp){ location.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(text); return; }
    copy(text, "Order details copied. Paste them in your Instagram DM");
    setTimeout(()=>{ location.href = dmUrl; }, 900);
  }
  window.nvToast = toast;
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
      if (CONFIG.razorpayPage && btn.dataset.rzp){
        const f = CONFIG.rzpFields, q = new URLSearchParams();
        q.set(btn.dataset.rzp, "1"); q.set(f.product, btn.dataset.name);
        if (model) q.set(f.model, model);
        q.set(f.pincode, pin);
        location.href = CONFIG.razorpayPage + (CONFIG.razorpayPage.includes("?") ? "&" : "?") + q.toString();
        return;
      }
      send(text);
    });
  });
  document.querySelectorAll(".model").forEach(sel => sel.addEventListener("change", () => {
    const o = sel.selectedOptions[0], img = document.getElementById("pimg");
    if (img && o && o.dataset.img) { img.src = o.dataset.img; img.alt = img.alt.split(" — ")[0] + " — " + o.value; }
  }));
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
  return `<div class="gal-col"><div class="gallery ${p.cat}${p.photoMug ? " ph" : ""}" role="img" aria-label="${esc(p.name)} mock-up">${SALE.on ? `<span class="fx-badge big">−${SALE.pct}%</span>` : ""}${p.photoMug ? `<img id="pimg" class="photo" src="/images/mugs/${p.slug}-${p.view}.webp" alt="${esc(p.name)}" width="620" height="620"><div id="m3d" class="m3d" hidden data-wrap="/images/mugs/${p.slug}-wrap.webp" data-start="${p.view === "a" ? "3.1416" : "0"}"><span class="m3d-side" aria-live="polite"></span><span class="m3d-note">Illustration only · sides shown for a right-hand hold</span></div>` : p.real ? `<img id="pimg" class="photo" src="${p.imgFor(p.defaultModel)}" alt="${esc(p.name)}" width="600" height="800">` : p.art}</div>${p.photoMug ? `<div class="views" role="group" aria-label="Mug views"><button type="button" class="view on" data-src="/images/mugs/${p.slug}-${p.view}.webp"><img src="/images/mugs/${p.slug}-${p.view}.webp" alt="" loading="lazy"><span>${p.view === "a" ? "Handle left" : "Handle right"}</span></button><button type="button" class="view" data-src="/images/mugs/${p.slug}-${p.alt}.webp"><img src="/images/mugs/${p.slug}-${p.alt}.webp" alt="" loading="lazy"><span>${p.alt === "a" ? "Handle left" : "Handle right"}</span></button><button type="button" class="view v360" data-spin="1" aria-label="3D preview of the design"><svg viewBox="0 0 52 52" aria-hidden="true"><ellipse cx="26" cy="26" rx="19" ry="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M38 17l7 3-5 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="26" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" font-family="DM Sans,sans-serif">3D</text></svg><span>3D preview</span></button></div><figure class="flat-wrap"><img src="/images/mugs/${p.slug}-flat.webp" alt="Full wrap design for the ${esc(p.name)}" loading="lazy"><figcaption>The full design, as it wraps around the mug. The NevervoidStore watermark is only on this online preview, not on your mug.</figcaption></figure>` : ""}</div>`;
}

function productPage(p) {
  const url = `${BASE}/products/${p.slug}.html`, img = `${BASE}/images/share/${p.slug}.jpg`;
  const imgs = p.photoMug ? [img, `${BASE}/images/mugs/${p.slug}-b.webp`, `${BASE}/images/mugs/${p.slug}-a.webp`] : [img];
  const title = `${p.name} | ${catLabel(p)} ${typeLabel(p)} | Nevervoid Store`;
  const desc = `${p.desc} ${SALE.on ? SALE.label + " " + rupee(salePrice(p)) + " (was " + rupee(p.price) + ")" : rupee(p.price)}, made to order and delivered across Karnataka.`.slice(0, 158);
  const others = PRODUCTS.filter(x => x.id !== p.id);
  const related = [...others.filter(x => x.cat === p.cat), ...others.filter(x => x.cat !== p.cat && x.type === p.type)].slice(0, 4);
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
  <nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Shop</a> › ${p.collection === "initials" ? `<a href="../initials/">Initials</a>` : `<a href="../index.html#${p.cat}">${catLabel(p)} gifts</a>`} › <span>${esc(p.name)}</span></nav>
  <section class="pdp">
    ${galleryHtml(p)}
    <div>
      <div class="tags"><span class="tag">${catLabel(p)} · ${typeLabel(p)}</span>${p.isNew?'<span class="tag new">· New</span>':''}</div>
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
      <div class="deadline">🎁 Order by 12 December for delivery before Christmas</div>${SALE.on ? `<div class="hero-sale">${SALE.label}: <b>${SALE.pct}% off</b> every mug &amp; case</div>` : ""}
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
${(() => { const list = PRODUCTS.filter(p => !p.collection).map(p => card(p, "")); list.splice(1, 0, initialsCard("")); return list.join("\n"); })()}
    </div>
  </div>
  <section class="band">
    <div class="wrap">
      <h2>How ordering works</h2>
      <div class="steps">
        <div><div class="n">1</div><b>Pick your design</b><span>Open any product. For cases, choose your iPhone model.</span></div>
        <div><div class="n">2</div><b>Order by DM</b><span>Your order details are copied for you. Just paste and send.</span></div>
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
fs.writeFileSync(path.join(OUT,"assets","store.js"), storeJs.replace("__WA__", POL.CONTACT.whatsapp).replace("__RZP__", POL.CONTACT.razorpayPage || ""));
fs.writeFileSync(path.join(OUT,"assets","festive.css"), fs.readFileSync(path.join(SRC,"festive.css"),"utf8"));
fs.copyFileSync(path.join(SRC,"mug3d.js"), path.join(OUT,"assets","mug3d.js"));
fs.writeFileSync(path.join(OUT,"assets","chat.js"), fs.readFileSync(path.join(SRC,"chat.js"),"utf8").replace("__WA__", require(path.join(SRC,"policies.js")).CONTACT.whatsapp));
fs.writeFileSync(path.join(OUT,"assets","festive.js"), fs.readFileSync(path.join(SRC,"festive.js"),"utf8").replace("__SALE__", JSON.stringify(SALE)));
fs.writeFileSync(path.join(OUT,"index.html"), indexPage());
fs.mkdirSync(path.join(OUT,"initials"),{recursive:true}); fs.writeFileSync(path.join(OUT,"initials","index.html"), initialsPage());
PRODUCTS.forEach(p => fs.writeFileSync(path.join(OUT,"products",p.slug+".html"), productPage(p)));
fs.writeFileSync(path.join(OUT,".nojekyll"), "");
fs.mkdirSync(path.join(OUT,"policies"), {recursive:true});
PAGES.forEach(pg => fs.writeFileSync(path.join(OUT,"policies",pg.slug+".html"), policyPage(pg)));
fs.mkdirSync(path.join(OUT,"blog"), {recursive:true});
fs.writeFileSync(path.join(OUT,"blog","index.html"), blogIndex());
POSTS.forEach(p => fs.writeFileSync(path.join(OUT,"blog",p.slug+".html"), postPage(p)));
fs.writeFileSync(path.join(OUT,"robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);
const urls = [BASE+"/", BASE+"/initials/", BASE+"/corporate.html", BASE+"/blog/index.html", ...PAGES.map(pg=>`${BASE}/policies/${pg.slug}.html`), ...POSTS.map(p=>`${BASE}/blog/${p.slug}.html`), ...PRODUCTS.map(p=>`${BASE}/products/${p.slug}.html`)];
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
