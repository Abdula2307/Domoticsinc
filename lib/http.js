function send(res, status, data) {
  res.status(status).json(data);
}

function methodNotAllowed(res, allowed) {
  res.setHeader("Allow", allowed.join(", "));
  send(res, 405, { error: "Method not allowed" });
}

function getBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === "string") {
    try {
      return JSON.parse(b);
    } catch (err) {
      return {};
    }
  }
  return b;
}

function isObjectIdString(id) {
  return typeof id === "string" && /^[a-f0-9]{24}$/i.test(id);
}

module.exports = { send, methodNotAllowed, getBody, isObjectIdString };
