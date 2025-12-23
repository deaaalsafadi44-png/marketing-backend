const express = require("express");
const deliverablesController = require("../controllers/deliverables.controller");
const authenticateToken = require("../middlewares/authenticateToken");
const upload = require("../middlewares/upload"); // ✅ هذا السطر كان ناقصًا أو غير موجود

const router = express.Router();

/* =========================
   GET ALL DELIVERABLES
   GET /deliverables?taskId=...
========================= */
router.get(
  "/",
  authenticateToken,
  deliverablesController.getAllDeliverables
);

/* =========================
   CREATE DELIVERABLE
   POST /deliverables
========================= */
router.post(
  "/",
  authenticateToken,
  upload.array("files"), // ✅ الآن upload مُعرّف
  deliverablesController.createDeliverable
);

module.exports = router;
