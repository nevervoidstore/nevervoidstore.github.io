"""Mug mock-ups on Printrove's 11oz photo + print-ready files.
Usage: python3 mug_printrove.py <design.png> <out_prefix> <layout> [x0 x1] [align]
layout: two   = design already has two panels (use as is)
        panel = crop source x-range [x0,x1] (fractions) as one panel, repeat on both sides
        panelw = like panel but fit to width (pad top with background), align bottom
Writes: <prefix>-print.png (2550x1140, 300dpi, 8.5x3.8in), <prefix>-b.webp (handle right, main),
        <prefix>-a.webp (handle left), <prefix>-flat.webp (preview of the print file)."""
import sys, os
import numpy as np
from PIL import Image
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = {"a": os.path.join(HERE, "mugtpl", "front.png"), "b": os.path.join(HERE, "mugtpl", "back.png")}
GEO = {"a": dict(x0=254, x1=613, flip=False), "b": dict(x0=162, x1=522, flip=True)}
PRINT_TOP, PRINT_H = 185.4, 430.6
RIM_DY = 12.0
PRINT_W_IN = 8.5
DEG_PER_IN = 36.15
MID_ANGLE, MID_S = 13.25, 2.165
PW, PH = 2550, 1140

def load_rgb(p):
    im = Image.open(p).convert("RGBA")
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
    return Image.alpha_composite(bg, im).convert("RGB")

def edge_fill(panel_img, box_w, box_h, align_bottom=False, cx=None):
    """Place panel_img into box (centred on cx), filling the rest with its own blurred edges."""
    a = np.asarray(panel_img)
    h, w = a.shape[:2]
    top = box_h - h if align_bottom else (box_h - h) // 2
    left = (box_w - w) // 2 if cx is None else min(max(cx - w // 2, 0), box_w - w)
    out = cv2.copyMakeBorder(a, top, box_h - h - top, left, box_w - w - left, cv2.BORDER_REPLICATE)
    if top > 0 or left > 0:   # soften the replicated band so it reads as background, not streaks
        blur = cv2.GaussianBlur(out, (0, 0), 25)
        m = np.zeros(out.shape[:2], np.float32); m[top:top + h, left:left + w] = 1
        m = cv2.GaussianBlur(m, (0, 0), 6)[..., None]
        out = (out * m + blur * (1 - m)).astype(np.uint8)
    return Image.fromarray(out)

