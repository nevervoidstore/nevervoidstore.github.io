"""Add a mug from Printrove's own mock-ups (the normal way to add a new mug).
Usage: python3 add_mug.py <slug> <print.png> <printrove-front.png (handle left)> <printrove-back.png (handle right)>
Writes into realmugs/: <slug>-a.webp, -b.webp (mock-up photos), -flat.webp (WATERMARKED design preview),
-wrap.webp (screen-size 3D texture) and -print.png (private, git-ignored). Then add the product to realmugs.js and run build.sh."""
import sys, os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from mug_printrove import watermark, register_watermarked, MUG_CENTRE, CROP

slug, pr, front, back = sys.argv[1:5]
out = os.path.join(HERE, "realmugs", slug)
def rgb(p):
    im = Image.open(p).convert("RGBA"); bg = Image.new("RGBA", im.size, "white")
    return Image.alpha_composite(bg, im).convert("RGB")
def crop(p, view):   # same framing as every other mug, so the handle/inside colour layers line up (never resize)
    im = rgb(p); assert im.size == (800, 800), "expected Printrove's 800x800 mock-up"
    cx, cy = MUG_CENTRE[view]; x0, y0 = round(cx - CROP / 2), round(cy - CROP / 2)
    return im.crop((x0, y0, x0 + CROP, y0 + CROP))
crop(front, "a").save(out + "-a.webp", "WEBP", quality=90, method=6)
crop(back, "b").save(out + "-b.webp", "WEBP", quality=90, method=6)
p = rgb(pr); p.save(out + "-print.png", dpi=(300, 300))
flat = p.copy(); flat.thumbnail((1000, 500), Image.LANCZOS)
watermark(flat).save(out + "-flat.webp", "WEBP", quality=80, method=6)
register_watermarked(out + "-flat.webp")
p.resize((1024, 458), Image.LANCZOS).save(out + "-wrap.webp", "WEBP", quality=80, method=6)
print("ok", slug, "- now add it to realmugs.js and run build.sh")
