import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
SERIF="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"; SANS="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
CREAM=(246,239,227); SAGE=(214,226,212); GREEN=(31,77,54); RED=(168,51,47)
def paw(d, cx, cy, r, fill):
    d.ellipse((cx-r*0.95, cy-r*0.55, cx+r*0.95, cy+r*0.75), fill=fill)
    for dx, dy, s in [(-1.05,-1.0,0.38),(-0.38,-1.55,0.4),(0.38,-1.55,0.4),(1.05,-1.0,0.38)]:
        x, y = cx+dx*r, cy+dy*r; d.ellipse((x-s*r, y-s*r*1.2, x+s*r, y+s*r*1.2), fill=fill)
def panel(w, h):
    im = Image.new("RGB", (w, h), (255,255,255)); d = ImageDraw.Draw(im)
    R = int(min(w, h) * 0.30); cx, cy = w // 2, int(h * 0.42)
    d.ellipse((cx-R-10, cy-R-10, cx+R+10, cy+R+10), fill=(255,255,255)); d.ellipse((cx-R, cy-R, cx+R, cy+R), fill=SAGE)
    paw(d, cx, cy + R*0.18, R*0.38, GREEN)
    t1 = "Your pet here"; t2 = "Send a photo · approve before we print"
    def fit(path, size, text, maxw):
        f = ImageFont.truetype(path, size)
        while d.textlength(text, font=f) > maxw: size -= 2; f = ImageFont.truetype(path, size)
        return f
    f1 = fit(SERIF, int(R*0.36), t1, w*0.80); f2 = fit(SANS, int(R*0.15), t2, w*0.78)
    d.text((cx, cy + R + R*0.42), t1, font=f1, fill=GREEN, anchor="mm")
    d.text((cx, cy + R + R*0.86), t2, font=f2, fill=(110,104,94), anchor="mm")
    for i in range(14):  # a few scattered small paws
        rng = np.random.default_rng(i); x = rng.uniform(0.06, 0.94)*w; y = rng.uniform(0.05, 0.95)*h
        if abs(x-cx) < R*1.6 and abs(y-cy) < R*1.9: continue
        paw(d, x, y, R*0.07, (232,222,206))
    return im
# mug print file: same panel facing both sides (21.2% / 78.8% of the wrap)
W, H = 2550, 1140; wrap = Image.new("RGB", (W, H), (255,255,255))
p = panel(1080, 1140); wrap.paste(p, (int(W*0.212) - 540, 0)); wrap.paste(p, (int(W*0.788) - 540, 0))
wrap.save("custom-pet-mug-design.png")
# case: replace the printed area of Printrove's case photo, keep bezel, camera and buttons
src = Image.open("/home/claude/nevervoid/src/real/knitted-christmas-puppies/iphone-16-pro.webp").convert("RGBA"); a = np.asarray(src)
alpha = (a[..., 3] > 200).astype(np.uint8)
rows = [np.nonzero(alpha[y])[0] for y in range(alpha.shape[0])]; good = [(r.min(), r.max()) for r in rows if len(r)]
bx0 = int(np.median([g[0] for g in good])); bx1 = int(np.percentile([g[1] for g in good], 20))
cols = np.nonzero(alpha.any(1))[0]; by0, by1 = cols.min(), cols.max()
rr = Image.new("L", src.size, 0); ImageDraw.Draw(rr).rounded_rectangle((bx0+10, by0+10, bx1-10, by1-10), radius=56, fill=255)
inner = np.asarray(rr.filter(ImageFilter.GaussianBlur(1.0))).astype(np.float32) / 255
print("body", bx0, bx1, by0, by1)
rgb = a[..., :3].astype(np.int16); sat = rgb.max(2) - rgb.min(2); reg = (slice(25, 245), slice(118, 345))
plate = np.zeros(alpha.shape, bool); plate[reg] = (sat[reg] < 14) & (rgb[reg].mean(2) > 125)
n, lab, st, _ = cv2.connectedComponentsWithStats(plate.astype(np.uint8)); k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
px, py, pw, ph = st[k, :4]; pad = 7
cm = Image.new("L", src.size, 0); ImageDraw.Draw(cm).rounded_rectangle((px - pad, py - pad, px + pw + pad, py + ph + pad), radius=int(min(pw, ph) * 0.22) + pad, fill=255)
cam = np.asarray(cm.filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
print("plate", px, py, pw, ph)
ys, xs = np.nonzero(inner > 0.5); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
des = panel(x1 - x0 + 1, y1 - y0 + 1); full = np.zeros_like(a[..., :3]); full[y0:y1+1, x0:x1+1] = np.asarray(des)
m = (np.clip(inner, 0, 1) * (1 - cam))[..., None]
out = a.copy().astype(np.float32); out[..., :3] = a[..., :3] * (1 - m) + full * m
# a touch of the original gloss: keep 8% of the original luminance variation
Image.fromarray(out.astype(np.uint8), "RGBA").save("custom-pet-case.webp", "WEBP", quality=90)
bg = Image.new("RGBA", src.size, (255,255,255,255)); bg.alpha_composite(Image.open("custom-pet-case.webp")); bg.convert("RGB").save("/tmp/ccase.png")
print("ok")
