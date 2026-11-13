# Clean, drawn case frames for every phone model (same look for all, no photo tracing).
# Output per model: <slug>-frame.webp (overlay: rim, camera cut-out, lenses, gloss), <slug>-mask.png (print area), rects.json (body box).
# All camera positions are in mm from the top-left corner of the phone's back.
import numpy as np, json, os, sys
from PIL import Image, ImageDraw, ImageFilter

W, H = 1200, 1600
SS = 2
OUT = sys.argv[1] if len(sys.argv) > 1 else "vout"
os.makedirs(OUT, exist_ok=True)

# ---- camera layouts -------------------------------------------------------
def sq2v(s=29):       # iPhone 11 / 12: two lenses stacked
    k = s / 29
    return dict(cut=[("rr", 6.5, 6.5, 6.5 + s, 6.5 + s, 8 * k)],
                lens=[(6.5 + 8 * k, 6.5 + 8 * k, 11 * k), (6.5 + 8 * k, 6.5 + 21 * k, 11 * k)],
                flash=[(6.5 + 21.5 * k, 6.5 + 7.5 * k, 4.2 * k)], dot=[(6.5 + 21.5 * k, 6.5 + 21.5 * k, 1.4 * k)])
def sq2d(s=31):       # iPhone 13 / 14 / 15: diagonal lenses
    k = s / 31
    return dict(cut=[("rr", 6.5, 6.5, 6.5 + s, 6.5 + s, 8.5 * k)],
                lens=[(6.5 + 8.6 * k, 6.5 + 8.6 * k, 12.4 * k), (6.5 + 22.4 * k, 6.5 + 22.4 * k, 12.4 * k)],
                flash=[(6.5 + 23 * k, 6.5 + 8 * k, 4.4 * k)], dot=[(6.5 + 8 * k, 6.5 + 23 * k, 1.4 * k)])
def tri(s=37, lidar=True):   # Pro models: triangle of three
    k = s / 37
    o = 6
    return dict(cut=[("rr", o, o, o + s, o + s, 9.5 * k)],
                lens=[(o + 10 * k, o + 10 * k, 14 * k), (o + 10 * k, o + 27 * k, 14 * k), (o + 25.5 * k, o + 18.5 * k, 14 * k)],
                flash=[(o + 27.5 * k, o + 5.6 * k, 4.4 * k)], dot=[(o + 27.5 * k, o + 31.4 * k, 4.4 * k if lidar else 1.4 * k)], lidar=lidar)
def pill(sq=False):   # iPhone 16 / 17: vertical pill, flash beside it
    d = dict(lens=[(15, 14.5, 12.6), (15, 30.5, 12.6)], flash=[(28.5, 22.5, 4.4)], dot=[(28.5, 29, 1.2)])
    d["plate"] = [("rr", 7.2, 6.6, 22.8, 38.4, 7.8)]
    d["cut"] = [("rr", 6, 5.4, 36.5, 39.6, 9.5)] if sq else [("rr", 7.2, 6.6, 22.8, 38.4, 7.8), ("c", 28.5, 22.5, 4.6)]
    return d
def plateau(full_h, lenses, flash, dots, lidar=False):
    return dict(cut=[("rr", -4, -4, 999, full_h, 9)], lens=lenses, flash=flash, dot=dots, lidar=lidar)
def galaxy3(top=6, gap=17.5, d=11, flash_hole=True):
    l = [(13.5, top + 7.5 + i * gap, d) for i in range(3)]
    c = [("rr", 6.5, top, 20.5, top + 15 + 2 * gap, 7)]
    f = [(26.5, top + 9, 3.6)]
    if flash_hole: c.append(("c", 26.5, top + 9, 4.2))
    return dict(cut=c, lens=l, flash=f, dot=[])
def s22u():
    return dict(cut=[("rr", 5.5, 5.5, 22.5, 59, 8.5), ("rr", 5.5, 5.5, 32, 34, 8.5)],
                lens=[(14, 14.5, 13), (14, 32, 13), (14, 49.5, 13), (27, 26, 8)], flash=[(27, 14, 4)], dot=[])
