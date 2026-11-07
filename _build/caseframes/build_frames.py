import numpy as np, cv2, json, os
from PIL import Image
from pair import pair
models = json.load(open("/home/claude/nevervoid/src/real/knitted-christmas-puppies.json"))
os.makedirs("frames", exist_ok=True)
def fill_holes(m):
    cnts, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = np.zeros(m.shape, np.uint8); cv2.drawContours(out, cnts, -1, 1, -1); return out
def build(slug):
    new, warped, sn, M = pair(slug)
    diff = cv2.GaussianBlur(np.abs(new - warped).mean(2), (0, 0), 1.5)
    low = (diff < 16).astype(np.uint8)
    case = fill_holes(cv2.morphologyEx(sn, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(case); case = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    # bezel: peel layers while they are mostly identical in both photos
    k = 2
    for k in range(2, 30):
        a = cv2.erode(case, np.ones((3, 3), np.uint8), iterations=k); b = cv2.erode(case, np.ones((3, 3), np.uint8), iterations=k + 1)
        layer = (a > 0) & (b == 0)
        if layer.sum() and low[layer].mean() < 0.6: break
    inner = cv2.erode(case, np.ones((3, 3), np.uint8), iterations=k)
    ell = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))
    inner = cv2.morphologyEx(inner, cv2.MORPH_CLOSE, ell) & cv2.erode(case, np.ones((3, 3), np.uint8), iterations=max(2, k - 3))   # smooth edge notches
    ys, xs = np.nonzero(inner); y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    # camera: identical-in-both regions in the top part of the back, near the top-left
    top = np.zeros_like(inner); top[y0:y0 + int((y1 - y0) * 0.42), :] = 1
    cand = cv2.morphologyEx(low & inner & top, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(cand)
    comps = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 150]
    cam = np.zeros_like(inner)
    if comps:
        main = max(comps, key=lambda i: st[i, cv2.CC_STAT_AREA]); mx, my, mw, mh = st[main, :4]
        for i in comps:
            x, y, w, h = st[i, :4]
            near = x < mx + mw + 40 and x + w > mx - 40 and y < my + mh + 40 and y + h > my - 40
            if near and (x - x0) < (x1 - x0) * 0.75: cam[lab == i] = 1
        cam = cv2.morphologyEx(cam, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)); cam = fill_holes(cam)
        cam = cv2.dilate(cam, np.ones((3, 3), np.uint8), iterations=1)
    pm = ((inner > 0) & (cam == 0)).astype(np.float32); pm = cv2.GaussianBlur(pm, (0, 0), 0.8)
    rgba = np.dstack([new, case.astype(np.float32) * 255]).astype(np.uint8)
    rgba = cv2.GaussianBlur(rgba, (0, 0), 0) if False else rgba
    frame = rgba.copy(); frame[..., 3] = (case * 255 * (1 - pm)).astype(np.uint8)
    Image.fromarray(frame, "RGBA").save(f"frames/{slug}-frame.webp", "WEBP", quality=90, method=6)
    Image.fromarray((pm * 255).astype(np.uint8), "L").save(f"frames/{slug}-mask.png", optimize=True)
    return [int(x0), int(y0), int(x1), int(y1)], k
if __name__ == "__main__":
    rects = {}; sheet = Image.new("RGB", (9 * 130, 4 * 175), "white")
    for i, m in enumerate(models):
        r, k = build(m["slug"]); rects[m["slug"]] = r
        fr = Image.open(f"frames/{m['slug']}-frame.webp"); pm = Image.open(f"frames/{m['slug']}-mask.png")
        dbg = Image.new("RGBA", fr.size, (255, 255, 255, 255)); mag = Image.new("RGBA", fr.size, (255, 0, 200, 255)); mag.putalpha(pm); dbg.alpha_composite(mag); dbg.alpha_composite(fr)
        t = dbg.convert("RGB").crop((r[0] - 20, r[1] - 20, r[2] + 20, r[3] + 20)); t.thumbnail((125, 167)); sheet.paste(t, ((i % 9) * 130, (i // 9) * 175))
    json.dump(rects, open("frames/rects.json", "w")); sheet.save("/tmp/gframes.jpg", quality=85); print("ok")
