"""Build catalog.csv (Meta / WhatsApp product feed) from the product pages' JSON-LD.

Run from the repo root:  python3 _build/catalog_feed.py
Meta Commerce Manager fetches https://nevervoidstore.com/catalog.csv on a schedule.
"""
import csv, glob, json, re

PERSONALISED = [("custom-mug/index.html", "mug-name"), ("send-a-wish-custom-mug/index.html", "mug-wish")]
MUG_CAT = "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Mugs"
CASE_CAT = "Electronics > Communications > Telephony > Mobile Phone Accessories > Mobile Phone Cases"


def products(path):
    s = open(path, encoding="utf-8").read()
    for m in re.finditer(r'application/ld\+json">(.*?)</script>', s, re.S):
        try:
            d = json.loads(m.group(1))
        except ValueError:
            continue
        if isinstance(d, dict) and d.get("@type") == "Product":
            yield d


def row(d, sku, group, kind):
    offer = d["offers"][0] if isinstance(d["offers"], list) else d["offers"]
    sale = int(float(offer["price"]))
    imgs = d["image"] if isinstance(d["image"], list) else [d["image"]]
    return {
        "id": sku, "title": d["name"][:150], "description": d["description"],
        "availability": "in stock", "condition": "new",
        "price": f"{round(sale / 0.8)}.00 INR", "sale_price": f"{sale}.00 INR",
        "link": offer["url"], "image_link": imgs[0],
        "additional_image_link": ",".join(i for i in imgs[1:] if not i.endswith(".webp")),
        "brand": "NevervoidStore",
        "google_product_category": MUG_CAT if kind == "Mug" else CASE_CAT,
        "product_type": f"{group} > {kind}", "custom_label_0": group, "custom_label_1": kind,
    }


rows = []
for f in sorted(glob.glob("products/*.html")):
    for d in products(f):
        sku = d["sku"]
        kind = "Phone case" if sku.startswith("case") else "Mug"
        if "initial" in sku:
            group = "Christmas Initials"
        elif re.search(r"pet|dog|cat|treat|unwrap|custom", sku + d["name"].lower()):
            group = "Pets"
        elif kind == "Phone case":
            group = "Christmas Phone Cases"
        else:
            group = "Christmas"
        rows.append(row(d, sku, group, kind))

for f, sku in PERSONALISED:
    for d in products(f):
        rows.append(row(d, sku, "Personalised", "Mug"))

with open("catalog.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
    w.writeheader()
    w.writerows(rows)
print(f"catalog.csv: {len(rows)} products")