def oneplus_circle(fused):
    cx, cy, r = 30, 32, 22.5
    c = [("c", cx, cy, r)]
    if fused: c.append(("rr", -4, cy - r * 0.62, cx, cy + r * 0.62, 6))
    return dict(cut=c, ring=(cx, cy, r - 2.2),
                lens=[(cx - 8.5, cy - 8.5, 12), (cx + 8.5, cy - 8.5, 12), (cx - 8.5, cy + 8.5, 12)],
                flash=[(cx + 8.5, cy + 8.5, 4.2)], dot=[])
def oneplus11r():
    return dict(cut=[("rr", 5.5, 5.5, 47, 52, 15)],
                lens=[(18, 18, 16), (18, 39.5, 16), (37, 18, 8)], flash=[(37, 30, 4)], dot=[])
def xr():
    return dict(cut=[("rr", 7, 7, 22, 34, 7.5)], lens=[(14.5, 14.5, 11.5)], flash=[(14.5, 27, 4)], dot=[])

PRO17 = lambda: plateau(45, [(14, 13.5, 14), (14, 31.5, 14), (29.5, 22.5, 14)], [(58, 14, 4.4)], [(58, 31, 4.4), (58, 22.5, 1.3)], lidar=True)
AIR = lambda: plateau(27, [(15, 13, 13)], [(30, 13, 4.2)], [(38, 13, 1.3)])

MODELS = {   # slug: (width mm, height mm, corner radius mm, layout)
 "iphone-17-pro-max": (78.0, 163.4, 11.5, PRO17()), "iphone-17-pro": (71.9, 150.0, 11, PRO17()), "iphone-air": (74.7, 156.2, 11.5, AIR()),
 "iphone-17": (71.5, 149.6, 11, pill(True)),
 "iphone-16-pro-max": (77.6, 163.0, 11.5, tri()), "iphone-16-pro": (71.5, 149.6, 11, tri()),
 "iphone-16-plus": (77.8, 160.9, 11.5, pill()), "iphone-16": (71.6, 147.6, 11, pill()),
 "iphone-15-pro-max": (76.7, 159.9, 11.5, tri()), "iphone-15-pro": (70.6, 146.6, 11, tri()),
 "iphone-15-plus": (77.8, 160.9, 11.5, sq2d()), "iphone-15": (71.6, 147.6, 11, sq2d()),
 "iphone-14-pro-max": (77.6, 160.7, 11.5, tri()), "iphone-14-pro": (71.5, 147.5, 11, tri()),
 "iphone-14-plus": (78.1, 160.8, 11.5, sq2d()), "iphone-14": (71.5, 146.7, 11, sq2d()),
 "iphone-13-pro-max": (78.1, 160.8, 11.5, tri(36)), "iphone-13-pro": (71.5, 146.7, 11, tri(36)),
 "iphone-13-mini": (64.2, 131.5, 10, sq2d(28)), "iphone-13": (71.5, 146.7, 11, sq2d(30)),
 "iphone-12-pro-max": (78.1, 160.8, 11.5, tri(33)), "iphone-12-pro": (71.5, 146.7, 11, tri(32)),
 "iphone-12-mini": (64.2, 131.5, 10, sq2v(26.5)), "iphone-12": (71.5, 146.7, 11, sq2v(29)),
 "iphone-11-pro-max": (77.8, 158.0, 12.5, tri(33, False)), "iphone-11-pro": (71.4, 144.0, 12, tri(32, False)),
 "iphone-11": (75.7, 150.9, 12.5, sq2v(30)), "iphone-xr": (75.7, 150.9, 12.5, xr()),
 "galaxy-s25": (70.5, 146.9, 9.5, galaxy3(6.5, 17, 11)), "galaxy-s24": (70.6, 147.0, 9.5, galaxy3(6.5, 17, 11)),
 "galaxy-s23": (70.9, 146.3, 9.5, galaxy3(6.5, 17, 11)), "galaxy-s22-ultra": (77.9, 163.3, 6, s22u()),
 "oneplus-12": (75.8, 164.3, 10, oneplus_circle(True)), "oneplus-12r": (75.3, 163.3, 10, oneplus_circle(True)),
 "oneplus-11": (74.1, 163.1, 10, oneplus_circle(False)), "oneplus-11r": (74.3, 163.3, 10, oneplus11r()),
}

