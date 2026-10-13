const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const COOKIE_NAME = "admin_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is missing or too short");
  }
  return secret;
}

function digest(value) {
  return crypto.createHash("sha256").update(String(value)).digest();
}

// Constant-time comparison (hashing first makes both sides the same length)
function safeEqual(a, b) {
  return crypto.timingSafeEqual(digest(a), digest(b));
}

function checkCredentials(email, password) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return false;
  const emailOk = safeEqual(String(email || "").trim().toLowerCase(), adminEmail.trim().toLowerCase());
  const passOk = safeEqual(String(password || ""), adminPassword);
  return emailOk && passOk;
}

function createToken() {
  return jwt.sign({ role: "admin" }, getSecret(), { expiresIn: "7d" });
}

function parseCookies(header) {
  const out = {};
  String(header || "")
    .split(";")
    .forEach((part) => {
      const i = part.indexOf("=");
      if (i < 0) return;
      out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    });
  return out;
}

function isAdmin(req) {
  try {
    const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
    if (!token) return false;
    const payload = jwt.verify(token, getSecret());
    return payload && payload.role === "admin";
  } catch (err) {
    return false;
  }
}

function buildCookie(req, token, maxAge) {
  const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

module.exports = { COOKIE_NAME, MAX_AGE, checkCredentials, createToken, isAdmin, buildCookie };
