/* WhatsApp chat bubble. Number comes from the site build (src/policies.js CONTACT.whatsapp). */
(function(){
  var NUM = "919880000990";
  if (!NUM) return;
  var h1 = document.querySelector(".pdp h1, .post h1, .policy h1");
  var onCorp = /corporate\.html$/.test(location.pathname);
  var topic = document.querySelector(".pdp h1") ? "the " + h1.textContent.trim()
            : onCorp ? "corporate gifting" : "NevervoidStore";
  var msg = "Hi Antony! I have a question about " + topic + ".";
  var url = "https://wa.me/" + NUM + "?text=" + encodeURIComponent(msg);

  var wrap = document.createElement("div");
  wrap.className = "wa-wrap";
  wrap.innerHTML =
    '<div class="wa-card" role="dialog" aria-label="Chat with Antony">' +
      '<button class="wa-x" type="button" aria-label="Close">×</button>' +
      '<div class="wa-head"><span class="wa-av">A</span><div><b>Antony</b><small>Founder · usually replies within a few hours</small></div></div>' +
      '<p>Hi, I\'m Antony 👋 Questions about a design, your phone model or a custom pet portrait? Message me on WhatsApp.</p>' +
      '<a class="wa-go" href="' + url + '" target="_blank" rel="noopener">Chat on WhatsApp</a>' +
    '</div>' +
    '<a class="wa-btn" href="' + url + '" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">' +
      '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path fill="#fff" d="M16 3C8.8 3 3 8.6 3 15.6c0 2.5.7 4.8 2 6.8L3.6 28l5.8-1.5c1.9 1 4.1 1.6 6.6 1.6 7.2 0 13-5.6 13-12.5S23.2 3 16 3zm0 22.7c-2.1 0-4.1-.6-5.8-1.6l-.4-.2-3.4.9.9-3.3-.3-.4c-1.1-1.7-1.7-3.6-1.7-5.6C5.3 9.9 10.1 5.3 16 5.3s10.7 4.6 10.7 10.3S21.9 25.7 16 25.7zm5.9-7.7c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.7 1.2 3.1 1.4 3.3 2.3 3.5 5.6 4.9c2.1.9 2.9 1 4 .8.6-.1 1.9-.8 2.2-1.5s.3-1.3.2-1.5-.3-.2-.6-.4z"/></svg>' +
    '</a>';
  document.body.appendChild(wrap);

  var card = wrap.querySelector(".wa-card");
  var seen = false;
  try { seen = sessionStorage.getItem("wa-seen") === "1"; } catch (e) {}
  function show(){ card.classList.add("show"); }
  function hide(){ card.classList.remove("show"); try { sessionStorage.setItem("wa-seen","1"); } catch (e) {} }
  if (!seen) setTimeout(show, 5000);
  wrap.querySelector(".wa-x").addEventListener("click", hide);
  wrap.querySelector(".wa-go").addEventListener("click", hide);
})();
