const express = require("express");
const authController = require("../controllers/auth.controller");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

/* =========================
   LOGIN
========================= */
router.post("/login", authController.login);

/* =========================
   REFRESH TOKEN
========================= */
router.post("/refresh", authController.refreshToken);

/* =========================
   LOGOUT (HttpOnly Cookies)
========================= */
router.post("/logout", authController.logout);

/* =========================
   AUTH CHECK (HttpOnly)
   GET /auth/me
========================= */
router.get("/auth/me", authenticateToken, (req, res) => {
  res.json({
    user: req.user,
  });
});

module.exports = router;
