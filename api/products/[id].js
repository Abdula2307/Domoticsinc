const { ObjectId } = require("mongodb");
const { getDb } = require("../../lib/db");
const { isAdmin } = require("../../lib/auth");
const { send, methodNotAllowed, isObjectIdString } = require("../../lib/http");

module.exports = async (req, res) => {
  const id = req.query && req.query.id;

  try {
    if (!isObjectIdString(id)) return send(res, 404, { error: "Not found" });

    // Public: one product
    if (req.method === "GET") {
      const db = await getDb();
      const p = await db
        .collection("products")
        .findOne({ _id: new ObjectId(id) }, { projection: { images: 0 } });
      if (!p) return send(res, 404, { error: "Not found" });
      return send(res, 200, {
        _id: p._id.toString(),
        name: p.name,
        price: p.price,
        currency: p.currency,
        description: p.description || "",
        imageCount: p.imageCount || 0,
      });
    }

    // Admin only: delete a product
    if (req.method === "DELETE") {
      if (!isAdmin(req)) return send(res, 401, { error: "Unauthorized" });
      const db = await getDb();
      await db.collection("products").deleteOne({ _id: new ObjectId(id) });
      return send(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ["GET", "DELETE"]);
  } catch (err) {
    console.error("product error:", err);
    return send(res, 500, { error: "Server error" });
  }
};
