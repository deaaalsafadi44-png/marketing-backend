const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const settingsController = require("../controllers/settings.controller");

const router = express.Router();

/* =========================
   GET SETTINGS
   GET /settings
========================= */
router.get(
  "/",
  authenticateToken,
  authorize(["Admin"]),
  settingsController.getSettings
);

/* =========================
   SAVE SETTINGS
   PUT /settings
========================= */
router.put(
  "/",
  authenticateToken,
  authorize(["Admin"]),
  settingsController.saveSettings
);

module.exports = router;
