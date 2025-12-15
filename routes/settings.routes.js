const express = require("express");
const SystemSettings = require("../models/SystemSettings");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");

const router = express.Router();

/* =========================
   GET SETTINGS
   ========================= */
router.get(
  "/settings",
  authenticateToken,
  authorize(["Admin"]),
  async (req, res) => {
    res.json((await SystemSettings.findOne({}, { _id: 0 })) || {});
  }
);

/* =========================
   SAVE SETTINGS
   ========================= */
router.put(
  "/settings",
  authenticateToken,
  authorize(["Admin"]),
  async (req, res) => {
    try {
      await SystemSettings.findOneAndUpdate({}, req.body, {
        upsert: true,
        new: true,
      });
      res.json({ message: "Settings saved successfully" });
    } catch (err) {
      console.error("Save settings error:", err);
      res.status(500).json({ message: "Failed to save settings" });
    }
  }
);

module.exports = router;
