# Trace each phone's real case frame from two Printrove mockups of the same case with different designs.
# Pixels identical in both mockups = the case itself (rim, camera module, lenses, buttons) -> frame layer.
# Pixels that differ = where the design prints -> print-area mask.
# Output, in the site's 1200x1600 canvas: <slug>-frame.webp (no dark shade), <slug>-mask.png, and the body box.
import sys, os, json, re
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

PUP, ELF, OUT = sys.argv[1:4]
slugs = sys.argv[4:]
os.makedirs(OUT, exist_ok=True)
elf_files = os.listdir(ELF)

def elf_candidates(slug):
    words = slug.replace('iphone-air', 'iphone-17-air').replace('galaxy', 'galaxy').split('-')
    pat = re.compile(r'_' + '_'.join(words) + r'(_glass|-)', re.I)
    return [os.path.join(ELF, f) for f in elf_files if pat.search(f.replace('Apple_', '_').replace('Samsung_', '_').replace('Oneplus_', '_oneplus_'))]

def bbox(m):
    ys, xs = np.nonzero(m); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

OLD = os.environ.get('OLD_FRAMES', 'images/cases/frames')
def camroi(slug, silP):
    """Where the camera module can be: the measured cut-out of the previous frames, widened by 60 px."""
    m = np.asarray(Image.open(os.path.join(OLD, slug + '-mask.png')).convert('L').resize(silP.shape[::-1])) > 127
    cut = silP & ~m & ndi.binary_erosion(silP, iterations=20)
    lab, n = ndi.label(cut); sz = np.bincount(lab.ravel()); sz[0] = 0
    keep = np.isin(lab, np.nonzero(sz > silP.sum() * 0.004)[0])
    return ndi.binary_dilation(keep, iterations=int(os.environ.get('ROI_GROW', '14')))

