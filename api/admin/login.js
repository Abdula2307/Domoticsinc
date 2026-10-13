const { checkCredentials, createToken, buildCookie, MAX_AGE } = require("../../lib/auth");
const { send, methodNotAllowed, getBody } = require("../../lib/http");

module.exports = async (req, res) => {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    const { email, password } = getBody(req);

    // small delay slows down password guessing
    await new Promise((r) => setTimeout(r, 400));

    if (!checkCredentials(email, password)) {
      return send(res, 401, { error: "Wrong email or password" });
    }

    res.setHeader("Set-Cookie", buildCookie(req, createToken(), MAX_AGE));
    return send(res, 200, { ok: true });
  } catch (err) {
    console.error("login error:", err);
    return send(res, 500, { error: "Server is not set up correctly. Check ADMIN_EMAIL, ADMIN_PASSWORD and JWT_SECRET." });
  }
};
