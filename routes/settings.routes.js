const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const settingsController = require("../controllers/settings.controller");

const router = express.Router();

/* =========================
   GET SETTINGS
   تعديل: السماح للأدمن والمانجر بالجلب
========================= */
router.get(
  "/",
  authenticateToken,
  authorize(["Admin", "Manager"]), // ✅ أضفنا Manager هنا
  settingsController.getSettings
);

/* =========================
   SAVE SETTINGS
   تعديل: السماح للأدمن والمانجر بالحفظ
========================= */
router.put(
  "/",
  authenticateToken,
  authorize(["Admin", "Manager"]), // ✅ أضفنا Manager هنا
  settingsController.saveSettings
);

module.exports = router;