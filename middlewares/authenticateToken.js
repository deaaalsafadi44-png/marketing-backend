const jwt = require("jsonwebtoken");
const ACCESS_SECRET = "ACCESS_SECRET_KEY_123";

module.exports = function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Missing token" });

  const token = header.split(" ")[1];
  jwt.verify(token, ACCESS_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: "Expired token" });
    req.user = user;
    next();
  });
};
