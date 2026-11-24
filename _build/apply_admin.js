// After the build: put the Sheet's delivery cities and Christmas cut-off into every built page.
const fs = require("fs"), path = require("path");
const A = require("./admin.js");
const OUT = path.join(__dirname, "..", "site");
let n = 0;
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f), st = fs.statSync(p);
    if (st.isDirectory()) { if (f !== "images") walk(p); continue; }
    if (!/\.(html|js|json|xml|csv|txt)$/.test(f)) continue;
    const s = fs.readFileSync(p, "utf8"), t = A.replaceText(s);
    if (t !== s) { fs.writeFileSync(p, t); n++; }
  }
})(OUT);
console.log("admin settings applied to " + n + " files");
