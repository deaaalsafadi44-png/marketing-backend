const express = require("express");
const authController = require("../controllers/auth.controller");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

/* =========================
   LOGIN
   POST /auth/login
========================= */
router.post("/login", authController.login);

/* =========================
   REFRESH TOKEN
   POST /auth/refresh
========================= */
router.post("/refresh", authController.refreshToken);

/* =========================
   LOGOUT
   POST /auth/logout
========================= */
router.post("/logout", authController.logout);

/* =========================
   AUTH CHECK
   GET /auth/me
========================= */
router.get("/me", authenticateToken, (req, res) => {
  res.json({
    user: req.user,
  });
});
/* =========================
   SUBSCRIBE TO PUSH
   POST /auth/subscribe
========================= */
router.post("/subscribe", authenticateToken, authController.subscribe);
module.exports = router; // 🔥 هذا هو الحل
