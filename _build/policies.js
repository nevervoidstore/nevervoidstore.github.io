// Trust & policy pages. Fill CONTACT, then rebuild. Empty values are left out of the pages.
const CONTACT = {
  businessName: "NevervoidStore",
  legalName: "Nevervoid Photography",
  founder: "Antony Pratap",
  linkedin: "https://www.linkedin.com/in/antonypratap/", // founder LinkedIn profile URL
  photographySite: "https://nevervoid.com",
  email: "",              // e.g. "hello@nevervoidstore.com"
  phone: "",              // e.g. "+91 98765 43210"
  whatsapp: "919880000990", // digits only, e.g. "919876543210"
  metaPixel: "185720795222527", // Meta dataset (Pixel) ID, digits only; empty = no Meta tracking
  metaDomainVerify: "", // content of the facebook-domain-verification meta tag
  teamApi: "", // Google Apps Script web app URL (…/exec): the site backend (checkout + team links). Empty = both off
  checkoutApi: false, // true = pay in Razorpay's window via the backend; false = Razorpay Payment Page
  address: "",            // full business address
  grievanceOfficer: "",   // name of the person handling complaints
  instagram: "nevervoidstore",
  razorpayPage: "https://pages.razorpay.com/pl_Tw0kLnG202opHG/view",
  // one Payment Page per item (single item, fixed quantity); the all-items page above is the fallback
  rzpPages: {
    glass_phone_case: "https://rzp.io/rzp/glass-phone-case",
    ceramic_mug: "https://rzp.io/rzp/ceramic-mug",
    custom_pet_mug: "https://rzp.io/rzp/custom-mug",
    custom_phone_case: "https://rzp.io/rzp/custom-phone"
  },       // long Payment Page URL, e.g. https://pages.razorpay.com/pl_XXXX/view
  updated: "4 November 2026"
};

const LI_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="#fff" d="M7.1 9.6H4.6V19h2.5V9.6zM5.9 5.2a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9zM19.4 13.6c0-2.6-1.4-4.2-3.7-4.2-1.3 0-2.1.7-2.5 1.3V9.6h-2.4V19h2.5v-4.9c0-1.3.4-2.3 1.7-2.3s1.6 1.1 1.6 2.4V19h2.5l.3-5.4z"/></svg>';
const contactLines = () => [
  CONTACT.legalName && `<li><strong>Business:</strong> ${CONTACT.legalName}</li>`,
  CONTACT.email && `<li><strong>Email:</strong> <a href="mailto:${CONTACT.email}">${CONTACT.email}</a></li>`,
  CONTACT.phone && `<li><strong>Phone:</strong> ${CONTACT.phone}</li>`,
  CONTACT.whatsapp && `<li><strong>WhatsApp:</strong> <a href="https://wa.me/${CONTACT.whatsapp}">Chat with us</a></li>`,
  CONTACT.linkedin && `<li><strong>Founder:</strong> <a href="${CONTACT.linkedin}" rel="noopener">Antony Pratap on LinkedIn</a></li>`,
  `<li><strong>Instagram:</strong> <a href="https://instagram.com/${CONTACT.instagram}">@${CONTACT.instagram}</a></li>`,
  CONTACT.address && `<li><strong>Address:</strong> ${CONTACT.address}</li>`
].filter(Boolean).join("");

