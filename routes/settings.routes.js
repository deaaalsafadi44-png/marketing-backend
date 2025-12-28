const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const settingsController = require("../controllers/settings.controller");

const router = express.Router();

/* =========================
   GET SETTINGS
   يسمح لجميع الأدوار بالرؤية حتى يتوحد اسم المشروع عند الكل
========================= */
router.get(
  "/",
  authenticateToken,
  // تمت إزالة authorize(["Admin"]) هنا للسماح للكل بالرؤية
  settingsController.getSettings
);

/* =========================
   SAVE SETTINGS
   يسمح فقط للأدمن بالتعديل
========================= */
router.put(
  "/",
  authenticateToken,
  authorize(["Admin"]), // يبقى التعديل محصوراً بالأدمن فقط للأمان
  settingsController.saveSettings
);

module.exports = router;