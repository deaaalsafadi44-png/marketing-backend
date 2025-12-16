const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const reportsController = require("../reports/reports.controller");

const router = express.Router();

/* =========================
   REPORTS SUMMARY
   =========================
   GET /reports/summary
*/
router.get(
  "/reports/summary",
  authenticateToken,
  authorize(["Admin", "Manager"]), // ✅ التعديل هنا
  reportsController.getSummaryReport
);

module.exports = router;
