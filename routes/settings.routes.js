const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const settingsController = require("../controllers/settings.controller");

const router = express.Router();

/* =========================
   GET SETTINGS
   ========================= */
router.get(
  "/settings",
  authenticateToken,
  authorize(["Admin"]),
  settingsController.getSettings
);

/* =========================
   SAVE SETTINGS
   ========================= */
router.put(
  "/settings",
  authenticateToken,
  authorize(["Admin"]),
  settingsController.saveSettings
);

module.exports = router;
