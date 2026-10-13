document.addEventListener("DOMContentLoaded", function () {
  var STATUSES = ["pending", "confirmed", "delivered", "cancelled"];

  var el = {
    loading: document.getElementById("loading"),
    login: document.getElementById("login"),
    loginError: document.getElementById("login-error"),
    loginBtn: document.getElementById("login-btn"),
    dashboard: document.getElementById("dashboard"),
    notice: document.getElementById("notice"),
    tabOrders: document.getElementById("tab-orders"),
    tabProducts: document.getElementById("tab-products"),
    ordersPanel: document.getElementById("orders-panel"),
    productsPanel: document.getElementById("products-panel"),
    productList: document.getElementById("product-list"),
    productForm: document.getElementById("product-form"),
    addBtn: document.getElementById("add-btn"),
  };

  var products = [];
  var orders = [];

  function show(node, visible) {
    node.classList.toggle("hidden", !visible);
  }

  function showNotice(message, type) {
    el.notice.innerHTML = message ? '<div class="' + type + '">' + esc(message) + "</div>" : "";
  }

  function showLogin() {
    show(el.loading, false);
    show(el.dashboard, false);
    show(el.login, true);
  }

  function showDashboard() {
    show(el.loading, false);
    show(el.login, false);
    show(el.dashboard, true);
    renderOrders();
    renderProducts();
  }

  function pendingCount() {
    return orders.filter(function (o) {
      return o.status === "pending";
    }).length;
  }

  function updateTabs() {
    var p = pendingCount();
    el.tabOrders.textContent = "Orders (" + orders.length + (p > 0 ? ", " + p + " new" : "") + ")";
    el.tabProducts.textContent = "Products (" + products.length + ")";
  }

  function selectTab(name) {
    el.tabOrders.classList.toggle("active", name === "orders");
    el.tabProducts.classList.toggle("active", name === "products");
    show(el.ordersPanel, name === "orders");
    show(el.productsPanel, name === "products");
  }

  function loadAll() {
    return Promise.all([api("/api/products"), api("/api/orders")]).then(function (results) {
      products = results[0];
      orders = results[1];
    });
  }

  /* ---------- orders ---------- */

  function renderOrders() {
    updateTabs();

    if (orders.length === 0) {
      el.ordersPanel.innerHTML = '<p class="muted">No orders yet.</p>';
      return;
    }

    el.ordersPanel.innerHTML = orders
      .map(function (o) {
        var items = (o.items || [])
          .map(function (i) {
            return "<li>" + esc(i.name) + " &times; " + esc(i.quantity) + " &mdash; " + esc(money(i.price * i.quantity, i.currency)) + "</li>";
          })
          .join("");
        var totals = (o.totals || [])
          .map(function (t) {
            return esc(money(t.amount, t.currency));
          })
          .join(" + ");
        var options = STATUSES.map(function (s) {
          return '<option value="' + s + '"' + (s === o.status ? " selected" : "") + ">" + s + "</option>";
        }).join("");

        return (
          '<div class="card order-card" data-id="' + esc(o._id) + '">' +
          '<div class="order-head"><div><strong>Order #' + esc(o._id.slice(-6).toUpperCase()) + "</strong>" +
          '<div class="muted" style="font-size:13px">' + esc(new Date(o.createdAt).toLocaleString()) + " &middot; Cash on delivery</div></div>" +
          '<span class="badge ' + esc(o.status) + '">' + esc(o.status) + "</span></div>" +
          '<div class="order-customer">' +
          "<div><strong>Name:</strong> " + esc(o.customer.name) + "</div>" +
          "<div><strong>Phone:</strong> " + esc(o.customer.phone) + "</div>" +
          "<div><strong>Address:</strong> " + esc(o.customer.address) + "</div></div>" +
          '<ul class="order-items">' + items + "</ul>" +
          '<div style="font-weight:700;margin-bottom:12px">Total: ' + totals + "</div>" +
          '<div class="btn-row">' +
          '<select class="status-select" data-act="status">' + options + "</select>" +
          '<button class="btn btn-danger btn-small" data-act="delete-order">Delete order</button>' +
          "</div></div>"
        );
      })
      .join("");
  }

  /* ---------- products ---------- */

  function renderProducts() {
    updateTabs();

    if (products.length === 0) {
      el.productList.innerHTML = '<p class="muted">No products yet.</p>';
      return;
    }

    el.productList.innerHTML = products
      .map(function (p) {
        return (
          '<div class="admin-product" data-id="' + esc(p._id) + '" data-name="' + esc(p.name) + '">' +
          '<div><div style="font-weight:600">' + esc(p.name) + '</div><div class="muted">' + esc(money(p.price, p.currency)) + "</div></div>" +
          '<button class="btn btn-danger btn-small" data-act="delete-product">Delete</button></div>'
        );
      })
      .join("");
  }

  /* ---------- events ---------- */

  el.tabOrders.addEventListener("click", function () {
    selectTab("orders");
  });
  el.tabProducts.addEventListener("click", function () {
    selectTab("products");
  });

  el.login.addEventListener("submit", function (e) {
    e.preventDefault();
    el.loginError.innerHTML = "";
    el.loginBtn.disabled = true;
    el.loginBtn.textContent = "Signing in…";

    api("/api/admin/login", {
      method: "POST",
      body: {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
      },
    })
      .then(loadAll)
      .then(function () {
        document.getElementById("password").value = "";
        showDashboard();
      })
      .catch(function (err) {
        el.loginError.innerHTML = '<div class="error">' + esc(err.message) + "</div>";
      })
      .then(function () {
        el.loginBtn.disabled = false;
        el.loginBtn.textContent = "Sign in";
      });
  });

  document.getElementById("logout").addEventListener("click", function () {
    api("/api/admin/logout", { method: "POST" }).then(function () {
      products = [];
      orders = [];
      showLogin();
    });
  });

  el.productForm.addEventListener("submit", function (e) {
    e.preventDefault();
    showNotice("");
    el.addBtn.disabled = true;
    el.addBtn.textContent = "Adding…";

    api("/api/products", {
      method: "POST",
      body: {
        name: document.getElementById("pname").value,
        price: document.getElementById("pprice").value,
        currency: document.getElementById("pcurrency").value,
        description: document.getElementById("pdesc").value,
      },
    })
      .then(function (created) {
        products.unshift(created);
        document.getElementById("pname").value = "";
        document.getElementById("pprice").value = "";
        document.getElementById("pdesc").value = "";
        renderProducts();
        showNotice("Product added.", "success");
      })
      .catch(function (err) {
        showNotice(err.message, "error");
      })
      .then(function () {
        el.addBtn.disabled = false;
        el.addBtn.textContent = "Add product";
      });
  });

  el.productList.addEventListener("click", function (e) {
    var btn = e.target.closest('button[data-act="delete-product"]');
    if (!btn) return;
    var row = btn.closest(".admin-product");
    var id = row.getAttribute("data-id");
    if (!confirm('Delete "' + row.getAttribute("data-name") + '"?')) return;
    showNotice("");

    api("/api/products/" + encodeURIComponent(id), { method: "DELETE" })
      .then(function () {
        products = products.filter(function (p) {
          return p._id !== id;
        });
        renderProducts();
      })
      .catch(function (err) {
        showNotice(err.message, "error");
      });
  });

  el.ordersPanel.addEventListener("click", function (e) {
    var btn = e.target.closest('button[data-act="delete-order"]');
    if (!btn) return;
    var id = btn.closest(".order-card").getAttribute("data-id");
    if (!confirm("Delete this order permanently?")) return;
    showNotice("");

    api("/api/orders/" + encodeURIComponent(id), { method: "DELETE" })
      .then(function () {
        orders = orders.filter(function (o) {
          return o._id !== id;
        });
        renderOrders();
      })
      .catch(function (err) {
        showNotice(err.message, "error");
      });
  });

  el.ordersPanel.addEventListener("change", function (e) {
    var select = e.target.closest('select[data-act="status"]');
    if (!select) return;
    var id = select.closest(".order-card").getAttribute("data-id");
    var status = select.value;
    showNotice("");

    api("/api/orders/" + encodeURIComponent(id), { method: "PATCH", body: { status: status } })
      .then(function () {
        orders.forEach(function (o) {
          if (o._id === id) o.status = status;
        });
        renderOrders();
      })
      .catch(function (err) {
        showNotice(err.message, "error");
        renderOrders();
      });
  });

  /* ---------- start: are we already signed in? ---------- */

  loadAll()
    .then(showDashboard)
    .catch(function (err) {
      if (err.status === 401) {
        showLogin();
      } else {
        show(el.loading, false);
        el.loading.textContent = "";
        show(el.login, true);
        el.loginError.innerHTML = '<div class="error">' + esc(err.message) + "</div>";
      }
    });
});
