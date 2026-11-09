import sys
from PIL import Image
frame = Image.open("/home/claude/caseframes/clean-frame.png"); mask = Image.open("/home/claude/caseframes/clean-mask.png")
x0, y0, x1, y1 = map(int, open("/home/claude/caseframes/clean-rect.txt").read().split())
def render(design_path, out_path):
    W, H = frame.size; rw, rh = x1 - x0, y1 - y0
    d = Image.open(design_path).convert("RGB"); r = max(rw / d.width, rh / d.height)
    d = d.resize((round(d.width * r), round(d.height * r)), Image.LANCZOS)   # cover, never stretch
    cx, cy = (d.width - rw) // 2, (d.height - rh) // 2; d = d.crop((cx, cy, cx + rw, cy + rh))
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); layer.paste(d, (x0, y0)); layer.putalpha(mask)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0)); canvas.alpha_composite(layer); canvas.alpha_composite(frame)
    canvas.save(out_path, "WEBP", quality=88, method=6)
if __name__ == "__main__": render(sys.argv[1], sys.argv[2])