def trace(slug):
    P = Image.open(os.path.join(PUP, slug + '.webp')).convert('RGBA'); p = np.asarray(P).astype(np.float32)
    silP = p[..., 3] > 128
    # some mockups (iPhone 17) bake an opaque light-grey drop shadow under the case: drop light neutral pixels touching the outside
    rgbP = p[..., :3]; shade = silP & (rgbP.min(2) > 185) & ((rgbP.max(2) - rgbP.min(2)) < 14)
    lab, n = ndi.label(shade); outside = ndi.binary_dilation(~silP, iterations=2)
    touch = np.unique(lab[outside & (lab > 0)]); silP &= ~np.isin(lab, touch[touch > 0])
    silP = ndi.binary_opening(ndi.binary_fill_holes(silP), iterations=1)
    lab, n = ndi.label(silP); silP = lab == (np.argmax(np.bincount(lab.ravel())[1:]) + 1)
    # case outlines are the same top and bottom: use the top's corners for the bottom (shadows blur the bottom edge)
    ys = np.nonzero(silP.any(1))[0]; t0, t1 = ys.min(), ys.max(); h = t1 - t0 + 1
    flip = np.zeros_like(silP); flip[t0:t1 + 1] = silP[t0:t1 + 1][::-1]
    bottom = np.zeros_like(silP); bottom[t0 + h // 2:] = True
    silP = np.where(bottom, silP & flip, silP)
    bx0, by0, bx1, by1 = bbox(silP)
    best = None
    for ef in elf_candidates(slug):
        e = np.asarray(Image.open(ef).convert('RGB')).astype(np.float32)
        silE = e.mean(2) < 235
        silE = ndi.binary_fill_holes(ndi.binary_closing(silE, iterations=3))
        lab, n = ndi.label(silE); silE = lab == (np.argmax(np.bincount(lab.ravel())[1:]) + 1)
        ex0, ey0, ex1, ey1 = bbox(silE)
        H, W = silP.shape
        def place(scale, dx, dy):
            w, h = round((bx1 - bx0) * scale), round((by1 - by0) * scale)
            E = np.asarray(Image.fromarray(e.astype(np.uint8)).crop((ex0, ey0, ex1, ey1)).resize((w, h), Image.LANCZOS)).astype(np.float32)
            cx, cy = (bx0 + bx1) / 2 + dx, (by0 + by1) / 2 + dy
            x0, y0 = round(cx - w / 2), round(cy - h / 2)
            ea = np.full_like(p[..., :3], 255.0)
            sx0, sy0, tx0, ty0 = max(0, -x0), max(0, -y0), max(0, x0), max(0, y0)
            ww, hh = min(w - sx0, W - tx0), min(h - sy0, H - ty0)
            ea[ty0:ty0 + hh, tx0:tx0 + ww] = E[sy0:sy0 + hh, sx0:sx0 + ww]
            return ea
        inner = ndi.binary_erosion(silP, iterations=6)
        def fit(ea): return (np.abs(p[..., :3] - ea).mean(2)[inner] < 14).mean()
        cand = [(fit(place(1, 0, 0)), 1.0, 0, 0)]
        for sc in [0.985, 0.99, 0.995, 1.0, 1.005, 1.01, 1.015]:
            for dx in range(-6, 7, 2):
                for dy in range(-6, 7, 2):
                    cand.append((fit(place(sc, dx, dy)), sc, dx, dy))
        f0, sc, dx, dy = max(cand)
        for dx2 in (dx - 1, dx, dx + 1):
            for dy2 in (dy - 1, dy, dy + 1):
                cand.append((fit(place(sc, dx2, dy2)), sc, dx2, dy2))
        f0, sc, dx, dy = max(cand)
        ea = place(sc, dx, dy)
        diff = ndi.gaussian_filter(np.abs(p[..., :3] - ea).mean(2), 1.0)
        score = 100 * (1 - f0)   # % of case-interior pixels that do NOT match (lower = better aligned)
        if best is None or score < best[0]: best = (score, diff, ef, ea)
    if best is None: raise SystemExit(f'no elf mockup for {slug}')
    score, diff, ef, best_ea = best
    same = silP & (diff < float(os.environ.get('SAME_T', '14')))
    same = ndi.binary_opening(same, iterations=2)
    lab, n = ndi.label(same); sizes = np.bincount(lab.ravel()); keep = np.zeros_like(sizes, bool)
    keep[1:] = sizes[1:] > silP.sum() * 0.0015
    frame = keep[lab]
    rim = silP & ~ndi.binary_erosion(silP, iterations=int(round((bx1 - bx0) * 0.022)))          # wide, for finding modules
    rim_thin = silP & ~ndi.binary_erosion(silP, iterations=max(3, int(round((bx1 - bx0) * 0.010))))  # what the case edge really covers
    upper = np.zeros_like(silP); upper[: by0 + int((by1 - by0) * 0.34)] = True   # camera modules sit in the top of the back
    # camera modules: pixels that are identical in both mockups (strict), inside where this model's camera can be,
    # each piece closed up by its convex hull (modules, plateaus and lens rings are convex shapes).
    from scipy.spatial import ConvexHull
    from PIL import ImageDraw
    roi = camroi(slug, silP) & upper & ~rim_thin
    strict = ndi.binary_opening(silP & roi & (diff < float(os.environ.get('CAM_T', '6'))), iterations=2)
    lab, n = ndi.label(ndi.binary_dilation(strict, iterations=int(os.environ.get('CAM_JOIN', '5')))); lab = lab * strict; sizes = np.bincount(lab.ravel(), minlength=n + 1)
    hull_img = Image.new('L', silP.shape[::-1], 0); dr = ImageDraw.Draw(hull_img)
    for i in range(1, n + 1):
        if sizes[i] < silP.sum() * float(os.environ.get('CAM_MIN', '0.0012')): continue
        ys, xs = np.nonzero(lab == i); pts = np.c_[xs, ys]
        h = ConvexHull(pts); dr.polygon([tuple(map(float, pts[v])) for v in h.vertices], fill=255)
    cams = (np.asarray(hull_img) > 0) & silP
    frame = (rim_thin | cams) & silP
    printm = silP & ~frame
    # Anything off the rim where the two mockups differ is printed design, never case: print it.
    # (Catches thin strips beside camera plateaus that would otherwise show the old mockup's design.)
    raw = np.abs(p[..., :3] - best_ea).mean(2)
    edge = ndi.distance_transform_edt(silP) < (bx1 - bx0) * float(os.environ.get('EDGE_BAND', '0.07'))   # strips run along the case edge
    differs = ndi.gaussian_filter(raw, 0.7) > 18
    leak = ndi.binary_opening(silP & ~rim_thin & ~printm & ~ndi.binary_erosion(cams, iterations=3) & differs, iterations=1)
    # thin design strips squeezed between a plateau and the case edge: keep them even if only 2-3 px wide
    strip = silP & ~rim_thin & ~printm & edge & differs
    lab, n = ndi.label(strip); sz = np.bincount(lab.ravel()); sz[0] = 0
    leak |= np.isin(lab, np.nonzero(sz >= 6)[0])
    # inside a module, only big, strongly different patches are design (e.g. beside the iPhone 17 flash)
    inner = ndi.binary_opening(cams & ~edge & (ndi.gaussian_filter(raw, 1.0) > float(os.environ.get('IN_T', '45'))), iterations=3)
    leak |= inner
    printm = ndi.binary_closing(printm | leak, iterations=1) & silP
    if os.environ.get('DEBUG'):
        v = np.zeros(silP.shape + (3,), np.uint8); v[silP] = 60; v[rim_thin] = (0, 0, 255); v[cams] = (0, 200, 0); v[leak] = (255, 0, 0)
        Image.fromarray(v).save(os.path.join(OUT, slug + '-debug.png'))
    left = silP & ~rim_thin & ~printm & (raw > 30)
    LEAKS[slug] = round(100 * left.sum() / max(1, (silP & ~rim_thin & ~printm).sum()), 2)
    # back to soft edges
    soft = ndi.gaussian_filter(printm.astype(np.float32), 0.8)
    frame_alpha = np.clip((p[..., 3] / 255) * (1 - soft), 0, 1)
    frame_alpha *= ndi.gaussian_filter(ndi.binary_dilation(silP, iterations=1).astype(np.float32), 0.6)   # no baked-in shadow outside the case
    # scale x2 into the 1200x1600 canvas (puppies mockups are 600x800)
    # last guard: any case pixel still showing the old mockup's design (differs between the mockups) takes the rim colour
    rgbF = p[..., :3].copy(); stray = (frame_alpha > 0.05) & differs & ~ndi.binary_erosion(cams, iterations=4)
    rimcol = np.median(p[..., :3][rim_thin & ~differs], axis=0) if (rim_thin & ~differs).any() else np.array([30, 30, 30])
    rgbF[ndi.binary_dilation(stray, iterations=1)] = rimcol
    fr = Image.fromarray(np.dstack([rgbF, frame_alpha * 255]).astype(np.uint8), 'RGBA').resize((1200, 1600), Image.LANCZOS)
    mk = Image.fromarray((soft * 255).astype(np.uint8), 'L').resize((1200, 1600), Image.LANCZOS)
    fr.save(os.path.join(OUT, slug + '-frame.webp'), 'WEBP', quality=92, method=6)
    mk.save(os.path.join(OUT, slug + '-mask.png'), optimize=True)
    x0, y0, x1, y1 = (int(v) * 2 for v in (bx0, by0, bx1, by1))
    return [int(x0), int(y0), int(x1), int(y1)], os.path.basename(ef), float(score)

rects = {}; LEAKS = {}
for s in slugs:
    r, ef, sc = trace(s); rects[s] = r
    print(f'{s:20s} body {r}  case-pixels-that-differ {LEAKS[s]}%')
json.dump(rects, open(os.path.join(OUT, 'rects.part.json'), 'w'))
