import sys, numpy as np
from PIL import Image
frame = Image.open("/home/claude/caseframes/frame-iphone-16-pro.png").copy(); mask = Image.open("/home/claude/caseframes/mask-iphone-16-pro.png").copy()
x0, y0, x1, y1 = map(int, open("/home/claude/caseframes/rect.txt").read().split())
def render(design_path, out_path, scale=2):
    W, H = frame.size; S = scale
    d = Image.open(design_path).convert("RGB"); rw, rh = (x1 - x0) * S, (y1 - y0) * S
    r = max(rw / d.width, rh / d.height); d = d.resize((round(d.width * r), round(d.height * r)), Image.LANCZOS)   # cover, never stretch
    cx, cy = (d.width - rw) // 2, (d.height - rh) // 2; d = d.crop((cx, cy, cx + rw, cy + rh))
    canvas = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0)); layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0)); layer.paste(d, (x0 * S, y0 * S))
    layer.putalpha(mask.resize(canvas.size, Image.LANCZOS)); canvas.alpha_composite(layer)
    canvas.alpha_composite(frame.resize(canvas.size, Image.LANCZOS))
    canvas.save(out_path, "WEBP", quality=86, method=6)
if __name__ == "__main__": render(sys.argv[1], sys.argv[2])
