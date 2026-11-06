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
    if (CONFIG.whatsapp){ location.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(text); return; }
    copy(text, "Order details copied. Paste them in your Instagram DM");
    setTimeout(()=>{ location.href = dmUrl; }, 900);
  }
  window.nvToast = toast;
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
      if (CONFIG.razorpayPage && btn.dataset.rzp){
        const f = CONFIG.rzpFields, q = new URLSearchParams();
        q.set(btn.dataset.rzp, "1"); q.set(f.product, btn.dataset.name);
        if (model) q.set(f.model, model);
        q.set(f.pincode, pin);
        location.href = CONFIG.razorpayPage + (CONFIG.razorpayPage.includes("?") ? "&" : "?") + q.toString();
        return;
      }
      send(text);
    });
  });
  document.querySelectorAll(".model").forEach(sel => sel.addEventListener("change", () => {
    const o = sel.selectedOptions[0], img = document.getElementById("pimg");
    if (img && o && o.dataset.img) { img.src = o.dataset.img; img.alt = img.alt.split(" — ")[0] + " — " + o.value; }
  }));
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
      else { try { const mod = await import("/assets/mug3d.js?v=2831964d"); const lab = box.querySelector(".m3d-side"), names = ["Faces you", "Centre · opposite the handle", "Faces the person opposite"]; box._m = mod.mount(box, box.dataset.wrap, +box.dataset.start, k => { lab.textContent = names[k]; }); } catch (e) { box.hidden = true; if (img) img.style.visibility = ""; } }
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
