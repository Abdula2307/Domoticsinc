document.addEventListener("DOMContentLoaded", function () {
  var list = document.getElementById("products");
  var message = document.getElementById("message");

  message.innerHTML = '<p class="muted">Loading products…</p>';

  api("/api/products")
    .then(function (products) {
      if (products.length === 0) {
        message.innerHTML = '<p class="muted">No products yet. Please check back soon.</p>';
        return;
      }
      message.innerHTML = "";
      list.innerHTML = products
        .map(function (p) {
          return (
            '<a class="card product-card" href="/product.html?id=' + encodeURIComponent(p._id) + '">' +
            '<div class="product-name">' + esc(p.name) + "</div>" +
            '<div class="product-desc">' + esc(p.description) + "</div>" +
            '<div class="price">' + esc(money(p.price, p.currency)) + "</div>" +
            "</a>"
          );
        })
        .join("");
    })
    .catch(function (err) {
      message.innerHTML = '<div class="error">Could not load products: ' + esc(err.message) + "</div>";
    });
});
