# Builds a reusable case frame from Printrove's iPhone 16 Pro photo: print area mask + frame layer (bezel, camera, buttons).
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
src = Image.open("/home/claude/nevervoid/src/real/knitted-christmas-puppies/iphone-16-pro.webp").convert("RGBA"); a = np.asarray(src)
alpha = (a[..., 3] > 200).astype(np.uint8)
rows = [np.nonzero(alpha[y])[0] for y in range(alpha.shape[0])]; good = [(r.min(), r.max()) for r in rows if len(r)]
bx0 = int(np.median([g[0] for g in good])); bx1 = int(np.percentile([g[1] for g in good], 20))
ys = np.nonzero(alpha.any(1))[0]; by0, by1 = ys.min(), ys.max()
rr = Image.new("L", src.size, 0); ImageDraw.Draw(rr).rounded_rectangle((bx0+10, by0+10, bx1-10, by1-10), radius=56, fill=255)
inner = np.asarray(rr.filter(ImageFilter.GaussianBlur(1.0))).astype(np.float32) / 255
rgb = a[..., :3].astype(np.int16); sat = rgb.max(2) - rgb.min(2); reg = (slice(25, 245), slice(118, 345))
plate = np.zeros(alpha.shape, bool); plate[reg] = (sat[reg] < 14) & (rgb[reg].mean(2) > 125)
n, lab, st, _ = cv2.connectedComponentsWithStats(plate.astype(np.uint8)); k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); px, py, pw, ph = st[k, :4]; pad = 7
cm = Image.new("L", src.size, 0); ImageDraw.Draw(cm).rounded_rectangle((px-pad, py-pad, px+pw+pad, py+ph+pad), radius=int(min(pw, ph)*0.22)+pad, fill=255)
cam = np.asarray(cm.filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
printmask = np.clip(inner * (1 - cam), 0, 1)
frame = a.copy(); frame[..., 3] = (a[..., 3] * (1 - printmask)).astype(np.uint8)
Image.fromarray(frame, "RGBA").save("frame-iphone-16-pro.png")
Image.fromarray((printmask * 255).astype(np.uint8), "L").save("mask-iphone-16-pro.png")
open("rect.txt", "w").write(f"{bx0+10} {by0+10} {bx1-10} {by1-10}")
print("print rect", bx0+10, by0+10, bx1-10, by1-10)
