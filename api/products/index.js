const { getDb } = require("../../lib/db");
const { isAdmin } = require("../../lib/auth");
const { send, methodNotAllowed, getBody } = require("../../lib/http");

function publicProduct(p) {
  return {
    _id: p._id.toString(),
    name: p.name,
    price: p.price,
    currency: p.currency,
    description: p.description || "",
  };
}

module.exports = async (req, res) => {
  try {
    // Public: list products
    if (req.method === "GET") {
      const db = await getDb();
      const products = await db.collection("products").find().sort({ createdAt: -1 }).toArray();
      return send(res, 200, products.map(publicProduct));
    }

    // Admin only: add a product
    if (req.method === "POST") {
      if (!isAdmin(req)) return send(res, 401, { error: "Unauthorized" });

      const body = getBody(req);
      const name = String(body.name || "").trim().slice(0, 200);
      const currency = String(body.currency || "").trim().toUpperCase().slice(0, 8);
      const description = String(body.description || "").trim().slice(0, 5000);
      const price = Number(body.price);

      if (!name) return send(res, 400, { error: "Product name is required" });
      if (!currency) return send(res, 400, { error: "Currency is required" });
      if (!Number.isFinite(price) || price < 0) return send(res, 400, { error: "Enter a valid price" });

      const db = await getDb();
      const doc = { name, price, currency, description, createdAt: new Date() };
      const result = await db.collection("products").insertOne(doc);
      return send(res, 201, publicProduct({ ...doc, _id: result.insertedId }));
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    console.error("products error:", err);
    return send(res, 500, { error: "Server error. Check your MONGODB_URI and the Vercel function logs." });
  }
};
