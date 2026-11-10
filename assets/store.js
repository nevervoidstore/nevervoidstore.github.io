/* ============================================================
   NEVERVOID STORE SETTINGS — edit here, every page uses these.
   payLinks: paste a Razorpay Payment Link per product id ("" = order via DM)
   whatsapp: number with country code, digits only, e.g. "919876543210"
   ============================================================ */
const CONFIG = {
  instagram: "nevervoidstore",
  whatsapp: "919880000990",
  // Razorpay Payment Page (long form: https://pages.razorpay.com/pl_XXXX/view). Empty = WhatsApp ordering only.
  razorpayPage: "https://pages.razorpay.com/pl_Tw0kLnG202opHG/view",
  rzpPages: {"glass_phone_case":"https://rzp.io/rzp/glass-phone-case","ceramic_mug":"https://rzp.io/rzp/ceramic-mug","custom_pet_mug":"https://rzp.io/rzp/custom-mug","custom_phone_case":"https://rzp.io/rzp/custom-phone"},
  // Checkout backend (Google Apps Script). Set = pay in Razorpay's window on our page; empty = Payment Page above.
  api: "",
  // Field names on that page (label in lowercase, spaces as underscores)
  rzpFields: { product: "product", model: "phone_model", pincode: "pincode" },
  payLinks: {
    "mug-sleigh": "", "mug-tree": "", "mug-cocoa": "", "mug-ginger": "",
    "mug-dogmom": "", "mug-cat": "", "mug-paws": "", "mug-custom": "",
    "case-plaid": "", "case-pines": "", "case-cats": "", "case-paws": "", "case-custom": ""
  }
};

