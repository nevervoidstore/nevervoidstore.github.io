// Run last: gives every script/style a content-based ?v= so browsers never mix old files with new pages.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const OUT = path.join(__dirname, "..", "site"), A = path.join(OUT, "assets");
const h = f => crypto.createHash("sha1").update(fs.readFileSync(path.join(A, f))).digest("hex").slice(0, 8);
// store.js imports the 3D viewer: version that link first, then hash store.js itself
let sj = fs.readFileSync(path.join(A, "store.js"), "utf8").replace(/\/assets\/mug3d\.js(\?v=\w+)?/g, "/assets/mug3d.js?v=" + h("mug3d.js"));
fs.writeFileSync(path.join(A, "store.js"), sj);
const ver = {}; for (const f of fs.readdirSync(A)) if (/\.(js|css)$/.test(f)) ver[f] = h(f);
let n = 0;
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f);
  if (fs.statSync(p).isDirectory()) { if (f !== "images") walk(p); continue; }
  if (!f.endsWith(".html")) continue;
  const s = fs.readFileSync(p, "utf8"), t = s.replace(/assets\/([\w-]+\.(?:js|css))(\?v=\w+)?"/g, (m, a) => ver[a] ? `assets/${a}?v=${ver[a]}"` : m);
  if (t !== s) { fs.writeFileSync(p, t); n++; } } })(OUT);
console.log("versioned assets in", n, "pages", ver);
