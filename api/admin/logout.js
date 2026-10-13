const { buildCookie } = require("../../lib/auth");
const { send, methodNotAllowed } = require("../../lib/http");

module.exports = async (req, res) => {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  res.setHeader("Set-Cookie", buildCookie(req, "", 0));
  return send(res, 200, { ok: true });
};
