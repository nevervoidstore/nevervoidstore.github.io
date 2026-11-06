/* Festive season layer. Sale settings come from the site build. */
(function(){
  var S = {"on":true,"pct":20,"ends":"2026-12-25","label":"Christmas Sale"};
  if (!S.on) return;
  var end = new Date(S.ends + "T23:59:59+05:30"), now = new Date();
  if (now > end) return;
  var days = Math.ceil((end - now) / 864e5);
  var logo = document.querySelector("a.logo"), home = logo ? logo.getAttribute("href") : "/";
  var bar = document.createElement("div");
  bar.className = "fx-bar";
  var corp = /corporate\.html$/.test(location.pathname);
  bar.innerHTML = corp
    ? "🎄 Christmas gifting season · confirm bulk orders by <b>1 December</b>" + '<a href="#quote">Get a quote →</a>'
    : "🎄 " + S.label + " · <b>" + S.pct + "% off</b> all mugs &amp; cases" +
    '<span class="fx-days">' + (days <= 1 ? "Last day!" : days + " days left") + "</span>" +
    '<a href="' + home + '">Shop now →</a>';
  document.body.insertBefore(bar, document.body.firstChild);

  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var snow = document.createElement("div");
  snow.className = "fx-snow"; snow.setAttribute("aria-hidden", "true");
  var n = window.innerWidth < 700 ? 12 : 22;
  for (var i = 0; i < n; i++) {
    var f = document.createElement("i");
    f.textContent = i % 3 ? "•" : "❄";
    f.style.left = (Math.random() * 100) + "%";
    f.style.fontSize = (i % 3 ? 6 + Math.random() * 6 : 10 + Math.random() * 8) + "px";
    f.style.opacity = (0.35 + Math.random() * 0.45).toFixed(2);
    f.style.animationDuration = (10 + Math.random() * 10) + "s";
    f.style.animationDelay = (-Math.random() * 20) + "s";
    f.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
    snow.appendChild(f);
  }
  document.body.appendChild(snow);
})();
