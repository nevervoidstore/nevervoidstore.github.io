import numpy as np, cv2, json, sys
from PIL import Image, ImageDraw, ImageFilter
SRC = "/home/claude/nevervoid/src/real/knitted-christmas-puppies/"
models = json.load(open(SRC[:-1] + ".json"))
def build(slug, dbg=False):
    src = Image.open(SRC + slug + ".webp").convert("RGBA"); a = np.asarray(src); H, W = a.shape[:2]
    alpha = (a[..., 3] > 200).astype(np.uint8)
    rows = [np.nonzero(alpha[y])[0] for y in range(H)]; good = [(r.min(), r.max()) for r in rows if len(r)]
    bx0 = int(np.percentile([g[0] for g in good], 80)); bx1 = int(np.percentile([g[1] for g in good], 20))
    ys = np.nonzero(alpha.any(1))[0]; by0, by1 = int(ys.min()), int(ys.max())
    inset = 10; rect = (bx0 + inset, by0 + inset, bx1 - inset, by1 - inset)
    body = Image.new("L", src.size, 0); ImageDraw.Draw(body).rounded_rectangle(rect, radius=52, fill=255)
    body = np.asarray(body).astype(np.uint8) > 0
    # camera cut-out: measured shapes per model (camspec.py)
    from camspec import SPEC, to_photo
    cm = Image.new("L", src.size, 0); dc = ImageDraw.Draw(cm)
    for shp in SPEC[slug]:
        p = to_photo(shp, rect[2])
        if p[0] == "rr": dc.rounded_rectangle(p[1:5], radius=p[5], fill=255)
        else: dc.ellipse((p[1]-p[3], p[2]-p[3], p[1]+p[3], p[2]+p[3]), fill=255)
    fill = (np.asarray(cm) > 127).astype(np.uint8)
    # leftover artwork in the outer band of the cut-out becomes black rim (real cases have a black bumper around the camera hole)
    core = cv2.erode(fill, np.ones((3, 3), np.uint8), iterations=16)
    band = (fill > 0) & (core == 0)
    rgbi = a[..., :3].astype(np.int16); r_, g_, b_ = rgbi[..., 0], rgbi[..., 1], rgbi[..., 2]
    sat = rgbi.max(2) - rgbi.min(2); gr = cv2.cvtColor(a[..., :3], cv2.COLOR_RGB2GRAY).astype(np.float32)
    mu = cv2.blur(gr, (5, 5)); sdv = np.sqrt(np.maximum(cv2.blur(gr * gr, (5, 5)) - mu * mu, 0))
    art = band & (((sat > 30) & (sdv > 4)) | ((g_ > r_ + 4) & (g_ > b_) & (gr < 120)) | ((r_ > g_ + 25) & (sdv > 4)))
    art = cv2.dilate(art.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=1).astype(bool) & band
    a = a.copy(); a[art, 0] = 22; a[art, 1] = 22; a[art, 2] = 24
    pm = (body & (fill == 0)).astype(np.float32)
    pm = cv2.GaussianBlur(pm, (0, 0), 0.9)
    frame = a.copy(); frame[..., 3] = (a[..., 3] * (1 - pm)).astype(np.uint8)
    return frame, (pm * 255).astype(np.uint8), rect
if __name__ == "__main__":
    import os; os.makedirs("frames", exist_ok=True); meta = {}
    sheet = Image.new("RGB", (9 * 130, 4 * 175), "white")
    for i, m in enumerate(models):
        fr, pm, rect = build(m["slug"])
        Image.fromarray(fr, "RGBA").save(f"frames/{m['slug']}-frame.webp", "WEBP", quality=88, method=6, lossless=False)
        Image.fromarray(pm, "L").save(f"frames/{m['slug']}-mask.png", optimize=True)
        meta[m["slug"]] = rect
        dbg = Image.new("RGBA", (600, 800), (255, 255, 255, 255)); mag = Image.new("RGBA", (600, 800), (255, 0, 200, 255)); mag.putalpha(Image.fromarray(pm))
        dbg.alpha_composite(mag); dbg.alpha_composite(Image.fromarray(fr, "RGBA")); t = dbg.convert("RGB"); t.thumbnail((125, 167))
        sheet.paste(t, ((i % 9) * 130, (i // 9) * 175))
    json.dump(meta, open("frames/rects.json", "w")); sheet.save("/tmp/frames36.jpg", quality=85); print("ok", len(meta))
