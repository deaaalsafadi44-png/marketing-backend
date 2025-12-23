const express = require("express");
const {
  login,
  refreshToken,
  logout,
  getMe,
} = require("../controllers/auth.controller");

const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

/* =========================
   LOGIN
   POST /auth/login
========================= */
router.post("/login", login);

/* =========================
   REFRESH TOKEN
   POST /auth/refresh
========================= */
router.post("/refresh", refreshToken);

/* =========================
   LOGOUT
   POST /auth/logout
========================= */
router.post("/logout", logout);

/* =========================
   AUTH CHECK
   GET /auth/me
========================= */
router.get("/me", authenticateToken, getMe);

module.exports = router;
