document.addEventListener("DOMContentLoaded", function () {
  var list = document.getElementById("products");
  var message = document.getElementById("message");

  message.innerHTML = '<p class="muted" style="margin-top:20px">Loading products…</p>';

  api("/api/products")
    .then(function (products) {
      if (products.length === 0) {
        message.innerHTML = '<p class="muted" style="margin-top:20px">No products yet. Please check back soon.</p>';
        return;
      }
      message.innerHTML = "";
      list.innerHTML = products
        .map(function (p) {
          var hasPhoto = p.imageCount > 0;
          return (
            '<a class="card product-card" href="/product.html?id=' + encodeURIComponent(p._id) + '">' +
            '<div class="card-media' + (hasPhoto ? "" : " placeholder") + '">' +
            (hasPhoto ? '<img src="' + esc(imageUrl(p._id, 0)) + '" alt="' + esc(p.name) + '" loading="lazy">' : "") +
            "</div>" +
            '<div class="product-name">' + esc(p.name) + "</div>" +
            '<div class="product-desc">' + esc(p.description) + "</div>" +
            '<div class="price">' + esc(money(p.price, p.currency)) + "</div>" +
            "</a>"
          );
        })
        .join("");
    })
    .catch(function (err) {
      message.innerHTML = '<div class="error" style="margin-top:20px">Could not load products: ' + esc(err.message) + "</div>";
    });
});
