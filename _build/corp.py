import json,re
B="https://nevervoidstore.com"
s=open('src/corporate-src.html').read()
title="Corporate Christmas Gifts Bengaluru & Karnataka | Logo & Pet Mugs from ₹319 | NevervoidStore"
desc="Custom corporate gifts for teams in Bengaluru and across Karnataka: logo mugs, team pet portrait mugs and glass phone cases from ₹319. Sample first, preview before print, 50% advance."
faq=[("Can each employee get a different design?","Yes. With team pet mugs, every person gets their own pet and name. We collect the photos through a simple form, so you don't have to."),
("Can you ship to remote employees?","Yes, anywhere in Karnataka. Send us a list of addresses and we'll ship to each person directly. Shipping is quoted per address. We don't deliver outside Karnataka yet."),
("What if a mug arrives broken?","Send a photo within 48 hours of delivery and we'll replace that piece free."),
("Do you provide an invoice?","Yes, every order comes with a bill for your records. We’re a new business and not GST-registered yet, so our bills don’t include GST and can’t be used to claim input tax credit. Ask us if your finance team needs a GST invoice."),
("What is the minimum order for corporate gifts?","The minimum order is 25 pieces. Prices start at ₹379 per mug for 25–49 pieces and drop to ₹319 per mug for 100 or more.")]
ld=[{"@context":"https://schema.org","@type":"Service","name":"Corporate Christmas gifting","serviceType":"Custom printed corporate gifts","areaServed":{"@type":"State","name":"Karnataka"},
 "provider":{"@type":"Organization","name":"NevervoidStore","url":B+"/","founder":{"@type":"Person","name":"Antony Pratap"},"parentOrganization":{"@type":"Organization","name":"Nevervoid Photography"},"sameAs":["https://instagram.com/nevervoidstore"]},
 "offers":{"@type":"AggregateOffer","priceCurrency":"INR","lowPrice":"319","highPrice":"549","offerCount":"3"}},
 {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq]},
 {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Shop","item":B+"/"},{"@type":"ListItem","position":2,"name":"Corporate gifting","item":B+"/corporate.html"}]}]
esc=lambda t:t.replace('&','&amp;').replace('"','&quot;')
headextra=f'''<link rel="stylesheet" href="assets/festive.css">
<script defer src="assets/festive.js"></script>
<script defer src="assets/chat.js"></script>
<link rel="canonical" href="{B}/corporate.html">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#1f4d36">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Nevervoid Store">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{B}/corporate.html">
<meta property="og:image" content="{B}/images/og-corporate.jpg">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{B}/images/og-corporate.jpg">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%231f4d36'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-family='Georgia' font-weight='700' font-size='18' fill='%23fbf6ec'%3EN%3C/text%3E%3C/svg%3E">
''' + "\n".join(f'<script type="application/ld+json">{json.dumps(j,ensure_ascii=False)}</script>' for j in ld)
reps=[
 ('<html lang="en">','<html lang="en-IN">'),
 (re.search(r'<title>.*?</title>',s).group(0), f'<title>{title}</title>'),
 (re.search(r'<meta name="description"[^>]*>',s).group(0), f'<meta name="description" content="{esc(desc)}">\n'+headextra),
 ('Corporate gifting · Christmas 2026','Corporate Christmas gifts · Karnataka 2026'),
 ('<details><summary>Do you provide an invoice?</summary><p>Yes, every order comes with a bill for your records. We’re a new business and not GST-registered yet, so our bills don’t include GST and can’t be used to claim input tax credit. Ask us if your finance team needs a GST invoice.</p></details>',
  '<details><summary>Do you provide an invoice?</summary><p>Yes, every order comes with a bill for your records. We’re a new business and not GST-registered yet, so our bills don’t include GST and can’t be used to claim input tax credit. Ask us if your finance team needs a GST invoice.</p></details>\n          <details><summary>What is the minimum order for corporate gifts?</summary><p>The minimum order is 25 pieces. Prices start at ₹379 per mug for 25–49 pieces and drop to ₹319 per mug for 100 or more.</p></details>'),
 ('<footer>\n  <span style=','<footer>\n  <p style="max-width:720px;margin:0 auto 14px">Nevervoid Store makes custom corporate gifts for teams in Bengaluru and across Karnataka: logo mugs for employees and clients, team mugs with each person\'s own pet, festive Christmas mugs and printed glass phone cases. Bulk pricing from ₹319 a piece, with a sample before you commit.</p>\n  <span style='),
 ('<a class="hide-sm" href="index.html">Shop</a>','<a class="hide-sm" href="index.html">Shop</a>\n      <a class="hide-sm" href="blog/index.html">Blog</a>'),
 ('<a href="index.html">Shop individual gifts</a>','<a href="index.html">Shop individual gifts</a> · <a href="blog/corporate-christmas-gifting-guide-india.html">Corporate gifting guide</a><br><span style="display:inline-block;margin-top:10px"><a style="font-weight:400" href="policies/about.html">About us</a> · <a style="font-weight:400" href="policies/contact.html">Contact</a> · <a style="font-weight:400" href="policies/shipping.html">Shipping</a> · <a style="font-weight:400" href="policies/returns.html">Returns &amp; refunds</a> · <a style="font-weight:400" href="policies/privacy.html">Privacy</a> · <a style="font-weight:400" href="policies/terms.html">Terms</a></span>'),
]
for a,b in reps:
  assert a in s, a[:60]; s=s.replace(a,b,1)
import re as _re
_wa=_re.search(r'whatsapp: "([0-9]*)"', open('src/policies.js').read()).group(1)
s=s.replace('whatsapp: "",            // e.g.', 'whatsapp: "%s",            // e.g.' % _wa)
open('site/corporate.html','w').write(s)
print("ok")
