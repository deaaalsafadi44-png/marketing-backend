const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

const ACCESS_SECRET = "ACCESS_SECRET_KEY_123";
const REFRESH_SECRET = "REFRESH_SECRET_KEY_456";

const generateAccessToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      dept: user.dept,
    },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );

const generateRefreshToken = (user) =>
  jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: "7d" });

/* =========================
   LOGIN
   ========================= */
router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(req.body.password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    accessToken: generateAccessToken(user),
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept: user.dept,
    },
  });
});

module.exports = router;
