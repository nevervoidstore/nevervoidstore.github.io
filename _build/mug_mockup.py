"""Wrap a flat mug print onto a 3D-looking ceramic mug.
Usage: python3 mug_mockup.py <wrap.png> <out.webp> [two|full]
  two  = design repeated on both halves (front shows the left half)
  full = one scene around the mug (front shows the middle half)
Also writes <out>-flat.webp: the full wrap as a strip preview."""
import sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src_path, out_path = sys.argv[1], sys.argv[2]
mode = sys.argv[3] if len(sys.argv) > 3 else "two"

wrap = Image.open(src_path).convert("RGBA")
bg = Image.new("RGBA", wrap.size, (255, 255, 255, 255))
wrap = Image.alpha_composite(bg, wrap).convert("RGB")
W0, H0 = wrap.size
crop = {"two": (0, 0, W0 // 2, H0), "left": (0, 0, W0 // 2, H0), "right": (W0 // 2, 0, W0, H0)}.get(mode, (W0 // 4, 0, W0 * 3 // 4, H0))
crop = wrap.crop(crop)
crop = np.asarray(crop).astype(np.float32) / 255.0
ch, cw = crop.shape[:2]

S = 2                      # supersample
N = 1000 * S
cx, R = 440 * S, 255 * S   # body centre x and radius
top, bot = 250 * S, 790 * S
ry = int(R * 0.16)         # ellipse depth for the rim and base
print_top, print_bot = top + 26 * S, bot - 22 * S

canvas = Image.new("RGBA", (N, N), (0, 0, 0, 0))
d = ImageDraw.Draw(canvas)

# soft shadow
sh = Image.new("RGBA", (N, N), (0, 0, 0, 0))
ImageDraw.Draw(sh).ellipse((cx - R * 1.25, bot + ry * 0.2, cx + R * 1.55, bot + ry * 2.1), fill=(40, 30, 20, 70))
canvas = Image.alpha_composite(canvas, sh.filter(ImageFilter.GaussianBlur(18 * S)))
d = ImageDraw.Draw(canvas)

# handle (drawn first so the body overlaps it)
hx0, hy0, hx1, hy1 = cx + R - 40 * S, top + 70 * S, cx + R + 165 * S, bot - 120 * S
d.ellipse((hx0, hy0, hx1, hy1), outline=(226, 224, 220, 255), width=46 * S)
d.ellipse((hx0 + 8 * S, hy0 + 8 * S, hx1 - 8 * S, hy1 - 8 * S), outline=(246, 245, 242, 255), width=22 * S)

# body: cylinder mapping
ys, xs = np.mgrid[0:N, 0:N].astype(np.float32)
u = (xs - cx) / R
inside_x = np.abs(u) <= 1
uu = np.clip(u, -1, 1)
depth = np.sqrt(1 - uu ** 2)
y_top_edge = top + ry * depth
y_bot_edge = bot + ry * depth
body = inside_x & (ys >= y_top_edge) & (ys <= y_bot_edge)

theta = np.arcsin(uu)
s = (theta + math.pi / 2) / math.pi
sx = np.clip((s * (cw - 1)).astype(np.int32), 0, cw - 1)
pt = print_top + ry * depth
pb = print_bot + ry * depth
v = (ys - pt) / (pb - pt)
in_print = body & (v >= 0) & (v <= 1)
sy = np.clip((v * (ch - 1)).astype(np.int32), 0, ch - 1)

rgb = np.ones((N, N, 3), np.float32) * np.array([0.975, 0.972, 0.965], np.float32)
rgb[in_print] = crop[sy[in_print], sx[in_print]]

# lighting: soft falloff to the edges, gentle highlight on the left
light = 0.80 + 0.22 * np.cos(theta + 0.35)
spec = np.exp(-((uu + 0.48) / 0.07) ** 2) * 0.22
rgb = rgb * light[..., None] + spec[..., None]
rgb = np.clip(rgb, 0, 1)

alpha = (body * 255).astype(np.uint8)
body_img = Image.fromarray((rgb * 255).astype(np.uint8), "RGB").convert("RGBA")
body_img.putalpha(Image.fromarray(alpha))
canvas = Image.alpha_composite(canvas, body_img)

# rim and opening
d = ImageDraw.Draw(canvas)
d.ellipse((cx - R, top - ry, cx + R, top + ry), fill=(238, 236, 232, 255))
d.ellipse((cx - R + 12 * S, top - ry + 9 * S, cx + R - 12 * S, top + ry - 7 * S), fill=(206, 202, 196, 255))
d.ellipse((cx - R + 22 * S, top - ry + 20 * S, cx + R - 22 * S, top + ry + 6 * S), fill=(188, 184, 178, 255))

out = canvas.resize((1000, 1000), Image.LANCZOS)
bbox = out.getbbox()
out = out.crop(bbox)
w, h = out.size
sc = min(760 / w, 760 / h)
out = out.resize((int(w * sc), int(h * sc)), Image.LANCZOS)
final = Image.new("RGBA", (800, 800), (0, 0, 0, 0))
final.alpha_composite(out, ((800 - out.size[0]) // 2, (800 - out.size[1]) // 2))
final.save(out_path, "WEBP", quality=84, method=6)

flat = wrap.copy()
flat.thumbnail((1200, 600), Image.LANCZOS)
flat.save(out_path.replace(".webp", "-flat.webp"), "WEBP", quality=82, method=6)
print("ok", out_path)
