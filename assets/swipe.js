// Swipe (or tap the arrows) to move to the next / previous design on product pages.
// Keeps the shopper's phone model and mug colour as they browse, and shows a one-time hint.
(function () {
  "use strict";
  var g = document.querySelector("[data-swipe]"); if (!g) return;
  var prev = g.dataset.prev, next = g.dataset.next, kind = g.dataset.kind || "designs";
  if (getComputedStyle(g).position === "static") g.style.position = "relative";

  // labelled buttons BELOW the picture, so they read as "another design", not "more photos of this one"
  var one = kind.replace(/s$/, "").replace(/^case /, "");
  g.insertAdjacentHTML("afterend", '<nav class="design-nav" aria-label="Browse ' + kind + '"><button type="button" class="swipe-nav prev">‹ Previous<span class="wide"> ' + one + '</span></button><span class="swipe-pos">' + g.dataset.pos + " of " + g.dataset.n + " " + kind + '</span><button type="button" class="swipe-nav next">Next<span class="wide"> ' + one + '</span> ›</button></nav>');
  var nav = g.nextElementSibling;
  nav.querySelector(".swipe-nav.prev").addEventListener("click", function (e) { e.stopPropagation(); go(prev, 1); });
  nav.querySelector(".swipe-nav.next").addEventListener("click", function (e) { e.stopPropagation(); go(next, -1); });

  // make the next page and its picture load instantly
  var l = document.createElement("link"); l.rel = "prefetch"; l.href = next; document.head.appendChild(l);
  if (g.dataset.nextImg) { var im = new Image(); im.src = g.dataset.nextImg; }

  function go(url, dir) {
    try { var sel = document.querySelector(".buybox select.model"); if (sel && sel.value) sessionStorage.setItem("nv-model", sel.value);
      var c = document.querySelector("[data-mugcolors] .cm-color.on"); if (c) sessionStorage.setItem("nv-mugcolor", c.dataset.c);
      sessionStorage.setItem("nv-swiped", "1"); } catch (x) {}
    g.classList.add("leaving"); g.style.transform = "translateX(" + (dir * 40) + "px)";
    setTimeout(function () { location.href = url; }, 160);
  }

  // touch swipe: horizontal only, ignore vertical scrolling and short taps
  var x0 = 0, y0 = 0, t0 = 0, on = false;
  g.addEventListener("touchstart", function (e) { if (e.touches.length !== 1) return; on = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); }, { passive: true });
  g.addEventListener("touchmove", function (e) { if (!on) return; var dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0; if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) g.style.transform = "translateX(" + dx * 0.35 + "px)"; }, { passive: true });
  g.addEventListener("touchend", function (e) {
    if (!on) return; on = false; var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - t0 < 800) go(dx < 0 ? next : prev, dx < 0 ? -1 : 1);
    else g.style.transform = "";
  });
  // keyboard on desktop
  document.addEventListener("keydown", function (e) { if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || "")) return; if (e.key === "ArrowRight") go(next, -1); if (e.key === "ArrowLeft") go(prev, 1); });

  // one-time hint on touch screens
  var touch = matchMedia("(hover: none)").matches, seen = false;
  try { seen = localStorage.getItem("nv-swipe-hint") === "1"; } catch (x) {}
  if (touch && !seen) {
    g.insertAdjacentHTML("beforeend", '<div class="swipe-hint"><span><i>⟵ ⟶</i>Swipe for more designs</span></div>');
    try { localStorage.setItem("nv-swipe-hint", "1"); } catch (x) {}
    setTimeout(function () { var h = g.querySelector(".swipe-hint"); if (h) h.remove(); }, 3000);
  }

  // carry the shopper's choices to this design
  window.addEventListener("load", function () {
    try {
      if (sessionStorage.getItem("nv-swiped") !== "1") return;
      var m = sessionStorage.getItem("nv-model"), sel = document.querySelector(".buybox select.model");
      if (m && sel && !sel.value && Array.prototype.some.call(sel.options, function (o) { return o.value === m; })) { sel.value = m; sel.dispatchEvent(new Event("change", { bubbles: true })); }
      var c = sessionStorage.getItem("nv-mugcolor"), b = c && document.querySelector('[data-mugcolors] .cm-color[data-c="' + c + '"]');
      if (b && !b.classList.contains("on")) b.click();
    } catch (x) {}
  });
})();
