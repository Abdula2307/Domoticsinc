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

      var photos = [];
      for (var k = 0; k < (product.imageCount || 0); k++) photos.push(imageUrl(product._id, k));

      var gallery =
        '<div class="gallery">' +
        '<div class="gallery-main' + (photos.length ? "" : " placeholder") + '">' +
        (photos.length ? '<img id="main-photo" src="' + esc(photos[0]) + '" alt="' + esc(product.name) + '">' : "") +
        "</div>" +
        (photos.length > 1
          ? '<div class="thumbs">' +
            photos
              .map(function (url, idx) {
                return (
                  '<button type="button" class="thumb-btn' + (idx === 0 ? " active" : "") + '" data-i="' + idx + '" aria-label="Show photo ' + (idx + 1) + '">' +
                  '<img src="' + esc(url) + '" alt=""></button>'
                );
              })
              .join("") +
            "</div>"
          : "") +
        "</div>";

      container.innerHTML =
        '<div class="product-layout">' +
        gallery +
        '<div class="product-info">' +
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
        '<p class="muted" style="margin-top:18px;font-size:14px">Payment: cash on delivery</p>' +
        "</div></div>";

      var qtyEl = document.getElementById("qty");
      var addBtn = document.getElementById("add");

      // switch the big photo when a small one is clicked
      var thumbs = container.querySelector(".thumbs");
      if (thumbs) {
        thumbs.addEventListener("click", function (e) {
          var btn = e.target.closest("button[data-i]");
          if (!btn) return;
          document.getElementById("main-photo").src = photos[Number(btn.getAttribute("data-i"))];
          Array.prototype.forEach.call(thumbs.children, function (b) {
            b.classList.toggle("active", b === btn);
          });
        });
      }

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