FIT = 1.0
def make_print(src, layout, x0=0.0, x1=1.0):
    im = load_rgb(src); W, H = im.size
    if layout == "two":
        r = PW / PH
        if abs(W / H - r) > 0.002:    # fill the print area like Printrove does: scale to cover, trim the overflow evenly, never stretch
            if W / H > r: nw = round(H * r); im = im.crop(((W - nw) // 2, 0, (W - nw) // 2 + nw, H))
            else: nh = round(W / r); im = im.crop((0, (H - nh) // 2, W, (H - nh) // 2 + nh))
        return im.resize((PW, PH), Image.LANCZOS)
    # one scene, shown on both sides; each copy centred where a photo view faces the camera
    # facing points: handle-left view -> 21.2% of the wrap, handle-right view -> 78.8%
    cL, cR = round(PW * 0.212), round(PW * 0.788)
    half_w = PW - cR                              # room from the facing point to the handle
    win_w = (x1 - x0) * W
    sc = min(2 * half_w * FIT / win_w, PH / H)    # fit the chosen window, never stretch
    sw, sh = round(W * sc), round(H * sc)
    big = np.asarray(im.resize((sw, sh), Image.LANCZOS))
    top = PH - sh if layout == "panelw" else (PH - sh) // 2
    corners = np.concatenate([big[:8, :].reshape(-1, 3), big[-8:, :].reshape(-1, 3), big[:, :8].reshape(-1, 3), big[:, -8:].reshape(-1, 3)])
    white_bg = np.median(corners.mean(1)) > 248
    canvas = np.full((PH, PW, 3), 255, np.uint8)
    cover = np.zeros((PH, PW), bool)
    win_c = (x0 + x1) / 2 * sw
    r_start = round(cR - (x1 - x0) * sw / 2)        # where the handle-right copy's window begins
    for centre, lo, hi in ((cR, r_start, PW), (cL, 0, r_start)):
        off = round(centre - win_c)                  # canvas x of source x=0
        xa, xb = max(lo, off), min(hi, off + sw)
        ya, yb = max(0, top), min(PH, top + sh)
        if xa < xb:
            canvas[ya:yb, xa:xb] = big[ya - top:yb - top, xa - off:xb - off]
            cover[ya:yb, xa:xb] = True
    if not white_bg and (~cover).any():              # fill the back with the design's own background colour, feathered
        bgc = np.median(corners, 0).astype(np.float32)
        m = cv2.GaussianBlur(cover.astype(np.float32), (0, 0), 14)
        m = np.where(cover, np.clip(m * 2 - 1, 0, 1) ** 0.5, 0)[..., None]   # fade only the last few px of the art
        canvas = (canvas * m + bgc * (1 - m)).astype(np.uint8)
    return Image.fromarray(canvas)

_blank_cache = {}
def watermark(img, text="NevervoidStore", size=None, alpha=34):
    """Faint diagonal tiled brand mark for every public design image (never on the print file)."""
    from PIL import ImageDraw, ImageFont
    im = img.convert("RGB"); W, H = im.size; size = size or max(18, W // 34)
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
    tile = Image.new("RGBA", (W * 2, H * 2), (0, 0, 0, 0)); d = ImageDraw.Draw(tile)
    tw = d.textlength(text, font=font); step_x, step_y = int(tw + size * 3), int(size * 4.2)
    for r, y in enumerate(range(0, H * 2, step_y)):
        for x in range(-step_x + (r % 2) * step_x // 2, W * 2, step_x):
            d.text((x, y), text, font=font, fill=(255, 255, 255, alpha + 20), stroke_width=1, stroke_fill=(255, 255, 255, alpha + 20))
            d.text((x, y), text, font=font, fill=(40, 40, 40, alpha))
    tile = tile.rotate(24, resample=Image.BICUBIC).crop((W // 2, H // 2, W // 2 + W, H // 2 + H))
    return Image.alpha_composite(im.convert("RGBA"), tile).convert("RGB")

def blank(view):
    """Printrove photo with its sample print removed (only inked pixels are rebuilt)."""
    if view in _blank_cache: return _blank_cache[view]
    a = np.asarray(Image.open(TPL[view]).convert("RGB")).astype(np.float32)
    g = GEO[view]; x0, x1 = g["x0"], g["x1"]
    gray = a.mean(2); sat = a.max(2) - a.min(2)
    ink = ((sat > 10) | (gray < 182))
    ink[:, :x0 + 4] = False; ink[:, x1 - 3:] = False
    ink[:183, :] = False; ink[621:, :] = False
    ink = cv2.dilate(ink.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
    ink[:, :x0 + 4] = False; ink[:, x1 - 3:] = False; ink[:183, :] = False; ink[621:, :] = False
    clean = ~ink
    out = a.copy()
    cols = np.arange(x0 + 4, x1 - 3)
    topv = np.zeros((len(cols), 3)); botv = np.zeros((len(cols), 3))
    for i, x in enumerate(cols):
        t = a[188:240, x][clean[188:240, x]]
        b = a[575:614, x][clean[575:614, x]]
        topv[i] = np.median(t, 0) if len(t) else np.nan
        botv[i] = np.median(b, 0) if len(b) else np.nan
    for arr in (topv, botv):    # fill gaps, then smooth across columns to remove streaks
        for c in range(3):
            v = arr[:, c]; idx = np.arange(len(v)); ok = ~np.isnan(v)
            arr[:, c] = np.interp(idx, idx[ok], v[ok])
        arr[:] = cv2.GaussianBlur(arr.astype(np.float32).reshape(-1, 1, 3), (1, 0), sigmaX=0, sigmaY=4).reshape(-1, 3) if False else np.apply_along_axis(lambda v: np.convolve(np.pad(v, 6, mode="edge"), np.ones(13) / 13, "valid"), 0, arr)
    ys = np.arange(183, 621)
    k = np.clip((ys - 214) / (594 - 214), 0, 1)[:, None, None]
    model = topv[None, :, :] * (1 - k) + botv[None, :, :] * k
    region = out[183:621, x0 + 4:x1 - 3]
    m = ink[183:621, x0 + 4:x1 - 3]
    region[m] = model[m]
    # faint ghosts of the sample print are slightly darker than the clean ceramic: lift anything darker than the model,
    # keep everything brighter (gloss and reflections are part of the real photo)
    lum_d = (region - model).mean(2, keepdims=True)
    w = np.clip((lum_d + 0.5) / 3.0, 0, 1)
    region = model * (1 - w) + region * w
    out[183:621, x0 + 4:x1 - 3] = region
    _blank_cache[view] = out
    return out

def render(wrap_rgb, view):
    base = blank(view)
    g = GEO[view]; x0, x1 = g["x0"], g["x1"]
    cx, R = (x0 + x1) / 2, (x1 - x0) / 2
    Hs, Ws = wrap_rgb.shape[:2]
    out = base.copy()
    ys, xs = np.mgrid[0:800, x0:x1 + 1].astype(np.float32)
    u = np.clip((xs - cx) / R, -1, 1)
    ang = np.degrees(np.arcsin(u))
    s = ((PRINT_W_IN - MID_S) + (ang + MID_ANGLE) / DEG_PER_IN) if g["flip"] else (MID_S + (ang - MID_ANGLE) / DEG_PER_IN)
    depth = np.sqrt(1 - u ** 2)
    v = (ys - RIM_DY * (depth - 1) - PRINT_TOP) / PRINT_H
    inside = (s >= 0) & (s <= PRINT_W_IN) & (v >= 0) & (v <= 1) & (np.abs(u) < 0.998)
    sxi = np.clip(s / PRINT_W_IN * (Ws - 1), 0, Ws - 1); syi = np.clip(v * (Hs - 1), 0, Hs - 1)
    x0f = np.floor(sxi).astype(int); y0f = np.floor(syi).astype(int)
    x1f = np.minimum(x0f + 1, Ws - 1); y1f = np.minimum(y0f + 1, Hs - 1)
    fx = (sxi - x0f)[..., None]; fy = (syi - y0f)[..., None]
    c = (wrap_rgb[y0f, x0f] * (1 - fx) * (1 - fy) + wrap_rgb[y0f, x1f] * fx * (1 - fy) +
         wrap_rgb[y1f, x0f] * (1 - fx) * fy + wrap_rgb[y1f, x1f] * fx * fy)
    # feather the print into the ceramic at the curved edges (ink fades on the turn)
    edge = np.clip((0.998 - np.abs(u)) / 0.012, 0, 1)[..., None]
    region = out[:, x0:x1 + 1]
    printed = c * (region / 255.0)
    mix = region * (1 - edge) + printed * edge
    region[inside] = mix[inside]
    out[:, x0:x1 + 1] = region
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB")

# ---- presentation standard (same for every product) ----
# Mug (incl. handle and base) measured in Printrove's photo: 528 x 464 px.
# Both views use the same square crop size and the mug's own centre, so scale and position never change.
CROP = 620
MUG_CENTRE = {"a": (349.5, 394.0), "b": (426.0, 394.0)}
BG = np.array([250, 246, 240], np.float32)        # warm neutral, matches the site's photo stage (#FAF6F0)

def finalize(img, view):
    cx, cy = MUG_CENTRE[view]
    x0, y0 = round(cx - CROP / 2), round(cy - CROP / 2)
    return img.crop((x0, y0, x0 + CROP, y0 + CROP)).convert("RGB")   # no tint: the mug stays true white

if __name__ == "__main__":
    src, prefix, layout = sys.argv[1], sys.argv[2], sys.argv[3]
    x0 = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
    x1 = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
    FIT = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0
    pr = make_print(src, layout, x0, x1)
    pr.save(f"{prefix}-print.png", dpi=(300, 300))
    w = np.asarray(pr).astype(np.float32)
    for view in ("a", "b"):
        finalize(render(w, view), view).save(f"{prefix}-{view}.webp", "WEBP", quality=90, method=6)
    flat = pr.copy(); flat.thumbnail((1000, 500), Image.LANCZOS)
    watermark(flat).save(f"{prefix}-flat.webp", "WEBP", quality=80, method=6)
    tex = pr.convert("RGB").resize((1280, 572), Image.LANCZOS)          # 3D preview texture: screen quality only
    watermark(tex, size=26, alpha=30).save(f"{prefix}-wrap.webp", "WEBP", quality=82, method=6)
    print("ok", prefix)
