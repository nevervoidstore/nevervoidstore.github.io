const {chromium}=require('playwright');const fs=require('fs');
const items=JSON.parse(fs.readFileSync('src/images.json','utf8'));
const by=s=>{const i=items.find(i=>i.slug===s);return i?i.art:'';};
const uri=f=>`<img src="data:image/webp;base64,${fs.readFileSync(f).toString('base64')}" style="width:100%;display:block">`;
const fonts=`<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,500&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:1000}});
for(const it of items){
  if(it.photo){ const b64=fs.readFileSync(it.photo).toString('base64'); it.art=`<img src="data:image/webp;base64,${b64}" style="height:820px">`; }
  const bg=it.cat==='christmas'?'#f1ebdf':'#e9efe4';
  if(it.photo){ await p.setContent(`<body style="margin:0;width:1000px;height:1000px;background:#fff"><img src="data:image/webp;base64,${fs.readFileSync(it.photo).toString('base64')}" style="width:1000px;height:1000px;display:block"></body>`); await p.waitForTimeout(150); await p.screenshot({path:`site/images/products/${it.slug}.jpg`,type:'jpeg',quality:88}); continue; }
  await p.setContent(`<body style="margin:0;width:1000px;height:1000px;background:radial-gradient(circle at 50% 40%,#fff 0,${bg} 75%);display:flex;align-items:center;justify-content:center">${fonts}<div style="height:800px;display:flex;align-items:center;justify-content:center">${it.art.replace('<svg ','<svg style="height:800px;width:auto" ')}</div></body>`);
  await p.waitForTimeout(250);
  await p.screenshot({path:`site/images/products/${it.slug}.jpg`,type:'jpeg',quality:85});
}
// corporate logo mug from built page
const c=await b.newPage({viewport:{width:1200,height:900}});
await c.goto('file://'+process.cwd()+'/site/corporate.html');await c.waitForTimeout(500);
const logoMug=await c.$eval('#heroMug',e=>e.innerHTML);
const og=async(file,left,right)=>{await p.setViewportSize({width:1200,height:630});
 await p.setContent(`<body style="margin:0;width:1200px;height:630px;background:#fbf6ec;font-family:'DM Sans';display:flex;align-items:center">${fonts}
 <div style="width:600px;padding:0 0 0 70px">${left}</div><div style="width:560px;height:560px;border-radius:32px;background:#fff;position:relative;margin-right:40px">${right}</div></body>`);
 await p.waitForTimeout(600);await p.screenshot({path:file,type:'jpeg',quality:88});};
const brand=`<div style="font-family:Fraunces;font-weight:700;font-size:30px;color:#1c2420">NevervoidStore</div>`;
await og('site/images/og-home.jpg',`${brand}<div style="font-family:Fraunces;font-weight:700;font-size:60px;line-height:1.05;color:#1c2420;margin:22px 0 18px">Christmas &amp; pet mugs, <i style="font-weight:500;color:#1f4d36">made to order</i></div><div style="font-size:24px;color:#5d6862">Mugs &amp; glass phone cases · delivered across Karnataka</div>`,
 `<div style="position:absolute;width:62%;left:3%;top:20%">${uri('site/images/mugs/dear-santa-it-wasnt-me-mug-b.webp')}</div><div style="position:absolute;width:33%;right:7%;top:9%;transform:rotate(6deg)">${uri('site/images/cases/knitted-christmas-puppies/iphone-16-pro.webp')}</div>`);
await og('site/images/og-corporate.jpg',`${brand}<div style="font-family:Fraunces;font-weight:700;font-size:56px;line-height:1.05;color:#1c2420;margin:22px 0 18px">Corporate Christmas gifts your team <i style="font-weight:500;color:#1f4d36">keeps</i></div><div style="font-size:24px;color:#5d6862">Logo &amp; team pet mugs · from ₹319 · sample first</div>`,
 `<div style="position:absolute;width:62%;left:3%;top:20%">${logoMug}</div><div style="position:absolute;width:33%;right:7%;top:9%;transform:rotate(6deg)">${uri('site/images/cases/knitted-christmas-puppies/iphone-16-pro.webp')}</div>`);

// share cards (1200x630) for link previews: product photo + name + price
fs.mkdirSync('site/images/share',{recursive:true});
const sp=await b.newPage({viewport:{width:1200,height:630}});
const rup=n=>'₹'+n.toLocaleString('en-IN');
const escH=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
for(const it of items){
  const img=fs.readFileSync(`site/images/products/${it.slug}.jpg`).toString('base64');
  const price=it.sale?`<b>${rup(it.sale)}</b><s>${rup(it.price)}</s>`:`<b>${rup(it.price)}</b>`;
  await sp.setContent(`<html><head>${fonts}<style>
  body{margin:0;width:1200px;height:630px;display:flex;background:#fbf6ec;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#1c2420}
  .pic{width:630px;height:630px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .pic img{width:630px;height:630px;object-fit:contain}
  .txt{flex:1;padding:56px 54px 48px;display:flex;flex-direction:column}
  .brand{font-family:Fraunces,Georgia,'DejaVu Serif',serif;font-weight:700;font-size:30px;color:#1f4d36}
  .type{margin-top:auto;font-size:20px;letter-spacing:.08em;text-transform:uppercase;color:#7a6f60}
  h1{font-family:Fraunces,Georgia,'DejaVu Serif',serif;font-weight:600;font-size:${it.name.length>30?44:52}px;line-height:1.08;margin:10px 0 18px}
  .price{display:flex;align-items:baseline;gap:14px}.price b{font-size:46px;color:#a8332f}.price s{font-size:26px;color:#8b8478}
  .sale{display:inline-block;align-self:flex-start;margin-top:16px;background:#a8332f;color:#fff;font-weight:700;font-size:20px;padding:8px 16px;border-radius:99px}
  .foot{margin-top:auto;font-size:19px;color:#4c5a52}</style></head><body>
  <div class="pic"><img src="data:image/jpeg;base64,${img}"></div>
  <div class="txt"><div class="brand">NevervoidStore</div><div class="type">${escH(it.type)}</div><h1>${escH(it.name)}</h1><div class="price">${price}</div>${it.sale?`<div class="sale">Christmas Sale · ${it.pct}% off</div>`:''}<div class="foot">Made to order · Delivered across Karnataka · nevervoidstore.com</div></div></body></html>`);
  await sp.waitForTimeout(120);
  await sp.screenshot({path:`site/images/share/${it.slug}.jpg`,type:'jpeg',quality:86});
}
await b.close();})();
