document.addEventListener("DOMContentLoaded", function () {
  var container = document.getElementById("checkout");
  var params = new URLSearchParams(window.location.search);
  var buyNowId = params.get("product");
  var buyNowQty = Math.max(1, Math.min(100, parseInt(params.get("qty") || "1", 10) || 1));

  function showEmpty() {
    container.innerHTML =
      '<div class="center" style="padding:40px 0"><h1>Nothing to order</h1>' +
      '<a href="/" class="btn">Browse products</a></div>';
  }

  function showForm(items) {
    var totals = totalsByCurrency(items);

    container.innerHTML =
      "<h1>Checkout</h1>" +
      '<div class="card" style="margin-bottom:16px"><h2>Order summary</h2>' +
      items
        .map(function (i) {
          return (
            '<div class="line"><div class="line-info"><div class="line-name">' + esc(i.name) + "</div>" +
            '<div class="muted">' + esc(money(i.price, i.currency)) + " &times; " + i.quantity + "</div></div>" +
            '<div class="line-total">' + esc(money(i.price * i.quantity, i.currency)) + "</div></div>"
          );
        })
        .join("") +
      '<div class="total-box"><span>Total</span><div class="total-values">' +
      totals
        .map(function (t) {
          return "<div>" + esc(money(t.amount, t.currency)) + "</div>";
        })
        .join("") +
      "</div></div></div>" +
      '<form class="card" id="order-form" novalidate>' +
      "<h2>Your details</h2>" +
      '<div id="form-error"></div>' +
      '<div class="field"><label for="name">Full name</label><input id="name" maxlength="120" autocomplete="name"></div>' +
      '<div class="field"><label for="phone">Phone number</label><input id="phone" type="tel" maxlength="40" autocomplete="tel"></div>' +
      '<div class="field"><label for="address">Delivery address</label><textarea id="address" maxlength="600" autocomplete="street-address"></textarea></div>' +
      '<p class="muted" style="font-size:14px">Payment method: <strong>Cash on delivery</strong>. You pay when your order arrives.</p>' +
      '<button class="btn btn-block" id="submit" type="submit">Confirm order</button>' +
      "</form>";

    var form = document.getElementById("order-form");
    var errorBox = document.getElementById("form-error");
    var submit = document.getElementById("submit");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorBox.innerHTML = "";

      var customer = {
        name: document.getElementById("name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim(),
      };
      if (!customer.name || !customer.phone || !customer.address) {
        errorBox.innerHTML = '<div class="error">Please fill in your name, phone number and address.</div>';
        return;
      }

      submit.disabled = true;
      submit.textContent = "Placing order…";

      api("/api/orders", {
        method: "POST",
        body: {
          customer: customer,
          items: items.map(function (i) {
            return { productId: i.productId, quantity: i.quantity };
          }),
        },
      })
        .then(function () {
          // Only empty the cart when the order came from the cart
          if (!buyNowId) clearCart();
          window.location.href = "/success.html";
        })
        .catch(function (err) {
          errorBox.innerHTML = '<div class="error">' + esc(err.message) + "</div>";
          submit.disabled = false;
          submit.textContent = "Confirm order";
        });
    });
  }

  if (buyNowId) {
    // "Place order" straight from a product page: order only that product
    api("/api/products/" + encodeURIComponent(buyNowId))
      .then(function (p) {
        showForm([{ productId: p._id, name: p.name, price: p.price, currency: p.currency, quantity: buyNowQty }]);
      })
      .catch(function () {
        container.innerHTML =
          '<div class="error">This product is no longer available.</div><a href="/" class="btn">Back to products</a>';
      });
  } else {
    var items = getCart();
    if (items.length === 0) showEmpty();
    else showForm(items);
  }
});