const PAGES = [
{
  slug: "shipping", title: "Shipping & Delivery Policy", nav: "Shipping",
  desc: "How NevervoidStore delivers made-to-order mugs and phone cases across Karnataka: dispatch times, delivery times, tracking and charges.",
  body: () => `
<p class="lead">Every mug and phone case is printed fresh when you order. It is then packed and shipped to you with tracking.</p>
<h2>Where we ship</h2>
<p>For now we deliver only within <strong>Karnataka</strong>, to pincodes starting with 56, 57, 58 or 59. We hope to deliver across India soon. <a href="https://wa.me/${CONTACT.whatsapp}?text=Hi%20Antony!%20Please%20let%20me%20know%20when%20you%20deliver%20outside%20Karnataka.">Ask us to let you know</a>.</p>
<h2>How long it takes</h2>
<table><thead><tr><th>Stage</th><th>Time</th></tr></thead><tbody>
<tr><td>Printing and dispatch</td><td>3–5 business days after your order is confirmed</td></tr>
<tr><td>Delivery after dispatch</td><td>About 5–8 days, depending on your location</td></tr>
<tr><td>Custom pet portraits</td><td>Printing starts after you approve your preview</td></tr>
</tbody></table>
<p>For delivery before Christmas, order by <strong>12 December</strong>.</p>
<h2>Shipping charges</h2>
<p>Any shipping charge is shown and confirmed with you before you pay. You will never be charged anything you haven't seen.</p>
<h2>Tracking</h2>
<p>Once your order ships, we send you the tracking details so you can follow it to your door.</p>
<h2>Delays</h2>
<p>Couriers can be slower during festivals, bad weather or in remote areas. If your order is running late, contact us and we'll chase it for you.</p>`
},
{
  slug: "returns", title: "Returns, Refunds & Replacements", nav: "Returns & refunds",
  desc: "NevervoidStore's returns and refund policy: free replacement or refund for damaged, defective or wrong items, and how to request one.",
  body: () => `
<p class="lead">If your order arrives damaged, defective or wrong, we'll replace it free or refund you in full. You just need to tell us within 48 hours of delivery.</p>
<h2>What's covered</h2>
<ul>
<li>The item arrived broken, cracked or damaged in transit.</li>
<li>There is a printing defect, such as a smudged, faded or misaligned print.</li>
<li>You received the wrong design or the wrong phone model from what you ordered.</li>
</ul>
<h2>How to request a replacement or refund</h2>
<ol>
<li>Contact us within <strong>48 hours of delivery</strong>.</li>
<li>Share your order details and a clear photo or unboxing video showing the problem.</li>
<li>We review it within 2 business days and confirm a free replacement or a full refund, whichever you prefer.</li>
</ol>
<p>You don't need to send the damaged item back unless we ask.</p>
<h2>What isn't covered</h2>
<p>Every item is made to order for you, so we can't accept returns for a change of mind. We also can't accept returns if you chose the wrong phone model. Please double-check your model before ordering, and contact us if you're unsure.</p>
<h2>Refund timelines</h2>
<p>Approved refunds go back to your original payment method within <strong>5–7 business days</strong>. Your bank may take a little longer to show the credit.</p>
<h2 id="cancellation">Cancellations</h2>
<p>You can cancel for a full refund until we send your order for printing, usually within <strong>12 hours</strong> of ordering. For custom pet portraits, you can cancel any time before you approve the preview. Once printing has started, we can't cancel the order.</p>`
},
{
  slug: "privacy", title: "Privacy Policy", nav: "Privacy",
  desc: "How NevervoidStore collects, uses and protects your personal information, including pet photos for custom orders.",
  body: () => `
<p class="lead">We collect only what we need to make and deliver your order. We never sell your information.</p>
<h2>What we collect</h2>
<ul>
<li><strong>Order details:</strong> your name, phone number, email, delivery address and the products and phone model you choose.</li>
<li><strong>Photos you send us:</strong> for custom pet portraits.</li>
<li><strong>Messages:</strong> anything you send us on WhatsApp, Instagram or email.</li>
</ul>
<p>We don't store your card or UPI details. Payments are handled by Razorpay, our payment partner.</p>
<h2>Cookies and ads</h2>
<p>We use the Meta Pixel to understand which of our Facebook and Instagram ads lead people to our site and to orders. It records pages viewed and actions such as starting checkout, and Meta may use cookies to do this. It does not receive your address or payment details. You can manage ad settings in your Facebook or Instagram account.</p>
<h2>How we use it</h2>
<ul>
<li>To make, ship and support your order.</li>
<li>To send you order updates and tracking details.</li>
<li>To answer your questions.</li>
</ul>
<h2>Who we share it with</h2>
<p>We share only what's needed with the partners who help us fulfil your order:</p>
<ul>
<li><strong>Our payment partner (Razorpay)</strong>, to process your payment securely.</li>
<li><strong>Our print and fulfilment partner in India</strong>, to print and pack your order.</li>
<li><strong>Courier partners</strong>, to deliver it.</li>
</ul>
<h2>Your pet photos</h2>
<p>Photos you send are used only to create your order. We will never post them or your portrait publicly without your permission.</p>
<h2>This website</h2>
<p>This website doesn't use advertising trackers. It loads fonts from Google Fonts, which may record standard technical information such as your IP address.</p>
<h2>Your choices</h2>
<p>You can ask us to show, correct or delete your information at any time. We'll respond within 7 business days, except where we must keep records by law (for example, invoices).</p>`
},
{
  slug: "terms", title: "Terms & Conditions", nav: "Terms",
  desc: "The terms for ordering made-to-order mugs and phone cases from NevervoidStore.",
  body: () => `
<p class="lead">NevervoidStore is run by ${CONTACT.legalName}. By placing an order with ${CONTACT.businessName}, you agree to these terms. They are written to be plain and fair.</p>
<h2>Orders</h2>
<p>An order is confirmed once we've confirmed the details with you and received payment. We may decline or cancel an order, with a full refund, if an item is unavailable or there's an error in its price or description.</p>
<h2>Prices and offers</h2>
<p>Prices are in Indian rupees (₹). Sale prices apply until the date shown on the site. Any shipping charge is shown before you pay.</p>
<h2>Made-to-order products</h2>
<p>Every item is printed to order. Product images are representative: colours can look slightly different on screen than in print. Case cutouts and edges vary slightly between phone models.</p>
<h2>Custom orders and your photos</h2>
<p>When you send us a photo, you confirm you have the right to use it. We create a preview, and printing starts only after you approve it.</p>
<h2>Returns and refunds</h2>
<p>Damaged, defective or wrong items are covered by our <a href="returns.html">Returns, Refunds &amp; Replacements policy</a>.</p>
<h2>Designs</h2>
<p>Our designs and site content belong to ${CONTACT.businessName} and may not be copied or resold without permission.</p>
<h2>Liability</h2>
<p>Our responsibility for any order is limited to the amount you paid for it.</p>
<h2>Governing law</h2>
<p>These terms are governed by the laws of India.</p>`
},
{
  slug: "contact", title: "Contact Us", nav: "Contact",
  desc: "Contact NevervoidStore for orders, custom pet portraits, corporate gifting or help with an existing order.",
  body: () => `
<p class="lead">We're a small team and we read every message. We usually reply within a few hours, and always within one business day.</p>
<h2>Reach us</h2>
<ul class="contact-list">${contactLines()}</ul>
<h2>Help with an order</h2>
<p>Please include your name and the phone number you ordered with. If something arrived damaged, add a photo. See our <a href="returns.html">returns policy</a> for what happens next.</p>
<h2>Something not working on the site?</h2>
<p>If a page, button, preview or payment isn't working, <a href="#report" data-report>report an issue</a>. It takes a few seconds and helps us fix it quickly.</p>
${CONTACT.grievanceOfficer ? `<h2>Grievance officer</h2><p>If you're not satisfied with how we've handled an issue, contact our grievance officer, <strong>${CONTACT.grievanceOfficer}</strong>${CONTACT.email ? `, at <a href="mailto:${CONTACT.email}">${CONTACT.email}</a>` : ""}. We acknowledge complaints within 48 hours and aim to resolve them within one month.</p>` : ""}
<h2>Bulk and corporate orders</h2>
<p>See <a href="../corporate.html">corporate gifting</a> for bulk pricing and quotes.</p>`
},
{
  slug: "about", title: "About NevervoidStore", nav: "About us",
  desc: "NevervoidStore makes Christmas mugs, pet mugs, custom pet portraits and phone cases to order, delivered across Karnataka.",
  body: () => `
<p class="lead">NevervoidStore is a brand by <a href="${CONTACT.photographySite}" rel="noopener"><strong>Nevervoid Photography</strong></a>, founded by <strong>Antony Pratap</strong>${CONTACT.linkedin ? ` <a class="li-inline" href="${CONTACT.linkedin}" rel="noopener" aria-label="Antony Pratap on LinkedIn">${LI_ICON}</a>` : ""}. It's a small, independent gift store from Bengaluru making mugs and phone cases people actually keep.</p>
<h2>What we make</h2>
<p>We design Christmas mugs, pet mugs, custom pet portraits and printed phone cases for iPhone, Samsung and OnePlus. Nothing sits in a warehouse. Each piece is printed fresh by our print partner in India when you order, then packed and delivered to you anywhere in Karnataka.</p>
<h2>How we work</h2>
<ul>
<li><strong>You see it before you pay:</strong> we confirm every order's details with you first.</li>
<li><strong>You approve custom work:</strong> custom portraits are printed only after you approve the preview.</li>
<li><strong>We stand behind it:</strong> anything damaged, defective or wrong is replaced free or refunded.</li>
</ul>
<p>Questions? <a href="contact.html">Get in touch</a>.</p>`
}
];

module.exports = { CONTACT, PAGES, LI_ICON };
