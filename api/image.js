const { ObjectId } = require("mongodb");
const { getDb } = require("../lib/db");
const { isObjectIdString } = require("../lib/http");

// Serves one product photo:  /api/image?id=<productId>&i=<0-3>
module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  try {
    const id = req.query && req.query.id;
    const i = parseInt((req.query && req.query.i) || "0", 10);
    if (!isObjectIdString(id) || !Number.isInteger(i) || i < 0 || i > 3) {
      return res.status(404).end();
    }

    const db = await getDb();
    const product = await db
      .collection("products")
      .findOne({ _id: new ObjectId(id) }, { projection: { images: 1 } });

    const data = product && product.images && product.images[i];
    const match = typeof data === "string" ? /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(data) : null;
    if (!match) return res.status(404).end();

    res.setHeader("Content-Type", match[1]);
    // A photo never changes once saved, so browsers and Vercel can keep it for a year
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.status(200).send(Buffer.from(match[2], "base64"));
  } catch (err) {
    console.error("image error:", err);
    return res.status(500).end();
  }
};
