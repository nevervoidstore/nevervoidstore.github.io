// Pulls the owner's Google Sheet (tabs: Settings, Prices, Reviews) into admin-data.json before each build.
// The Sheet must be shared "Anyone with the link: Viewer". Its link goes in policies.js CONTACT.adminSheet.
// If the Sheet can't be read, the last saved admin-data.json is kept, so the site still builds.
const fs = require("fs"), path = require("path");
const POL = require("./policies.js");
const FILE = path.join(__dirname, "admin-data.json");
const url = (POL.CONTACT && POL.CONTACT.adminSheet) || process.env.ADMIN_SHEET || "";
const m = url.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
function csv(text) {   // RFC 4180-ish CSV parser
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const key = h => String(h).toLowerCase().replace(/\(.*?\)/g, "").trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
async function tab(name) {
  const r = await fetch(`https://docs.google.com/spreadsheets/d/${m[1]}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`, { redirect: "follow" });
  if (!r.ok) throw new Error(name + ": HTTP " + r.status);
  const rows = csv(await r.text()).filter(x => x.some(v => String(v).trim()));
  const head = rows.shift().map(key);
  return rows.map(x => Object.fromEntries(head.map((h, i) => [h, (x[i] || "").trim()])));
}
(async () => {
  if (!m) { console.log("sheet: no admin Sheet set, using saved settings"); return; }
  try {
    const out = { fetched: new Date().toISOString() };
    const s = await tab("Settings"); out.settings = Object.fromEntries(s.filter(r => r.setting).map(r => [key(r.setting), r.value]));
    out.prices = await tab("Prices");
    // reviews: either a "Reviews" tab or the Google Form's "Form responses 1" tab, with a Show column added
    out.reviews = await tab("Reviews").catch(() => tab("Form responses 1")).catch(() => []);
    out.reviews = out.reviews.map(r => ({ date: r.timestamp || r.date || "", name: r.your_name || r.name || "", city: r.your_city || r.city || "", product: r.what_did_you_buy || r.product || "",
      rating: r.rating || r.stars || "", review: r.your_review || r.review || "", show: r.show || "" }));
    fs.writeFileSync(FILE, JSON.stringify(out, null, 1));
    console.log(`sheet: settings ${Object.keys(out.settings).length}, prices ${out.prices.length}, reviews ${out.reviews.length}`);
  } catch (e) { console.log("sheet: could not read (" + e.message + "), using saved settings"); }
})();