# ---- drawing helpers ------------------------------------------------------
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
def shape_mask(shapes, conv, grow=0):
    m = Image.new("L", (W * SS, H * SS), 0); d = ImageDraw.Draw(m)
    for s in shapes:
        if s[0] == "rr":
            x0, y0, x1, y1 = conv(s[1], s[2]) + conv(s[3], s[4]); r = s[5] * conv.k
            x1 = min(x1, conv.bx1 + 40)
            d.rounded_rectangle(((x0 - grow) * SS, (y0 - grow) * SS, (x1 + grow) * SS, (y1 + grow) * SS), radius=(r + grow) * SS, fill=255)
        else:
            cx, cy = conv(s[1], s[2]); r = s[3] * conv.k + grow
            d.ellipse(((cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS), fill=255)
    return np.asarray(m.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
def disc(cx, cy, r, soft=0.8):
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    return np.clip((r - d) / soft + 0.5, 0, 1), d
def over(dst, rgb, a):
    a = np.clip(a, 0, 1)[..., None]
    dst[..., :3] = dst[..., :3] * (1 - a) + np.asarray(rgb, np.float32) * a if np.ndim(rgb) == 1 else dst[..., :3] * (1 - a) + rgb * a
    dst[..., 3:] = dst[..., 3:] + (1 - dst[..., 3:]) * a
def lens(img, cx, cy, d):
    R = d / 2
    a, dist = disc(cx, cy, R)
    t = dist / R
    # brushed steel ring -> black ring -> glass
    ang = np.arctan2(yy - cy, xx - cx)
    steel = 150 + 55 * np.cos(ang - 2.3)
    over(img, np.dstack([steel, steel, steel + 6]), a)
    a2, _ = disc(cx, cy, R * 0.86); over(img, (16, 16, 18), a2)
    a3, _ = disc(cx, cy, R * 0.66)
    g = np.clip(1 - t / 0.66, 0, 1)
    glass = np.dstack([18 + 18 * g, 22 + 26 * g, 40 + 46 * g])
    over(img, glass, a3)
    a4, _ = disc(cx, cy, R * 0.30); over(img, (6, 6, 10), a4)
    # highlights
    h1, _ = disc(cx - R * 0.26, cy - R * 0.28, R * 0.13, 1.6); over(img, (235, 240, 255), h1 * 0.85)
    h2, _ = disc(cx + R * 0.22, cy + R * 0.25, R * 0.06, 1.2); over(img, (160, 190, 255), h2 * 0.6)
def flash(img, cx, cy, d):
    R = d / 2
    a, dist = disc(cx, cy, R); over(img, (212, 210, 204), a)
    a2, _ = disc(cx, cy, R * 0.78)
    g = np.clip(1 - dist / (R * 0.78), 0, 1)
    over(img, np.dstack([236 + 10 * g, 222 + 18 * g, 180 + 30 * g]), a2)
def lidar(img, cx, cy, d):
    a, _ = disc(cx, cy, d / 2); over(img, (24, 24, 26), a)
    a2, _ = disc(cx, cy, d / 2 * 0.7); over(img, (8, 8, 10), a2)
def dot(img, cx, cy, d):
    a, _ = disc(cx, cy, max(d / 2, 2.2)); over(img, (14, 14, 16), a)

class Conv:
    def __init__(s, bx0, by0, k, bx1): s.bx0, s.by0, s.k, s.bx1 = bx0, by0, k, bx1
    def __call__(s, x, y): return (s.bx0 + x * s.k, s.by0 + y * s.k)

def build(slug):
    wmm, hmm, rmm, L = MODELS[slug]
    BH = 1480; bw = BH * wmm / hmm
    bx0, by0 = (W - bw) / 2, (H - BH) / 2; bx1, by1 = bx0 + bw, by0 + BH
    k = bw / wmm; cv = Conv(bx0, by0, k, bx1)
    body = shape_mask([("rr", 0, 0, wmm, hmm, rmm)], cv)
    outer = shape_mask([("rr", 0, 0, wmm, hmm, rmm)], cv, grow=11)
    cut = shape_mask(L["cut"], cv) * body
    lip = np.clip(shape_mask(L["cut"], cv, grow=7) * body - cut, 0, 1)
    printm = np.clip(body - shape_mask(L["cut"], cv, grow=7), 0, 1)

    img = np.zeros((H, W, 4), np.float32)
    # soft contact shadow under the case
    sh = Image.fromarray((outer * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(18))
    sha = np.asarray(sh).astype(np.float32) / 255
    sha = np.roll(sha, 14, axis=0) * 0.28 * (1 - outer)   # outside the case only, never over the print
    over(img, (0, 0, 0), sha)
    # case rim: dark, with a light catch on the top-left edge
    rim = np.clip(outer - body, 0, 1)
    tone = 30 + 26 * np.clip(1 - ((xx - bx0) / bw * 0.6 + (yy - by0) / BH * 0.4), 0, 1)
    over(img, np.dstack([tone, tone, tone + 3]), rim)
    edge_in = np.clip(outer - shape_mask([("rr", 0, 0, wmm, hmm, rmm)], cv, grow=8.5), 0, 1)
    over(img, (120, 122, 126), edge_in * 0.35)
    # camera cut-out: phone body (graphite) with a dark lip from the case
    plate_tone = 52 + 18 * np.clip(1 - (yy - by0) / (60 * k), 0, 1)
    over(img, np.dstack([plate_tone, plate_tone, plate_tone + 4]), cut)
    if "plate" in L:   # raised glass pill inside a wider cut-out
        pm = shape_mask(L["plate"], cv)
        over(img, (34, 35, 39), pm)
    if "ring" in L:    # OnePlus: metal ring module
        cx, cy = cv(L["ring"][0], L["ring"][1]); r = L["ring"][2] * k
        a, dd = disc(cx, cy, r); over(img, (176, 178, 182), a)
        a2, _ = disc(cx, cy, r - 4); over(img, (32, 33, 37), a2)
    over(img, (22, 23, 25), lip)
    # inner shadow inside the cut-out (depth)
    cs = np.asarray(Image.fromarray((cut * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255
    over(img, (0, 0, 0), np.clip(cut - cs, 0, 1) * 0.9)
    for (x, y, d) in L.get("lens", []): lens(img, *cv(x, y), d * k)
    for (x, y, d) in L.get("flash", []): flash(img, *cv(x, y), d * k)
    for (x, y, d) in L.get("dot", []):
        (lidar if (L.get("lidar") and d > 3) else dot)(img, *cv(x, y), d * k)
    # print edge: hairline inner shadow + glass gloss over the print
    pe = np.asarray(Image.fromarray((printm * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))).astype(np.float32) / 255
    over(img, (0, 0, 0), np.clip(printm - pe, 0, 1) * 0.55)
    u = ((xx - bx0) / bw) + ((yy - by0) / BH) * 0.55
    gloss = (np.clip(1 - np.abs(u - 0.42) / 0.16, 0, 1) ** 2) * 0.10 + np.clip(0.35 - u, 0, 1) * 0.18
    over(img, (255, 255, 255), gloss * printm)
    im = Image.fromarray(np.clip(img[..., :3] / np.maximum(img[..., 3:], 1e-6), 0, 255).astype(np.uint8))
    im.putalpha(Image.fromarray((img[..., 3] * 255).clip(0, 255).astype(np.uint8)))
    im.save(f"{OUT}/{slug}-frame.webp", "WEBP", quality=90, method=6)
    mk = Image.new("LA", (W, H), 255); mk.putalpha(Image.fromarray((printm * 255).astype(np.uint8), "L"))
    mk.save(f"{OUT}/{slug}-mask.png", optimize=True)   # print area in the alpha channel (canvas clips by alpha)
    return [round(bx0), round(by0), round(bx1), round(by1)]

if __name__ == "__main__":
    only = sys.argv[2:] or list(MODELS)
    rects = {}
    if os.path.exists(f"{OUT}/rects.json"): rects = json.load(open(f"{OUT}/rects.json"))
    for s in only: rects[s] = build(s); print(s, end=" ", flush=True)
    json.dump(rects, open(f"{OUT}/rects.json", "w")); print()
