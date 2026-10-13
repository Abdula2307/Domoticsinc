/* ------------------------------------------------------------------
   Shared code for every page: site details, cart (saved in the browser),
   helpers, and the header + footer.
   Change your site name / contact details here, once.
------------------------------------------------------------------- */

var SITE = {
  name: "Domotics Inc",
  email: "yukiyou.xoxo@gmail.com",
  phoneDisplay: "+92 341 4645790",
  phoneDigits: "923414645790",
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

/* ---------- header + footer ---------- */

function renderLayout() {
  var header = document.getElementById("site-header");
  if (header) {
    header.innerHTML =
      '<header class="header"><div class="container header-inner">' +
      '<a href="/" class="logo">' + esc(SITE.name) + "</a>" +
      '<nav class="nav">' +
      '<a href="/#contact">Contact</a>' +
      '<a href="/cart.html" class="cart-link">Cart<span id="cart-badge" class="cart-badge hidden">0</span></a>' +
      "</nav></div></header>";
  }

  var footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML =
      '<footer class="footer" id="contact"><div class="container">' +
      "<h3>Contact " + esc(SITE.name) + "</h3>" +
      '<p>Email: <a href="mailto:' + esc(SITE.email) + '">' + esc(SITE.email) + "</a></p>" +
      '<p>Phone: <a href="tel:+' + esc(SITE.phoneDigits) + '">' + esc(SITE.phoneDisplay) + "</a>" +
      ' &middot; <a href="https://wa.me/' + esc(SITE.phoneDigits) + '" target="_blank" rel="noopener">WhatsApp</a></p>' +
      '<p class="copy">&copy; ' + new Date().getFullYear() + " " + esc(SITE.name) + ". Payment: cash on delivery.</p>" +
      "</div></footer>";
  }

  updateCartBadge();
}

document.addEventListener("DOMContentLoaded", renderLayout);
