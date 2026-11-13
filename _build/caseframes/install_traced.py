# Install traced frames into the site and re-render each design's default image on the iPhone 16 Pro,
# compositing exactly as the browser does (mask applied through its ALPHA channel).
import sys, os, json, glob, shutil
from PIL import Image
SRC, REPO = sys.argv[1:3]
F1, F2 = f"{REPO}/_build/caseframes", f"{REPO}/images/cases/frames"
rects = json.load(open(f"{SRC}/rects.json"))
for s in rects:
    m = Image.open(f"{SRC}/{s}-mask.png").convert("L")
    la = Image.merge("LA", (Image.new("L", m.size, 255), m))      # alpha = print area, so canvas destination-in clips
    for d in (F1, F2):
        la.save(f"{d}/{s}-mask.png", optimize=True)
        shutil.copyfile(f"{SRC}/{s}-frame.webp", f"{d}/{s}-frame.webp")
for d in (F1, F2): json.dump(rects, open(f"{d}/rects.json", "w"), separators=(",", ":"))
x0, y0, x1, y1 = rects["iphone-16-pro"]
frame = Image.open(f"{F1}/iphone-16-pro-frame.webp").convert("RGBA"); alpha = Image.open(f"{F1}/iphone-16-pro-mask.png").getchannel("A")
n = 0
for ap in sorted(glob.glob(f"{REPO}/_build/casedesigns/*-art.webp")):
    s = os.path.basename(ap)[:-9]
    art = Image.open(ap).convert("RGB"); rw, rh = x1 - x0, y1 - y0
    r = max(rw / art.width, rh / art.height); a = art.resize((round(art.width * r), round(art.height * r)), Image.LANCZOS)
    L = Image.new("RGBA", frame.size, (0, 0, 0, 0)); L.paste(a, (round(x0 + (rw - a.width) / 2), round(y0 + (rh - a.height) / 2)))
    L.putalpha(alpha); c = Image.new("RGBA", frame.size, (0, 0, 0, 0)); c.alpha_composite(L); c.alpha_composite(frame)
    for d in (f"{REPO}/_build/casedesigns", f"{REPO}/images/cases/designs"):
        c.save(f"{d}/{s}.webp", "WEBP", quality=88, method=6)
        c.resize((480, 640), Image.LANCZOS).save(f"{d}/{s}-sm.webp", "WEBP", quality=85, method=6)
    n += 1
print("frames", len(rects), "designs", n)
