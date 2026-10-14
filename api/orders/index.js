const { ObjectId } = require("mongodb");
const { getDb } = require("../../lib/db");
const { isAdmin } = require("../../lib/auth");
const { send, methodNotAllowed, getBody, isObjectIdString } = require("../../lib/http");

module.exports = async (req, res) => {
  try {
    // Admin only: list orders
    if (req.method === "GET") {
      if (!isAdmin(req)) return send(res, 401, { error: "Unauthorized" });
      const db = await getDb();
      const orders = await db.collection("orders").find().sort({ createdAt: -1 }).toArray();
      return send(
        res,
        200,
        orders.map((o) => ({ ...o, _id: o._id.toString(), items: (o.items || []).map((i) => ({ ...i, productId: String(i.productId) })) }))
      );
    }

    // Public: place an order (cash on delivery)
    if (req.method === "POST") {
      const body = getBody(req);
      const customer = body.customer || {};
      const name = String(customer.name || "").trim().slice(0, 120);
      const phone = String(customer.phone || "").trim().slice(0, 40);
      const address = String(customer.address || "").trim().slice(0, 600);
      const rawItems = Array.isArray(body.items) ? body.items : [];

      if (!name || !phone || !address) {
        return send(res, 400, { error: "Name, phone number and address are required" });
      }
      if (rawItems.length === 0) return send(res, 400, { error: "Your order is empty" });
      if (rawItems.length > 50) return send(res, 400, { error: "Too many items in one order" });

      // Merge duplicates and validate quantities
      const qtyById = new Map();
      for (const it of rawItems) {
        const id = String((it && it.productId) || "");
        const qty = Math.floor(Number(it && it.quantity));
        if (!isObjectIdString(id) || !Number.isFinite(qty) || qty < 1 || qty > 100) {
          return send(res, 400, { error: "Invalid item in order" });
        }
        qtyById.set(id, (qtyById.get(id) || 0) + qty);
      }

      const db = await getDb();

      // Prices always come from the database, never from the browser
      const products = await db
        .collection("products")
        .find({ _id: { $in: [...qtyById.keys()].map((id) => new ObjectId(id)) } }, { projection: { images: 0 } })
        .toArray();

      if (products.length !== qtyById.size) {
        return send(res, 400, { error: "Some products in your cart are no longer available. Please refresh your cart." });
      }

      const items = products.map((p) => ({
        productId: p._id,
        name: p.name,
        price: p.price,
        currency: p.currency,
        quantity: qtyById.get(p._id.toString()),
      }));

      const totalsMap = new Map();
      for (const i of items) {
        totalsMap.set(i.currency, (totalsMap.get(i.currency) || 0) + i.price * i.quantity);
      }
      const totals = [...totalsMap.entries()].map(([currency, amount]) => ({ currency, amount }));

      const result = await db.collection("orders").insertOne({
        customer: { name, phone, address },
        items,
        totals,
        paymentMethod: "COD",
        status: "pending",
        createdAt: new Date(),
      });

      return send(res, 201, { ok: true, orderId: result.insertedId.toString() });
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    console.error("orders error:", err);
    return send(res, 500, { error: "Server error. Please try again." });
  }
};
