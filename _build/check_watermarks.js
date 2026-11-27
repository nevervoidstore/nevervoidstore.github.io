// Safety check run by build.sh: every public mug design preview must be one we watermarked.
// New mugs: use add_mug.py (or mug_printrove.py); both watermark and register the preview in watermarked.json.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const reg = JSON.parse(fs.readFileSync(path.join(__dirname, "watermarked.json"), "utf8"));
const dir = path.join(__dirname, "..", "site", "images", "mugs");
const bad = fs.readdirSync(dir).filter(f => /-flat\.webp$/.test(f))
  .filter(f => reg[f] !== crypto.createHash("sha256").update(fs.readFileSync(path.join(dir, f))).digest("hex"));
if (bad.length) { console.error("NOT WATERMARKED (or changed since watermarking): " + bad.join(", ") + "\nMake it with add_mug.py, which watermarks and registers it."); process.exit(1); }
console.log("watermarks ok: " + Object.keys(reg).length + " design previews");