(function(){
  const dmUrl = "https://ig.me/m/" + CONFIG.instagram;
  const rupee = n => "₹" + Number(n).toLocaleString("en-IN");
  let tt;
  function toast(m){ const t=document.getElementById("toast"); if(!t) return; t.textContent=m; t.classList.add("show"); clearTimeout(tt); tt=setTimeout(()=>t.classList.remove("show"),2600); }
  function copy(text, msg){ try{ navigator.clipboard.writeText(text).then(()=>toast(msg),()=>toast(msg)); }catch(e){ toast(msg); } }
  function send(text){
    window.nvTrack("Lead", { content_name: "WhatsApp question" });
    if (CONFIG.whatsapp){ location.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(text); return; }
    copy(text, "Order details copied. Paste them in your Instagram DM");
    setTimeout(()=>{ location.href = dmUrl; }, 900);
  }
  window.nvToast = toast;
  // product view for ads reporting
  (function(){ const b = document.querySelector(".buybox [data-order]"); if (b && b.dataset.id) window.nvTrack("ViewContent", { content_ids: [b.dataset.id], content_type: "product", content_name: b.dataset.name, value: +b.dataset.price || 0, currency: "INR" }); })();
  const isKA = p => /^5[6-9]\d{4}$/.test(p);
  function showPinMsg(box, pin){
    const m = box.querySelector(".pin-msg"); if (!m) return;
    m.hidden = false; m.classList.remove("ok");
    const wa = CONFIG.whatsapp ? "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent("Hi Antony! Please let me know when you deliver to pincode " + pin + ".") : "";
    m.innerHTML = "Sorry, we deliver only within Karnataka for now (pincodes starting 56–59)." + (wa ? ' <a href="' + wa + '" target="_blank" rel="noopener">Tell me when you deliver to ' + pin + '</a>' : "");
  }
  document.querySelectorAll(".pin").forEach(el => el.addEventListener("input", () => {
    el.value = el.value.replace(/\D/g, "").slice(0, 6);
    const box = el.closest(".buybox"), m = box && box.querySelector(".pin-msg"); if (!m) return;
    if (el.value.length < 6) { m.hidden = true; return; }
    if (isKA(el.value)) { m.hidden = false; m.classList.add("ok"); m.textContent = "✓ We deliver to " + el.value + "."; }
    else showPinMsg(box, el.value);
  }));

  // ---------- on-site checkout sheet: collect delivery details, show the summary, then hand over to Razorpay to pay ----------
  const esc2 = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  let sheet = null;
  function rzpUrl(item) { return (CONFIG.rzpPages && CONFIG.rzpPages[item]) || CONFIG.razorpayPage; }
  function openCheckout(btn, model, pin) {
    const img = document.getElementById("pimg"), cv = document.getElementById("pcanvas");
    const pic = cv && !cv.hidden ? cv.toDataURL("image/jpeg", 0.8) : (img ? img.currentSrc || img.src : "");
    const name = btn.dataset.name.split(" | design ")[0].replace(/ (design [^)]*)$/, ""), price = +btn.dataset.price;
    const wasEl = document.querySelector(".pprice .was, .price .was"), was = wasEl ? wasEl.textContent : "";
    let saved = {}; try { saved = JSON.parse(localStorage.getItem("nv_addr") || "{}"); } catch (e) {}
    if (!sheet) { sheet = document.createElement("div"); sheet.className = "co-wrap"; document.body.appendChild(sheet); }
    sheet.innerHTML =
      '<div class="co-back" data-close></div><div class="co" role="dialog" aria-modal="true" aria-labelledby="co-t">' +
      '<button class="co-x" type="button" data-close aria-label="Close">×</button>' +
      '<h2 id="co-t">Checkout</h2>' +
      '<div class="co-sum">' + (pic ? '<img src="' + esc2(pic) + '" alt="">' : "") + '<div><b>' + esc2(name.split(" | ")[0]) + '</b>' + (name.split(" | ").length > 1 ? '<span class="co-chips">' + name.split(" | ").slice(1).map(x => '<i>' + esc2(x) + '</i>').join("") + '</span>' : "") + (model ? '<span>' + esc2(model) + '</span>' : "") +
      '<div class="co-price">' + (was ? '<s>' + esc2(was) + '</s> ' : "") + '<b>' + rupee(price) + '</b></div><span class="co-free">Made to order · delivered in about 5–7 days</span></div></div>' +
      '<form class="co-form" novalidate>' +
      '<label>Full name<input name="n" autocomplete="name" required value="' + esc2(saved.n || "") + '"></label>' +
      '<label>Mobile number<input name="p" type="tel" inputmode="numeric" maxlength="10" autocomplete="tel-national" placeholder="10-digit mobile" required value="' + esc2(saved.p || "") + '"></label>' +
      '<label>Email <small>(we send your order confirmation here)</small><input name="e" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required value="' + esc2(saved.e || "") + '"></label>' +
      '<label>House / flat, street, area<textarea name="a" rows="2" autocomplete="street-address" required>' + esc2(saved.a || "") + '</textarea></label>' +
      '<div class="co-row"><label>City<input name="c" autocomplete="address-level2" required value="' + esc2(saved.c || "") + '"></label>' +
      '<label>Pincode<input name="z" inputmode="numeric" maxlength="6" autocomplete="postal-code" required value="' + esc2(pin || saved.z || "") + '"></label></div>' +
      '<div class="co-err" hidden></div>' +
      '<button class="buy co-pay" type="submit"><svg class="co-ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg> Pay ' + rupee(price) + ' securely</button>' +
      '<div class="co-ways" aria-label="Ways to pay">' +
        '<span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 18h4" stroke="currentColor" stroke-width="1.8"/></svg>UPI apps</span>' +
        '<span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2 10h20" stroke="currentColor" stroke-width="1.8"/></svg>Cards</span>' +
        '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Netbanking</span>' +
        '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H3z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="16" cy="13.5" r="1.5"/></svg>Wallets</span>' +
      '</div>' +
      '<div class="co-trust"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>Secured by Razorpay</span>' +
        '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></svg>5–7 day delivery</span>' +
        '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Free replacement if damaged</span></div>' +
      '<p class="co-note">' + (CONFIG.api ? "The secure payment window opens right here." : "Next, Razorpay’s secure page opens with your details filled in. Tap Pay there.") + '</p>' +
      '</form></div>';
    requestAnimationFrame(() => sheet.classList.add("open")); document.body.classList.add("co-lock");
    sheet.querySelectorAll("[data-close]").forEach(x => x.addEventListener("click", closeCheckout));
    const form = sheet.querySelector("form"), err = sheet.querySelector(".co-err");
    (form.n.value ? form.a : form.n).focus({ preventScroll: true });
    form.addEventListener("submit", ev => {
      ev.preventDefault();
      const v = { e: form.e.value.trim(), n: form.n.value.trim(), p: form.p.value.replace(/\D/g, ""), a: form.a.value.trim().replace(/\s+/g, " "), c: form.c.value.trim(), z: form.z.value.trim() };
      const bad = !v.n ? [form.n, "Please enter your name"] : !/^[6-9]\d{9}$/.test(v.p) ? [form.p, "Please enter a valid 10-digit mobile number"] : !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v.e) ? [form.e, "Please enter your email so we can send your order confirmation"] :
        v.a.length < 8 ? [form.a, "Please enter your full delivery address"] : !v.c ? [form.c, "Please enter your city"] :
        !isKA(v.z) ? [form.z, "We deliver within Karnataka only for now (pincodes starting 56–59)"] : null;
      if (bad) { err.hidden = false; err.textContent = bad[1]; bad[0].focus(); return; }
      try { localStorage.setItem("nv_addr", JSON.stringify(v)); localStorage.setItem("nv_last", JSON.stringify({ name, model, price, pic: pic && pic.length < 200000 ? pic : "", at: Date.now() })); } catch (e) {}
      if (CONFIG.api) { payHere(btn, v, name, price, model, form, err); return; }
      const f = CONFIG.rzpFields, q = new URLSearchParams();
      q.set(btn.dataset.rzp, "1");
      q.set(f.product, btn.dataset.name + " | Ship to: " + v.n + ", " + v.a + ", " + v.c + " " + v.z + ", +91 " + v.p);
      if (model) q.set(f.model, model);
      q.set(f.pincode, v.z); q.set("email", v.e); q.set("phone", v.p); q.set("full_name", v.n); q.set("name", v.n); q.set("address", v.a); q.set("city", v.c);
      form.querySelector(".co-pay").textContent = "Opening secure payment…";
      window.nvTrack("InitiateCheckout", { value: price, currency: "INR", content_name: name, content_ids: [btn.dataset.id], content_type: "product" });
      location.href = rzpUrl(btn.dataset.rzp) + (rzpUrl(btn.dataset.rzp).includes("?") ? "&" : "?") + q.toString();
    });
  }
  // Razorpay Checkout on our page: the backend creates the order at the listed price, the payment is verified, the order is logged
  let rzpLoad = null;
  function loadRzp() { if (!rzpLoad) rzpLoad = new Promise((ok, no) => { const sc = document.createElement("script"); sc.src = "https://checkout.razorpay.com/v1/checkout.js"; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); }); return rzpLoad; }
  function api(body) { return fetch(CONFIG.api, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) }).then(r => r.json()); }
  function payHere(btn, v, name, price, model, form, err) {
    const payBtn = form.querySelector(".co-pay"), label = payBtn.textContent;
    const parts = btn.dataset.name.split(" | "), design = (parts.find(x => /^design /.test(x)) || "").replace(/^design /, "");
    const options = parts.slice(1).filter(x => !/^design /.test(x)).join(" | ");
    const reset = msg => { payBtn.disabled = false; payBtn.textContent = label; if (msg) { err.hidden = false; err.textContent = msg; } };
    payBtn.disabled = true; payBtn.textContent = "Opening secure payment…"; err.hidden = true;
    window.nvTrack("InitiateCheckout", { value: price, currency: "INR", content_name: name, content_ids: [btn.dataset.id], content_type: "product" });
    Promise.all([api({ a: "order", id: btn.dataset.id, product: parts[0], options: options, design: design ? "https://" + design.replace("https://", "").replace("http://", "") : "", model: model || "",
      customer: { name: v.n, phone: v.p, email: v.e, address: v.a, city: v.c, pincode: v.z } }), loadRzp()]).then(([o]) => {
      if (!o.ok) { reset(o.err || "Couldn’t start the payment. Please try again."); return; }
      const rz = new window.Razorpay({
        key: o.key, order_id: o.order_id, amount: o.amount, currency: "INR", name: "NevervoidStore", description: parts[0].slice(0, 120),
        image: location.origin + "/images/nv-logo.png", prefill: { name: v.n, contact: "+91" + v.p, email: v.e }, theme: { color: "#1f4d36" },
        modal: { ondismiss: () => reset("") },
        handler: r => {
          payBtn.textContent = "Confirming your payment…";
          api({ a: "verify", order_id: r.razorpay_order_id, payment_id: r.razorpay_payment_id, signature: r.razorpay_signature })
            .catch(() => ({})).then(() => { location.href = "/thank-you.html?paid=1"; });
        }
      });
      rz.on("payment.failed", e => reset("Payment didn’t go through" + (e && e.error && e.error.description ? ": " + e.error.description : "") + ". You can try again."));
      closeCheckout(); rz.open();
    }).catch(() => {
      // backend unreachable: fall back to the Razorpay Payment Page so nobody gets stuck
      if (CONFIG.razorpayPage) { const q = new URLSearchParams(); q.set(btn.dataset.rzp, "1"); q.set(CONFIG.rzpFields.product, btn.dataset.name + " | Ship to: " + v.n + ", " + v.a + ", " + v.c + " " + v.z + ", +91 " + v.p); q.set("phone", v.p); q.set("full_name", v.n); location.href = rzpUrl(btn.dataset.rzp) + (rzpUrl(btn.dataset.rzp).includes("?") ? "&" : "?") + q.toString(); }
      else reset("Couldn’t reach the payment service. Please try again in a minute.");
    });
  }
  function closeCheckout() { if (!sheet) return; sheet.classList.remove("open"); document.body.classList.remove("co-lock"); }
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeCheckout(); });
  // sticky buy bar on phones: price + Buy now, shown once the main button scrolls out of view
  const mainBuy = document.querySelector(".buybox [data-order]:not([data-nobar])");
  if (mainBuy && CONFIG.razorpayPage) {
    const bar = document.createElement("div"); bar.className = "buybar";
    const wasEl = document.querySelector(".pprice .was");
    bar.innerHTML = '<div class="bb-p">' + (wasEl ? '<s>' + esc2(wasEl.textContent) + '</s>' : "") + '<b>' + rupee(+mainBuy.dataset.price) + '</b><span>🔒 Secure checkout</span></div><button type="button" class="buy">Buy now</button>';
    document.body.appendChild(bar); document.body.classList.add("has-buybar");
    bar.querySelector("button").addEventListener("click", () => { mainBuy.closest(".buybox").scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => mainBuy.click(), 450); });
    new IntersectionObserver(es => bar.classList.toggle("show", !es[0].isIntersecting && es[0].boundingClientRect.top > 0)).observe(mainBuy);
  }
  document.querySelectorAll("[data-order]").forEach(btn => {
    const pay = CONFIG.payLinks[btn.dataset.id];
    if (pay) btn.textContent = "Pay securely · " + rupee(btn.dataset.price);
    if (CONFIG.razorpayPage && !pay) {
      btn.textContent = "Buy now · " + rupee(btn.dataset.price);
      const alt = document.createElement("button");
      alt.type = "button"; alt.className = "buy alt-wa"; alt.textContent = "Order on WhatsApp instead";
      alt.addEventListener("click", () => {
        const box = btn.closest(".buybox"), sel = box && box.querySelector(".model"), pinEl = box && box.querySelector(".pin");
        const model = sel ? sel.value : "", pin = pinEl ? pinEl.value.trim() : "";
        if (sel && !model){ toast("Please choose your phone model first"); sel.focus(); return; }
        if (pinEl && !/^\d{6}$/.test(pin)){ toast("Please enter your 6-digit delivery pincode"); pinEl.focus(); return; }
        if (pinEl && !isKA(pin)){ showPinMsg(box, pin); return; }
        send("Hi Antony! I'd like to order: " + btn.dataset.name + " (" + rupee(btn.dataset.price) + ")" + (model ? " for " + model : "") + ". Delivery pincode: " + pin + ".");
      });
      btn.after(alt);
      const note = document.createElement("div"); note.className = "pay-note";
      note.textContent = "🔒 Secure payment by Razorpay · UPI, cards & netbanking";
      alt.after(note);
    }
    btn.addEventListener("click", () => {
      const box = btn.closest(".buybox"), sel = box && box.querySelector(".model");
      const model = sel ? sel.value : "";
      if (sel && !model){ toast("Please choose your phone model first"); sel.focus(); return; }
      const pinEl = box && box.querySelector(".pin"), pin = pinEl ? pinEl.value.trim() : "";
      if (pinEl && !/^\d{6}$/.test(pin)){ toast("Please enter your 6-digit delivery pincode"); pinEl.focus(); return; }
      if (pinEl && !isKA(pin)){ showPinMsg(box, pin); return; }
      const text = "Hi Antony! I'd like to order: " + btn.dataset.name + " (" + rupee(btn.dataset.price) + ")" + (model ? " for " + model : "") + ". Delivery pincode: " + pin + ".";
      if (pay){ if (model) copy(text, "Opening checkout. Please DM us your model: " + model); location.href = pay; return; }
      if (CONFIG.razorpayPage && btn.dataset.rzp){ openCheckout(btn, model, pin); return; }
      if (false){
        const f = CONFIG.rzpFields, q = new URLSearchParams();
        q.set(btn.dataset.rzp, "1"); q.set(f.product, btn.dataset.name);
        if (model) q.set(f.model, model);
        q.set(f.pincode, pin);
        location.href = rzpUrl(btn.dataset.rzp) + (rzpUrl(btn.dataset.rzp).includes("?") ? "&" : "?") + q.toString();
        return;
      }
      send(text);
    });
  });
  document.querySelectorAll(".model").forEach(sel => sel.addEventListener("change", () => {
    // one clean preview for every model (per-model cut-outs were distracting); just confirm the fit in words
    const o = sel.selectedOptions[0], note = document.getElementById("shown-on");
    if (note && o && o.value) note.textContent = "Shown on an iPhone 16 Pro. We’ll print it to fit your " + o.value + ".";
  }));
  // live preview: the chosen design on the chosen phone model (frame + print-area mask + design)
  const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  let RECTS = null, previewSeq = 0;
  async function previewOn(cv, slug, label) {
    const seq = ++previewSeq, img = document.getElementById("pimg"), note = document.getElementById("shown-on");
    try {
      if (!RECTS) RECTS = await (await fetch("/images/cases/frames/rects.json")).json();
      const [art, frame, mask] = await Promise.all([loadImg(cv.dataset.art), loadImg("/images/cases/frames/" + slug + "-frame.webp"), loadImg("/images/cases/frames/" + slug + "-mask.png")]);
      if (seq !== previewSeq) return;
      const S = cv.width / 600, ctx = cv.getContext("2d"), [x0, y0, x1, y1] = RECTS[slug];
      ctx.clearRect(0, 0, cv.width, cv.height);
      const rw = (x1 - x0) * S, rh = (y1 - y0) * S, r = Math.max(rw / art.width, rh / art.height), dw = art.width * r, dh = art.height * r;
      ctx.drawImage(art, x0 * S + (rw - dw) / 2, y0 * S + (rh - dh) / 2, dw, dh);       // cover, centred, never stretched
      ctx.globalCompositeOperation = "destination-in"; ctx.drawImage(mask, 0, 0, cv.width, cv.height);
      ctx.globalCompositeOperation = "source-over"; ctx.drawImage(frame, 0, 0, cv.width, cv.height);
      cv.hidden = false; if (img) img.style.visibility = "hidden";
      if (note) note.textContent = "Showing on " + label + ".";
    } catch (e) { cv.hidden = true; if (img) img.style.visibility = ""; }
  }
  // share: native share sheet on phones, otherwise a small menu
  document.querySelectorAll(".share-btn").forEach(btn => {
    const menu = btn.nextElementSibling, url = btn.dataset.shareUrl, title = btn.dataset.shareTitle, text = btn.dataset.shareText;
    const e = encodeURIComponent;
    menu.querySelector('[data-net="wa"]').href = "https://wa.me/?text=" + e(text + " " + url);
    menu.querySelector('[data-net="fb"]').href = "https://www.facebook.com/sharer/sharer.php?u=" + e(url);
    menu.querySelector('[data-net="x"]').href = "https://twitter.com/intent/tweet?text=" + e(text) + "&url=" + e(url);
    menu.querySelector('[data-net="copy"]').addEventListener("click", ev => {
      const b = ev.currentTarget, done = () => { b.textContent = "Link copied"; setTimeout(() => { b.textContent = "Copy link"; menu.hidden = true; }, 1400); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, () => prompt("Copy this link:", url)); else prompt("Copy this link:", url);
    });
    btn.addEventListener("click", async () => {
      if (navigator.share && matchMedia("(pointer:coarse)").matches) { try { await navigator.share({ title, text, url }); } catch (err) {} return; }
      menu.hidden = !menu.hidden;
    });
    document.addEventListener("click", ev => { if (!btn.parentElement.contains(ev.target)) menu.hidden = true; });
  });
  // discourage saving design images (screenshots can't be prevented; public images are watermarked and screen-sized)
  document.addEventListener("contextmenu", ev => { if (ev.target.closest(".gallery, .stage, .flat-wrap, .views, .m3d")) ev.preventDefault(); });
  document.addEventListener("dragstart", ev => { if (ev.target.closest && ev.target.closest(".gallery, .stage, .flat-wrap, .views")) ev.preventDefault(); });
  // 3D preview only on capable devices: WebGL2, 4+ cores, 4GB+ memory (where reported), no data saver or slow network
  (function(){
    const b = document.querySelector(".views .v360"); if (!b) return;
    let ok = false;
    try {
      const c = document.createElement("canvas"), gl = c.getContext("webgl2");
      ok = !!gl; if (gl) { const x = gl.getExtension("WEBGL_lose_context"); if (x) x.loseContext(); }
    } catch (e) { ok = false; }
    const n = navigator, cn = n.connection || {};
    if ((n.hardwareConcurrency || 4) < 4) ok = false;
    if (n.deviceMemory && n.deviceMemory < 4) ok = false;
    if (cn.saveData || /(^|-)(2g|3g)$/.test(cn.effectiveType || "")) ok = false;
    if (!ok) b.remove();
  })();
  document.querySelectorAll(".views .view").forEach(v => v.addEventListener("click", async () => {
    const img = document.getElementById("pimg"), box = document.getElementById("m3d");
    v.parentElement.querySelectorAll(".view").forEach(x => x.classList.toggle("on", x === v));
    if (v.dataset.spin && box) {
      box.hidden = false; if (img) img.style.visibility = "hidden";
      if (box._m) box._m.wake();
      else { try { const mod = await import("/assets/mug3d.js?v=f305fb59"); const lab = box.querySelector(".m3d-side"), names = ["Faces you", "Centre · opposite the handle", "Faces the person opposite"]; box._m = mod.mount(box, box.dataset.wrap, +box.dataset.start, k => { lab.textContent = names[k]; }); } catch (e) { box.hidden = true; if (img) img.style.visibility = ""; } }
      return;
    }
    if (box) box.hidden = true;
    if (img) { img.style.visibility = ""; img.src = v.dataset.src; }
  }));
  document.querySelectorAll("[data-ask]").forEach(b => b.addEventListener("click", () =>
    send("Hi Antony! I have a question about the " + b.dataset.name + ".")));

  // trust line switches once Razorpay links exist
  if (CONFIG.razorpayPage || Object.values(CONFIG.payLinks).some(Boolean)) document.querySelectorAll("[data-paytrust]").forEach(el => {
    if (el.tagName === "LI") el.textContent = "Secure checkout via Razorpay: UPI, cards & netbanking";
    else el.innerHTML = "<b>Secure checkout</b>UPI, cards &amp; netbanking via Razorpay";
  });

  // catalogue filters (index page)
  const filters = document.getElementById("filters");
  if (filters){
    const apply = f => {
      document.querySelectorAll("#filters button").forEach(x => x.classList.toggle("on", x.dataset.f === f));
      document.querySelectorAll("#grid .card").forEach(c => { c.style.display = (f==="all" || c.dataset.cat.split(" ").includes(f) || c.dataset.type===f) ? "" : "none"; });
    };
    filters.addEventListener("click", e => { const b = e.target.closest("button"); if (b){ apply(b.dataset.f); history.replaceState(null,"", b.dataset.f==="all" ? location.pathname : "#" + b.dataset.f); }});
    const h = location.hash.slice(1); if (["christmas","pets","mug","case"].includes(h)) apply(h);
  }
})();
