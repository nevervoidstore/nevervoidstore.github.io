"""Add a mug from Printrove's own mock-ups (the normal way to add a new mug).
Usage: python3 add_mug.py <slug> <print.png> <printrove-front.png (handle left)> <printrove-back.png (handle right)>
Writes into realmugs/: <slug>-a.webp, -b.webp (mock-up photos), -flat.webp (WATERMARKED design preview),
-wrap.webp (screen-size 3D texture) and -print.png (private, git-ignored). Then add the product to realmugs.js and run build.sh."""
import sys, os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from mug_printrove import watermark, register_watermarked

slug, pr, front, back = sys.argv[1:5]
out = os.path.join(HERE, "realmugs", slug)
def rgb(p):
    im = Image.open(p).convert("RGBA"); bg = Image.new("RGBA", im.size, "white")
    return Image.alpha_composite(bg, im).convert("RGB")
rgb(front).resize((620, 620), Image.LANCZOS).save(out + "-a.webp", "WEBP", quality=88, method=6)
rgb(back).resize((620, 620), Image.LANCZOS).save(out + "-b.webp", "WEBP", quality=88, method=6)
p = rgb(pr); p.save(out + "-print.png", dpi=(300, 300))
flat = p.copy(); flat.thumbnail((1000, 500), Image.LANCZOS)
watermark(flat).save(out + "-flat.webp", "WEBP", quality=80, method=6)
register_watermarked(out + "-flat.webp")
p.resize((1024, 458), Image.LANCZOS).save(out + "-wrap.webp", "WEBP", quality=80, method=6)
print("ok", slug, "- now add it to realmugs.js and run build.sh")
