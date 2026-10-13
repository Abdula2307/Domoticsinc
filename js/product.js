document.addEventListener("DOMContentLoaded", function () {
  var container = document.getElementById("product");
  var id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    container.innerHTML = '<div class="error">Product not found.</div>';
    return;
  }

  api("/api/products/" + encodeURIComponent(id))
    .then(function (product) {
      document.title = product.name + " | " + SITE.name;
      var qty = 1;

      container.innerHTML =
        "<h1>" + esc(product.name) + "</h1>" +
        '<div class="price">' + esc(money(product.price, product.currency)) + "</div>" +
        '<div class="detail-desc">' + esc(product.description) + "</div>" +
        '<div class="qty">' +
        '<button type="button" id="minus" aria-label="Decrease quantity">&minus;</button>' +
        '<span id="qty">1</span>' +
        '<button type="button" id="plus" aria-label="Increase quantity">+</button>' +
        "</div>" +
        '<div class="btn-row">' +
        '<button type="button" class="btn btn-outline" id="add">Add to cart</button>' +
        '<button type="button" class="btn" id="order">Place order</button>' +
        "</div>" +
        '<p class="muted" style="margin-top:18px;font-size:14px">Payment: cash on delivery</p>';

      var qtyEl = document.getElementById("qty");
      var addBtn = document.getElementById("add");

      document.getElementById("minus").addEventListener("click", function () {
        qty = Math.max(1, qty - 1);
        qtyEl.textContent = qty;
      });
      document.getElementById("plus").addEventListener("click", function () {
        qty = Math.min(100, qty + 1);
        qtyEl.textContent = qty;
      });

      addBtn.addEventListener("click", function () {
        addToCart(product, qty);
        addBtn.textContent = "Added ✓";
        setTimeout(function () {
          addBtn.textContent = "Add to cart";
        }, 1800);
      });

      document.getElementById("order").addEventListener("click", function () {
        window.location.href = "/checkout.html?product=" + encodeURIComponent(product._id) + "&qty=" + qty;
      });
    })
    .catch(function (err) {
      container.innerHTML =
        '<div class="error">' + esc(err.status === 404 ? "This product was not found." : err.message) + "</div>";
    });
});
