const jwt = require("jsonwebtoken");

const ACCESS_SECRET =
  process.env.ACCESS_SECRET || "ACCESS_SECRET_KEY_123";

module.exports = function authenticateToken(req, res, next) {
  let token = null;

  /* =========================
     1️⃣ Try Cookie (HttpOnly)
  ========================= */
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  /* =========================
     2️⃣ Fallback: Authorization Header
  ========================= */
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  /* =========================
     3️⃣ No Token
  ========================= */
  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  /* =========================
     4️⃣ Verify Token
  ========================= */
  jwt.verify(token, ACCESS_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = user;
    next();
  });
};
