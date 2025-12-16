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
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  /* =========================
     3️⃣ No Token
  ========================= */
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized - no access token",
    });
  }

  /* =========================
     4️⃣ Verify Token
  ========================= */
  jwt.verify(token, ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        message: "Unauthorized - token expired or invalid",
      });
    }

    // 🔐 مهم: نخزن البيانات المفكوكة
    req.user = decoded;
    next();
  });
};
