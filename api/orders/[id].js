const { ObjectId } = require("mongodb");
const { getDb } = require("../../lib/db");
const { isAdmin } = require("../../lib/auth");
const { send, methodNotAllowed, getBody, isObjectIdString } = require("../../lib/http");

const STATUSES = ["pending", "confirmed", "delivered", "cancelled"];

module.exports = async (req, res) => {
  const id = req.query && req.query.id;

  try {
    // Everything here is admin only
    if (!isAdmin(req)) return send(res, 401, { error: "Unauthorized" });
    if (!isObjectIdString(id)) return send(res, 404, { error: "Not found" });

    // Change order status
    if (req.method === "PATCH") {
      const { status } = getBody(req);
      if (!STATUSES.includes(status)) return send(res, 400, { error: "Invalid status" });
      const db = await getDb();
      await db.collection("orders").updateOne({ _id: new ObjectId(id) }, { $set: { status } });
      return send(res, 200, { ok: true });
    }

    // Delete an order
    if (req.method === "DELETE") {
      const db = await getDb();
      await db.collection("orders").deleteOne({ _id: new ObjectId(id) });
      return send(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ["PATCH", "DELETE"]);
  } catch (err) {
    console.error("order error:", err);
    return send(res, 500, { error: "Server error" });
  }
};
