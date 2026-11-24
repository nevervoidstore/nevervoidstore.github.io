// Admin settings for the site, edited by the owner in a Google Sheet (see sheet.js) and saved here as admin-data.json.
// Everything has a default, so the site always builds even without the Sheet.
const fs = require("fs"), path = require("path");
const FILE = path.join(__dirname, "admin-data.json");
const DEFAULT_CITIES = [["Bengaluru", "560"], ["Chennai", "600"], ["Mumbai", "400"], ["Hyderabad", "500"], ["Kochi", "682"]];
let data = {};
try { data = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) {}
const st = data.settings || {};
const yes = v => /^(y|yes|on|true|1)$/i.test(String(v || "").trim());

// delivery cities: "Bengaluru 560, Chennai 600" or one per line
let cities = DEFAULT_CITIES;
if (st.delivery_cities) {
  const list = String(st.delivery_cities).split(/[,\n;]+/).map(s => s.trim()).filter(Boolean).map(s => { const m = s.match(/^(.+?)\s*[:(]?\s*(\d{2,3})\)?$/); return m ? [m[1].trim(), m[2]] : null; }).filter(Boolean);
  if (list.length) cities = list;
}
const names = cities.map(c => c[0]);
const join = (sep, last) => names.length < 2 ? names.join("") : names.slice(0, -1).join(sep) + last + names[names.length - 1];
const C = {
  list: cities, names,
  and: join(", ", " and "), amp: join(", ", " &amp; "), ampRaw: join(", ", " & "), or: join(", ", " or "), comma: names.join(", "), dot: names.join(" · "),
  regex: "(" + cities.map(c => c[1]).join("|") + ")", count: names.length
};
// Christmas cut-off date, e.g. "14 December"
const cutLong = String(st.christmas_cutoff || "14 December").trim();
const cutShort = cutLong.replace(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*$/, "$1 $2");

const SALE = {
  on: st.sale_on === undefined ? true : yes(st.sale_on),
  pct: Math.max(0, Math.min(90, parseInt(st.sale_percent, 10) || 20)),
  ends: /^\d{4}-\d{2}-\d{2}$/.test(String(st.sale_ends || "")) ? st.sale_ends : "2026-12-25",
  label: String(st.sale_name || "Christmas Sale").trim()
};

// replace the default wording everywhere with the Sheet's values (used on the built site and in images.js)
const DEF = { and: "Bengaluru, Chennai, Mumbai, Hyderabad and Kochi", amp: "Bengaluru, Chennai, Mumbai, Hyderabad &amp; Kochi", ampRaw: "Bengaluru, Chennai, Mumbai, Hyderabad & Kochi",
  or: "Bengaluru, Chennai, Mumbai, Hyderabad or Kochi", comma: "Bengaluru, Chennai, Mumbai, Hyderabad, Kochi", dot: "Bengaluru · Chennai · Mumbai · Hyderabad · Kochi", regex: "(560|600|400|500|682)" };
function replaceText(s) {
  if (C.and !== DEF.and) ["amp", "ampRaw", "and", "or", "comma", "dot"].forEach(k => { s = s.split(DEF[k]).join(C[k]); });
  if (C.regex !== DEF.regex) s = s.split(DEF.regex).join(C.regex);
  s = s.split("Delivering to 5 cities").join("Delivering to " + C.count + (C.count === 1 ? " city" : " cities"));
  if (cutLong !== "14 December") s = s.split("14 December").join(cutLong).replace(/\b14 Dec\b/g, cutShort);
  return s;
}

// prices / hide products: rows {id, price, show}
const PRICES = {};
(data.prices || []).forEach(r => { if (r.id) PRICES[String(r.id).trim()] = { price: parseInt(r.price, 10) || null, show: r.show === undefined || r.show === "" ? true : yes(r.show) }; });

// reviews: only rows the owner marked Show = yes
const REVIEWS = (data.reviews || []).filter(r => yes(r.show) && String(r.review || "").trim()).map(r => ({
  name: String(r.name || "").trim().split(/\s+/)[0].slice(0, 20) || "Customer", city: String(r.city || "").trim().slice(0, 24),
  product: String(r.product || "").trim(), rating: Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5)),
  text: String(r.review).trim().slice(0, 400), date: String(r.date || "").trim().slice(0, 10)
}));

module.exports = { data, cities: C, cutLong, cutShort, SALE, PRICES, REVIEWS, replaceText };
