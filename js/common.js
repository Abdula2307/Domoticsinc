/* ------------------------------------------------------------------
   Shared code for every page: site details, cart (saved in the browser),
   helpers, icons, and the header + footer.
   Change your site name / contact details / social links here, once.
------------------------------------------------------------------- */

var SITE = {
  name: "Domotics Inc",
  email: "yukiyou.xoxo@gmail.com",
  phoneDisplay: "+92 341 4645790",
  phoneDigits: "923414645790",
  facebook: "https://www.facebook.com/share/1GS9iJ3eaN/",
  instagram: "https://instagram.com/domoticsinc?exln=Njc5Y3NxOWg1NmJ0",
};

var CART_KEY = "domotics_cart_v1";

/* ---------- helpers ---------- */

// Escape text before putting it into HTML (stops injected code from running)
function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(amount, currency) {
  var n = Number(amount) || 0;
  return (n.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + (currency || "")).trim();
}

// items: [{ price, currency, quantity }]  ->  [{ currency, amount }]
function totalsByCurrency(items) {
  var map = {};
  var order = [];
  items.forEach(function (i) {
    if (!(i.currency in map)) {
      map[i.currency] = 0;
      order.push(i.currency);
    }
    map[i.currency] += i.price * i.quantity;
  });
  return order.map(function (c) {
    return { currency: c, amount: map[c] };
  });
}

// address of one product photo
function imageUrl(productId, index) {
  return "/api/image?id=" + encodeURIComponent(productId) + "&i=" + (index || 0);
}

// fetch wrapper: returns parsed JSON, throws Error (with .status) when the request fails
function api(path, options) {
  options = options || {};
  var init = { method: options.method || "GET", headers: {}, credentials: "same-origin" };
  if (options.body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }
  return fetch(path, init).then(function (res) {
    return res
      .json()
      .catch(function () {
        return {};
      })
      .then(function (data) {
        if (!res.ok) {
          var err = new Error(data.error || "Something went wrong (" + res.status + ")");
          err.status = res.status;
          throw err;
        }
        return data;
      });
  });
}

/* ---------- cart (kept in localStorage so it survives page reloads) ---------- */

function getCart() {
  try {
    var parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (e) {
    /* storage blocked (private mode) - cart works until the page is reloaded */
  }
  updateCartBadge();
}

function addToCart(product, quantity) {
  quantity = quantity || 1;
  var items = getCart();
  var found = items.filter(function (i) {
    return i.productId === product._id;
  })[0];
  if (found) {
    found.quantity = Math.min(100, found.quantity + quantity);
  } else {
    items.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      quantity: quantity,
    });
  }
  saveCart(items);
}

function setCartQuantity(productId, quantity) {
  var items = getCart()
    .map(function (i) {
      if (i.productId === productId) i.quantity = Math.max(0, Math.min(100, quantity));
      return i;
    })
    .filter(function (i) {
      return i.quantity > 0;
    });
  saveCart(items);
}

function removeFromCart(productId) {
  saveCart(
    getCart().filter(function (i) {
      return i.productId !== productId;
    })
  );
}

function clearCart() {
  saveCart([]);
}

function cartCount() {
  return getCart().reduce(function (sum, i) {
    return sum + i.quantity;
  }, 0);
}

function updateCartBadge() {
  var el = document.getElementById("cart-badge");
  if (!el) return;
  var n = cartCount();
  el.textContent = n;
  el.classList.toggle("hidden", n === 0);
}

/* ---------- icons (any element with data-icon="name" gets the icon drawn in it) ---------- */

var ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.2 2.9 7.9 7 9.5 4.1-1.6 7-5.3 7-9.5V6l-7-3z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19c3-5 6-8 10-10"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>',
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19c0 1.5-2 2.5-5 2.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>',
  heart: '<path d="M12 20.5C6 16.5 3.5 13.5 3.5 10A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 8.5 2c0 3.5-2.5 6.5-8.5 10.5z"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2.5l2.2 11h10.6l2-8H6.5"/>',
  facebook: '<path fill="currentColor" stroke="none" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21z"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor"/>',
};

function icon(name) {
  return (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (ICONS[name] || "") +
    "</svg>"
  );
}

function renderIcons() {
  var nodes = document.querySelectorAll("[data-icon]");
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].innerHTML = icon(nodes[i].getAttribute("data-icon"));
  }
}

/* ---------- header + footer ---------- */

function logoHtml() {
  return '<span class="icon" data-icon="home"></span>DOMOTICS <span class="inc">INC.</span>';
}

function renderLayout() {
  var path = window.location.pathname;
  var onHome = path === "/" || path === "/index.html" || path === "/index";

  var header = document.getElementById("site-header");
  if (header) {
    header.innerHTML =
      '<header class="header"><div class="container header-inner">' +
      '<a href="/" class="logo" aria-label="' + esc(SITE.name) + ' home">' + logoHtml() + "</a>" +
      '<nav class="nav-links" aria-label="Main">' +
      '<a href="/"' + (onHome ? ' class="active"' : "") + ">Home</a>" +
      '<a href="/#about">About</a>' +
      '<a href="/#features">Features</a>' +
      '<a href="/#contact">Support</a>' +
      '<a href="/#contact">Contact</a>' +
      "</nav>" +
      '<a href="/cart.html" class="cart-link"><span class="icon" data-icon="cart"></span>Cart<span id="cart-badge" class="cart-badge hidden">0</span></a>' +
      "</div></header>";
  }

  var footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML =
      '<footer class="footer" id="contact"><div class="container">' +
      '<div class="footer-top">' +
      '<div class="footer-brand"><a href="/" class="logo">' + logoHtml() + "</a><p>Smarter Homes, Brighter Futures.</p></div>" +
      '<nav class="footer-links" aria-label="Footer"><a href="/#about">About</a><a href="/#contact">Support</a><a href="/#contact">Contact</a></nav>' +
      '<div class="socials">' +
      '<a href="' + esc(SITE.facebook) + '" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><span class="icon" data-icon="facebook"></span></a>' +
      '<a href="' + esc(SITE.instagram) + '" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><span class="icon" data-icon="instagram"></span></a>' +
      "</div></div>" +
      '<div class="footer-contact">' +
      '<span>Email: <a href="mailto:' + esc(SITE.email) + '">' + esc(SITE.email) + "</a></span>" +
      '<span>Phone: <a href="tel:+' + esc(SITE.phoneDigits) + '">' + esc(SITE.phoneDisplay) + "</a>" +
      ' &middot; <a href="https://wa.me/' + esc(SITE.phoneDigits) + '" target="_blank" rel="noopener">WhatsApp</a></span>' +
      "</div>" +
      '<p class="footer-bottom">&copy; ' + new Date().getFullYear() + " " + esc(SITE.name) + ". All rights reserved. Payment: cash on delivery.</p>" +
      "</div></footer>";
  }

  renderIcons();
  updateCartBadge();
}

document.addEventListener("DOMContentLoaded", renderLayout);
