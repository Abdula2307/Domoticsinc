function renderCart() {
  var container = document.getElementById("cart");
  var items = getCart();

  if (items.length === 0) {
    container.innerHTML =
      '<div class="center" style="padding:40px 0"><h1>Your cart is empty</h1>' +
      '<a href="/" class="btn">Browse products</a></div>';
    return;
  }

  var totals = totalsByCurrency(items);

  container.innerHTML =
    "<h1>Your cart</h1>" +
    '<div class="card">' +
    items
      .map(function (i) {
        return (
          '<div class="line" data-id="' + esc(i.productId) + '">' +
          '<div class="line-info">' +
          '<a class="line-name" href="/product.html?id=' + encodeURIComponent(i.productId) + '">' + esc(i.name) + "</a>" +
          '<div class="muted">' + esc(money(i.price, i.currency)) + " each</div></div>" +
          '<div class="qty" style="margin-bottom:0">' +
          '<button type="button" data-act="minus" aria-label="Decrease">&minus;</button>' +
          "<span>" + i.quantity + "</span>" +
          '<button type="button" data-act="plus" aria-label="Increase">+</button></div>' +
          '<div class="line-total">' + esc(money(i.price * i.quantity, i.currency)) + "</div>" +
          '<button type="button" class="btn btn-danger btn-small" data-act="remove">Remove</button>' +
          "</div>"
        );
      })
      .join("") +
    '<div class="total-box"><span>Total</span><div class="total-values">' +
    totals
      .map(function (t) {
        return "<div>" + esc(money(t.amount, t.currency)) + "</div>";
      })
      .join("") +
    "</div></div>" +
    '<div style="margin-top:18px">' +
    '<a href="/checkout.html" class="btn btn-block">Place order</a>' +
    '<p class="muted center" style="font-size:14px;margin-bottom:0">Payment: cash on delivery</p>' +
    "</div></div>";
}

document.addEventListener("DOMContentLoaded", function () {
  renderCart();

  document.getElementById("cart").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-act]");
    if (!btn) return;
    var line = btn.closest(".line");
    var id = line.getAttribute("data-id");
    var item = getCart().filter(function (i) {
      return i.productId === id;
    })[0];
    if (!item) return;

    var act = btn.getAttribute("data-act");
    if (act === "plus") setCartQuantity(id, item.quantity + 1);
    if (act === "minus") setCartQuantity(id, item.quantity - 1);
    if (act === "remove") removeFromCart(id);
    renderCart();
  });
});
