const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const settingsController = require("../controllers/settings.controller");

const router = express.Router();

/* =============================================
   GET SETTINGS
   يسمح للجميع (Admin, Manager, User) بالجلب 
   لكي يظهر اسم المشروع الموحد عند الكل
   ============================================= */
router.get(
  "/",
  authenticateToken,
  // ✅ أزلنا authorize هنا لنسمح لكل من يحمل Token برؤية الاسم
  settingsController.getSettings
);

/* =============================================
   SAVE SETTINGS
   التعديل يبقى حصراً للأدمن والمانجر
   ============================================= */
router.put(
  "/",
  authenticateToken,
  authorize(["Admin", "Manager"]), 
  settingsController.saveSettings
);

module.exports = router;