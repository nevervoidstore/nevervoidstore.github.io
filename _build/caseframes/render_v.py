# Re-render every case design's default image on the drawn iPhone 16 Pro frame (same look as the live per-model preview).
import json, re, sys
from PIL import Image
D = "/home/claude/nevervoid/src/caseframes"; C = "/home/claude/nevervoid/src/casedesigns"
R = json.load(open(f"{D}/rects.json")); x0, y0, x1, y1 = R["iphone-16-pro"]
frame = Image.open(f"{D}/iphone-16-pro-frame.webp").convert("RGBA"); mask = Image.open(f"{D}/iphone-16-pro-mask.png").convert("L")
slugs = re.findall(r'D\("\w+",\s*"([\w-]+)"', open("/home/claude/nevervoid/src/cases.js").read())
for s in slugs:
    art = Image.open(f"{C}/{s}-art.webp").convert("RGB"); rw, rh = x1 - x0, y1 - y0
    r = max(rw / art.width, rh / art.height); a = art.resize((round(art.width * r), round(art.height * r)), Image.LANCZOS)
    L = Image.new("RGBA", frame.size, (0, 0, 0, 0)); L.paste(a, (x0 + (rw - a.width) // 2, y0 + (rh - a.height) // 2)); L.putalpha(mask)
    c = Image.new("RGBA", frame.size, (0, 0, 0, 0)); c.alpha_composite(L); c.alpha_composite(frame)
    c.save(f"{C}/{s}.webp", "WEBP", quality=88, method=6)
    sm = c.resize((480, 640), Image.LANCZOS); sm.save(f"{C}/{s}-sm.webp", "WEBP", quality=85, method=6)
print(len(slugs))
