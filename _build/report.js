/* "Report an issue" sheet. Opens from any [data-report] link or a #report link.
   Sends the report to the store's WhatsApp (src/policies.js CONTACT.whatsapp) with the page and device attached. */
(function(){
  var NUM = "__WA__";
  if (!NUM) return;
  var TYPES = [
    ["page", "🧩", "A page or button isn't working"],
    ["design", "🎨", "Design or preview looks wrong"],
    ["pay", "💳", "Payment problem"],
    ["order", "📦", "Order or delivery"],
    ["other", "💬", "Something else"]
  ];
  var css = document.createElement("style");
  css.textContent =
    ".rp-types{display:grid;gap:8px;margin:0 0 14px;border:0;padding:0}" +
    ".rp-types legend{font-size:13px;font-weight:600;margin:0 0 8px;padding:0}" +
    ".rp-types label{display:flex;align-items:center;gap:10px;margin:0;padding:11px 12px;border:1px solid #d8d0c2;border-radius:12px;font-weight:500;cursor:pointer;background:#fff}" +
    ".rp-types input{position:absolute;opacity:0;width:1px;height:1px}" +
    ".rp-types label:has(input:checked){border-color:var(--green,#2f6b4f);background:#eef6f1;box-shadow:0 0 0 1px var(--green,#2f6b4f)}" +
    ".rp-types label:has(input:focus-visible){outline:2px solid var(--green,#2f6b4f)}" +
    ".rp-ic{font-size:18px;line-height:1}" +
    ".rp-sub{color:var(--muted,#66706a);font-size:14px;margin:-4px 0 14px}" +
    ".rp-done{text-align:center;padding:10px 0 4px}.rp-done b{display:block;font-size:20px;margin:6px 0}" +
    ".foot-report{background:none;border:0;padding:0;font:inherit;color:inherit;text-decoration:underline;cursor:pointer}";
  document.head.appendChild(css);

  var wrap = null;
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function device(){
    var u = navigator.userAgent, os = /iPhone|iPad/.test(u) ? "iOS" : /Android/.test(u) ? "Android" : /Mac/.test(u) ? "Mac" : /Windows/.test(u) ? "Windows" : "Other";
    var br = /Instagram/.test(u) ? "Instagram app" : /FBAN|FBAV/.test(u) ? "Facebook app" : /CriOS|Chrome/.test(u) && !/Edg/.test(u) ? "Chrome" : /Edg/.test(u) ? "Edge" : /Firefox|FxiOS/.test(u) ? "Firefox" : /Safari/.test(u) ? "Safari" : "Browser";
    return os + ", " + br + ", " + window.innerWidth + "×" + window.innerHeight;
  }
  function close(){
    if (!wrap) return;
    wrap.classList.remove("open"); document.body.classList.remove("co-lock");
    if (location.hash === "#report") history.replaceState(null, "", location.pathname + location.search);
  }
  function open(){
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "co-wrap rp-wrap"; document.body.appendChild(wrap); }
    var where = (document.querySelector("h1") || {}).textContent || document.title;
    wrap.innerHTML =
      '<div class="co-back" data-rp-close></div><div class="co" role="dialog" aria-modal="true" aria-labelledby="rp-t">' +
      '<button class="co-x" type="button" data-rp-close aria-label="Close">×</button>' +
      '<h2 id="rp-t">Report an issue</h2>' +
      '<p class="rp-sub">Something not working? Tell us and we\'ll fix it. We\'ll get back to you within a few hours.</p>' +
      '<form class="co-form" novalidate>' +
      '<fieldset class="rp-types"><legend>What went wrong?</legend>' +
      TYPES.map(function(t){ return '<label><input type="radio" name="t" value="' + t[0] + '"><span class="rp-ic" aria-hidden="true">' + t[1] + '</span>' + esc(t[2]) + '</label>'; }).join("") +
      '</fieldset>' +
      '<label>Tell us what happened<textarea name="d" rows="3" maxlength="600" placeholder="e.g. The Pay button did nothing after I filled my address"></textarea></label>' +
      '<div class="co-err" hidden></div>' +
      '<button class="buy co-pay" type="submit">Send report on WhatsApp</button>' +
      '<p class="co-note">We\'ll add this page and your device type, so we can see the problem. Nothing else.</p>' +
      '</form></div>';
    requestAnimationFrame(function(){ wrap.classList.add("open"); });
    document.body.classList.add("co-lock");
    wrap.querySelectorAll("[data-rp-close]").forEach(function(x){ x.addEventListener("click", close); });
    var form = wrap.querySelector("form"), err = wrap.querySelector(".co-err");
    form.addEventListener("input", function(){ err.hidden = true; });
    form.addEventListener("change", function(){ err.hidden = true; });
    form.addEventListener("submit", function(ev){
      ev.preventDefault();
      var t = form.querySelector("input[name=t]:checked"), d = form.d.value.trim().replace(/\s+/g, " ");
      if (!t) { err.hidden = false; err.textContent = "Please pick what went wrong"; form.querySelector("input[name=t]").focus(); return; }
      if (d.length < 5) { err.hidden = false; err.textContent = "Please tell us a little about what happened"; form.d.focus(); return; }
      var label = TYPES.filter(function(x){ return x[0] === t.value; })[0][2];
      var msg = "Hi Antony, I'd like to report an issue on NevervoidStore.\n\n" +
        "Problem: " + label + "\n" +
        "What happened: " + d + "\n\n" +
        "Page: " + where.trim() + " (" + location.origin + location.pathname + ")\n" +
        "Device: " + device();
      if (window.nvTrack) try { window.nvTrack("Contact", { content_name: "report_" + t.value }); } catch (e) {}
      window.open("https://wa.me/" + NUM + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
      wrap.querySelector(".co").innerHTML =
        '<button class="co-x" type="button" data-rp-close aria-label="Close">×</button>' +
        '<div class="rp-done"><span style="font-size:40px" aria-hidden="true">🙏</span><b>Thanks for telling us</b>' +
        '<p class="rp-sub" style="margin:0 0 16px">WhatsApp should have opened with your report. Tap Send there and we\'ll take a look.</p>' +
        '<button class="buy" type="button" data-rp-close style="width:100%">Back to the store</button></div>';
      wrap.querySelectorAll("[data-rp-close]").forEach(function(x){ x.addEventListener("click", close); });
    });
  }
  document.addEventListener("click", function(e){
    var a = e.target.closest && e.target.closest('[data-report], a[href$="#report"]');
    if (!a) return;
    e.preventDefault(); open();
  });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") close(); });
  if (location.hash === "#report") open();
})();
