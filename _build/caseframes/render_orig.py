# Re-render each case design's display image on the iPhone 16 Pro frame from the full-size original artwork
# (falls back to the small -art copy when no original exists). Output stays 1200x1600, nothing print-size is published.
import re, os, json
from PIL import Image
SRC = "/home/claude/nevervoid/src"; ORIG = "/home/claude/orig"
x0, y0, x1, y1 = json.load(open(f"{SRC}/caseframes/rects.json"))["iphone-16-pro"]
frame = Image.open(f"{SRC}/caseframes/iphone-16-pro-frame.webp").convert("RGBA"); alpha = Image.open(f"{SRC}/caseframes/iphone-16-pro-mask.png").getchannel("A")
pairs = re.findall(r'D\("([0-9a-f]{13})","([\w-]+)"', open(f"{SRC}/cases.js").read())
for code, s in pairs:
    p = f"{ORIG}/{code}.png"; src = p if os.path.exists(p) else f"{SRC}/casedesigns/{s}-art.webp"
    art = Image.open(src).convert("RGB"); rw, rh = x1 - x0, y1 - y0
    r = max(rw / art.width, rh / art.height); a = art.resize((round(art.width * r), round(art.height * r)), Image.LANCZOS)
    L = Image.new("RGBA", frame.size, (0, 0, 0, 0)); L.paste(a, (round(x0 + (rw - a.width) / 2), round(y0 + (rh - a.height) / 2)))
    L.putalpha(alpha); c = Image.new("RGBA", frame.size, (0, 0, 0, 0)); c.alpha_composite(L); c.alpha_composite(frame)
    c.save(f"{SRC}/casedesigns/{s}.webp", "WEBP", quality=90, method=6)
    c.resize((480, 640), Image.LANCZOS).save(f"{SRC}/casedesigns/{s}-sm.webp", "WEBP", quality=86, method=6)
    print(s, "orig" if src == p else "small")
