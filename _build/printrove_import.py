"""Import a Printrove mock-up zip (one design, one PNG per phone model).
Usage: python3 printrove_import.py <zip> <design-folder-slug>
Writes src/real/<slug>/<model>.webp (transparent, 600x800) and src/real/<slug>.json (model list).
Then add an entry to src/real.js and rebuild."""
import sys, zipfile, re, json, os, io
from PIL import Image, ImageDraw

zp, slug = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'real', slug)
os.makedirs(out, exist_ok=True)

z = zipfile.ZipFile(zp)
latest = {}
for n in z.namelist():
    b = os.path.basename(n)
    if n.startswith('__MACOSX') or not b.lower().endswith('.png'):
        continue
    m = re.match(r'.*?-default-(.+?)(?: glass phone case| phone case)?-(\d+)\.png$', b, re.I)
    if not m:
        continue
    k, ts = m.group(1).lower(), int(m.group(2))
    if k not in latest or latest[k][1] < ts:
        latest[k] = (n, ts)

def label(r):
    if r.startswith('apple iphone'):
        rest = r.replace('apple iphone', '').strip()
        if rest == '17 air':
            return 'Apple', 'iPhone Air'
        words = {'pro': 'Pro', 'max': 'Max', 'plus': 'Plus', 'mini': 'mini'}
        rest = ' '.join(w.upper() if w in ('xr', 'xs', 'x', 'se') else words.get(w, w) for w in rest.split())
        return 'Apple', 'iPhone ' + rest
    if r.startswith('samsung galaxy'):
        return 'Samsung', 'Galaxy ' + ' '.join('Ultra' if w == 'ultra' else w.upper() for w in r.replace('samsung galaxy', '').split())
    if r.startswith('oneplus'):
        return 'OnePlus', 'OnePlus ' + r.replace('oneplus', '').strip().upper()
    return r.split()[0].capitalize(), r.title()

rows = []
for k, (n, _) in latest.items():
    brand, lab = label(k)
    s = re.sub(r'[^a-z0-9]+', '-', lab.lower()).strip('-')
    im = Image.open(io.BytesIO(z.read(n))).convert('RGBA')
    w, h = im.size
    tmp = im.convert('RGB')
    for sd in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(tmp, sd, (255, 0, 255), thresh=28)
    px, op = tmp.load(), im.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] == (255, 0, 255):
                op[x, y] = (255, 255, 255, 0)
    im = im.crop(im.getbbox())
    cw, ch = im.size
    sc = min(560 / cw, 780 / ch)
    im = im.resize((int(cw * sc), int(ch * sc)), Image.LANCZOS)
    c = Image.new('RGBA', (600, 800), (0, 0, 0, 0))
    c.alpha_composite(im, ((600 - im.size[0]) // 2, (800 - im.size[1]) // 2))
    c.save(f'{out}/{s}.webp', 'WEBP', quality=82, method=6)
    rows.append({'brand': brand, 'label': lab, 'slug': s})

def key(r):
    nums = re.findall(r'\d+', r['label'])
    n = int(nums[0]) if nums else (17 if 'Air' in r['label'] else 10)
    v = next((i for i, k in enumerate(['Pro Max', 'Ultra', 'Pro', 'Plus', 'Air', 'R', 'mini']) if k in r['label']), 9)
    return ({'Apple': 0, 'Samsung': 1, 'OnePlus': 2}.get(r['brand'], 3), -n, v)

rows.sort(key=key)
json.dump(rows, open(out + '.json', 'w'), indent=0)
print(len(rows), 'models')
