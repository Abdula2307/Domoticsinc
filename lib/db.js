const { MongoClient } = require("mongodb");

// Reuse the connection between requests (important on Vercel serverless)
let cached = global.__domoticsMongo;
if (!cached) cached = global.__domoticsMongo = { promise: null };

async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  if (!cached.promise) {
    const client = new MongoClient(uri, { maxPoolSize: 5 });
    cached.promise = client.connect().catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  const client = await cached.promise;
  return client.db(process.env.MONGODB_DB || undefined);
}

module.exports = { getDb };
