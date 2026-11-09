# Clean, high-resolution iPhone 16 Pro case frame for product renders.
# The old frame/mask were traced from a 600x800 photo and showed wobbly edges, a button notch and blocky steps
# when scaled up. Here the print area and bezel are drawn as smooth shapes at full output size (1200x1600),
# measured from that same photo; only the camera island is taken from the photo.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

S = 2                      # output = 600x800 * 2
W, H = 600 * S, 800 * S
SS = 4                     # supersampling for anti-aliased edges

# measured on the 600x800 photo
BODY = (121, 31, 479, 770, 50)        # print area: x0, y0, x1, y1, corner radius
BEZEL = 7                             # dark rim width outside the print area
ISLAND = (131, 36, 326, 238, 40)      # camera island (hole in the print), incl. its dark border

def rr_mask(box, grow=0):
    x0, y0, x1, y1, r = box
    m = Image.new("L", (W * SS, H * SS), 0)
    k = S * SS
    ImageDraw.Draw(m).rounded_rectangle(((x0 - grow) * k, (y0 - grow) * k, (x1 + grow) * k, (y1 + grow) * k), radius=(r + grow) * k, fill=255)
    return np.asarray(m.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255

body = rr_mask(BODY)
outer = rr_mask(BODY, BEZEL)
island = rr_mask(ISLAND)
island_in = rr_mask(ISLAND, -6)       # the grey plate inside the island border

print_mask = np.clip(body - island, 0, 1)

photo = Image.open("/home/claude/caseframes/frame-iphone-16-pro.png").convert("RGBA").resize((W, H), Image.LANCZOS)
ph = np.asarray(photo).astype(np.float32)

frame = np.zeros((H, W, 4), np.float32)
# bezel: soft charcoal with a slight top-left highlight
yy, xx = np.mgrid[0:H, 0:W]
shade = 46 + 10 * (1 - (xx / W + yy / H) / 2)
rim = np.clip(outer - body, 0, 1)
for c in range(3): frame[..., c] = shade
frame[..., 3] = rim * 255
# camera island: dark border ring + the photo's lenses on the plate
ring = np.clip(island - island_in, 0, 1)
for c in range(3): frame[..., c] = frame[..., c] * (1 - ring) + 38 * ring
frame[..., 3] = np.maximum(frame[..., 3], ring * 255)
plate = island_in
for c in range(3): frame[..., c] = frame[..., c] * (1 - plate) + ph[..., c] * plate
frame[..., 3] = np.maximum(frame[..., 3], plate * 255)
# a hairline inner shadow where the print meets the bezel, for depth
edge = np.asarray(Image.fromarray((body * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3 * S))).astype(np.float32) / 255
inner_sh = np.clip(body - edge, 0, 1) * 0.35
fr = Image.fromarray(frame.clip(0, 255).astype(np.uint8), "RGBA")
sh = np.zeros((H, W, 4), np.uint8); sh[..., 3] = (inner_sh * 255).astype(np.uint8)
out = Image.alpha_composite(Image.fromarray(sh, "RGBA"), fr)
out.save("/home/claude/caseframes/clean-frame.png")
Image.fromarray((print_mask * 255).astype(np.uint8), "L").save("/home/claude/caseframes/clean-mask.png")
open("/home/claude/caseframes/clean-rect.txt", "w").write(" ".join(str(v * S) for v in BODY[:4]))
print("ok", W, H)
