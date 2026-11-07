import numpy as np, cv2, json
from PIL import Image
mp = json.load(open("/home/claude/green/map.json"))
OLD = "/home/claude/nevervoid/src/real/knitted-christmas-puppies/"
def pair(slug):
    new = np.asarray(Image.open("/home/claude/green/x/" + mp[slug]).convert("RGB")).astype(np.float32)
    o = Image.open(OLD + slug + ".webp").convert("RGBA"); bg = Image.new("RGBA", o.size, (255, 255, 255, 255)); bg.alpha_composite(o)
    old = np.asarray(bg.convert("RGB")).astype(np.float32)
    # align old -> new on the case silhouette (dark outline on white), scale + shift
    def sil(a): return (a.mean(2) < 235).astype(np.uint8)
    sn = sil(new); so = sil(old)
    yn, xn = np.nonzero(sn); yo, xo = np.nonzero(so)
    s = (yn.max() - yn.min()) / (yo.max() - yo.min())
    dx = xn.min() - xo.min() * s; dy = yn.min() - yo.min() * s
    M = np.float32([[s, 0, dx], [0, s, dy]])
    # refine with ECC on grayscale edges
    gn = cv2.cvtColor(new.astype(np.uint8), cv2.COLOR_RGB2GRAY); go = cv2.cvtColor(old.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    try:
        _, M = cv2.findTransformECC(cv2.GaussianBlur(gn, (5, 5), 0).astype(np.float32), cv2.GaussianBlur(go, (5, 5), 0).astype(np.float32), M, cv2.MOTION_AFFINE,
                                    (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-5), cv2.bitwise_and(sn, sn) * 255, 5)
    except cv2.error: pass
    warped = cv2.warpAffine(old, M, (new.shape[1], new.shape[0]), flags=cv2.INTER_LINEAR, borderValue=(255, 255, 255))
    return new, warped, sn, M
if __name__ == "__main__":
    import sys
    new, warped, sn, M = pair(sys.argv[1] if len(sys.argv) > 1 else "iphone-16-pro")
    diff = cv2.GaussianBlur(np.abs(new - warped).mean(2), (0, 0), 3)
    print(M)
    viz = np.concatenate([new, warped, np.stack([np.clip(diff * 3, 0, 255)] * 3, 2)], 1).astype(np.uint8)
    Image.fromarray(viz[60:760]).resize((1200, 350)).save("/tmp/pair.jpg", quality=85)
