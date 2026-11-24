/* NevervoidStore guide: walks the shopper through a page one step at a time.
   A soft ring marks the current step and a small card says what to do. Each finished step gets a ticked check,
   then the guide moves on; at the end it ticks and fades away. The × closes it for good (remembered in this browser).
   Steps are found from the page itself, so every page type gets the right steps. */
(function () {
  try { if (localStorage.getItem("nv_guide_off") === "1") return; } catch (e) {}
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function vis(el) { return el && !el.closest("[hidden]") && el.offsetParent !== null; }

  // ---------- which steps does this page have? ----------
  function pinStep(box) {
    var pin = box && $(".pin", box); if (!pin) return null;
    return { el: pin.closest("label") || pin, focus: pin, text: "Type your delivery pincode",
      done: function (fire) { var f = function () { var m = $(".pin-msg", box); if (m && m.classList.contains("ok") && !m.hidden) fire(); }; pin.addEventListener("input", function () { setTimeout(f, 30); }); } };
  }
  function buyStep(box) {
    var b = box && $("[data-order]", box); if (!b) return null;
    return { el: b, text: "All set! Tap " + (b.textContent.split("·")[0].trim() || "Buy now"), last: true,
      done: function (fire) { b.addEventListener("click", fire); } };
  }
  function steps() {
    var out = [], box;
    var pm = $("[data-petmaker]");
    if (pm) {   // pet mug / case maker
      box = $(".buybox");
      out.push({ el: pm, text: "Upload your pet's photo", done: function (fire) { document.addEventListener("nv:pm-photo", fire); } });
      out.push({ el: function () { return $(".pm input[type=text]"); }, text: "Add their name, or skip", optional: true,
        done: function (fire) { document.addEventListener("change", function (e) { if (e.target.matches(".pm input[type=text]") && e.target.value.trim()) fire(); }); } });
      out.push(pinStep(box)); out.push(buyStep(box));
      return out.filter(Boolean);
    }
    var form = $(".cm-form");
    if (form) {   // design-your-own pages: each visible step in the form, in order
      box = $(".buybox", form) || $(".buybox");
      [].slice.call(form.querySelectorAll(".cm-step")).forEach(function (st) {
        if (!vis(st) || st.closest(".buybox")) return;
        var t = ($("b", st) || st).textContent.replace(/^\s*\d+\.\s*/, "").trim();
        var numbered = /^\s*\d+\./.test(($("b", st) || st).textContent);
        if (!t) return;
        out.push({ el: st, text: t, optional: !numbered,
          done: function (fire) { var go = function (e) { if (e.type !== "input" || (e.target.value || "").trim().length > 1) fire(); }; st.addEventListener("input", go); st.addEventListener("change", go); st.addEventListener("click", function (e) { if (e.target.closest("button,[role=radio],input[type=radio],label.cm-theme")) fire(); });
            var sib = st.nextElementSibling; if (sib && sib.matches(".cm-chips,.sw-sugg")) sib.addEventListener("click", function (e) { if (e.target.closest("button")) fire(); }); } });
      });
      out.push(pinStep(box)); out.push(buyStep(box));
      return out.filter(Boolean);
    }
    box = $(".buybox");
    if (box) {   // ready-made product
      var sel = $("select.model", box);
      if (sel) out.push({ el: sel.closest("label") || sel, focus: sel, text: "Choose your phone", done: function (fire) { sel.addEventListener("change", function () { if (sel.value) fire(); }); } });
      out.push(pinStep(box)); out.push(buyStep(box));
      return out.filter(Boolean);
    }
    var pz = $(".pz");
    if (pz) return [{ el: pz, text: "Tap one to make it personal, or scroll for ready-made designs", last: true, done: function (fire) { pz.addEventListener("click", fire); } }];
    return [];
  }

  // ---------- UI ----------
  var css = document.createElement("style");
  css.textContent =
    ".gd-ring{position:relative;z-index:1;border-radius:14px;box-shadow:0 0 0 3px rgba(47,93,70,.55),0 0 0 8px rgba(47,93,70,.12);transition:box-shadow .3s}" +
    (reduce ? "" : ".gd-ring{animation:gdPulse 2.2s ease-in-out infinite}@keyframes gdPulse{0%,100%{box-shadow:0 0 0 3px rgba(47,93,70,.5),0 0 0 7px rgba(47,93,70,.10)}50%{box-shadow:0 0 0 3px rgba(47,93,70,.7),0 0 0 11px rgba(47,93,70,.05)}}") +
    ".gd{position:fixed;left:50%;bottom:18px;transform:translate(-50%,12px);opacity:0;z-index:60;display:flex;align-items:center;gap:12px;max-width:min(440px,calc(100vw - 24px));width:max-content;" +
    "background:#1f3a2c;color:#fff;border-radius:16px;padding:11px 12px 11px 14px;box-shadow:0 10px 30px rgba(0,0,0,.22);font-size:14.5px;line-height:1.35;transition:opacity .35s,transform .35s}" +
    ".gd.on{opacity:1;transform:translate(-50%,0)}" +
    ".gd-n{flex:none;font-size:12px;font-weight:700;background:rgba(255,255,255,.14);border-radius:999px;padding:3px 8px;letter-spacing:.02em}" +
    ".gd-t{font-weight:600}" +
    ".gd-skip{flex:none;background:none;border:1px solid rgba(255,255,255,.35);color:#fff;border-radius:999px;padding:4px 10px;font:inherit;font-size:12.5px;cursor:pointer}" +
    ".gd-x{flex:none;width:28px;height:28px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;font-size:18px;line-height:28px;cursor:pointer;padding:0}" +
    ".gd-x:hover,.gd-skip:hover{background:rgba(255,255,255,.22)}" +
    ".gd-ok{flex:none;width:26px;height:26px}.gd-ok circle{fill:#3aa66a}.gd-ok path{fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:24;stroke-dashoffset:" + (reduce ? 0 : 24) + "}" +
    ".gd-ok.go path{transition:stroke-dashoffset .45s ease .05s;stroke-dashoffset:0}" +
    "@media (max-width:640px){.gd{bottom:84px;font-size:14px}}";
  document.head.appendChild(css);

  var list = [], i = 0, card = null, ringEl = null, closed = false;
  function el(s) { return typeof s.el === "function" ? s.el() : s.el; }
  function ring(on) { if (ringEl) ringEl.classList.remove("gd-ring"); ringEl = on || null; if (ringEl) ringEl.classList.add("gd-ring"); }
  function close(forever) {
    closed = true; ring(null); window.nvGuideOn = false;
    if (card) { card.classList.remove("on"); var c = card; setTimeout(function () { c.remove(); }, 400); }
    if (forever) try { localStorage.setItem("nv_guide_off", "1"); } catch (e) {}
  }
  function render(html) {
    if (!card) {
      card = document.createElement("div"); card.className = "gd"; card.setAttribute("role", "status"); card.setAttribute("aria-live", "polite");
      document.body.appendChild(card); requestAnimationFrame(function () { card.classList.add("on"); });
      card.addEventListener("click", function (e) {
        if (e.target.closest(".gd-x")) close(true);
        else if (e.target.closest(".gd-skip")) next();
      });
    }
    card.innerHTML = html;
  }
  function show() {
    if (closed) return;
    while (i < list.length && (list[i]._done || (list[i].optional && !vis(el(list[i]))))) i++;   // skip finished steps and hidden optional ones
    if (i >= list.length) { finish(); return; }
    var s = list[i], t = el(s), total = list.length;
    if (!vis(t)) { ring(null); clearTimeout(show.w); show.w = setTimeout(show, 700); }   // not on screen yet: wait for it
    else ring(t);
    render('<span class="gd-n">' + (i + 1) + "/" + total + '</span><span class="gd-t">' + s.text + "</span>" +
      (s.optional ? '<button type="button" class="gd-skip">Skip</button>' : "") +
      '<button type="button" class="gd-x" aria-label="Close the guide">×</button>');
    if (vis(t) && show.last !== t) {   // bring a new step into view once
      show.last = t; var r = t.getBoundingClientRect();
      if (r.top < 70 || r.bottom > innerHeight - 120) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    }
  }
  function tick(msg, then) {
    render('<svg class="gd-ok" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="13"/><path d="M7.5 13.5l3.6 3.6 7.4-7.6"/></svg><span class="gd-t">' + msg + "</span>");
    var ok = $(".gd-ok", card); requestAnimationFrame(function () { requestAnimationFrame(function () { ok.classList.add("go"); }); });
    setTimeout(then, reduce ? 500 : 900);
  }
  function next() { i++; show(); }
  function finish() { ring(null); tick("You're all set", function () { close(false); }); }
  function arm(s, k) {
    s.done(function () {
      if (s._done || closed) return; s._done = true;
      // a later step finished first: skip over optional steps before it, otherwise just remember it
      if (k > i) { for (var j = i; j < k; j++) if (!list[j].optional && !list[j]._done) return; i = k; }
      if (k !== i) return;
      ring(null);
      if (s.last) { tick("Done!", function () { close(false); }); return; }
      tick("Done", next);
    });
  }
  function start() {
    list = steps(); if (!list.length) return;
    window.nvGuideOn = true;
    list.forEach(arm);
    setTimeout(show, 900);   // let the page settle first
  }
  if (document.readyState === "complete") start(); else addEventListener("load", start);
})();
