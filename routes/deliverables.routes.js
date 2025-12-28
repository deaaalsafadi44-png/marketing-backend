const express = require("express");
const deliverablesController = require("../controllers/deliverables.controller");
const authenticateToken = require("../middlewares/authenticateToken");
const upload = require("../middlewares/upload"); 

const router = express.Router();

/* =========================
   🆕 GET SUBMISSIONS (GROUPED BY TASK)
   GET /deliverables/submissions
========================= */
router.get(
  "/submissions",
  authenticateToken,
  deliverablesController.getSubmissionsSummary
);

/* =========================
   ⭐ RATE DELIVERABLE (ADMIN / MANAGER)
   POST /deliverables/:deliverableId/rate
========================= */
router.post(
  "/:deliverableId/rate",
  authenticateToken,
  deliverablesController.rateDeliverable
);

/* =========================
   🗑️ DELETE ENTIRE DELIVERABLE (كود التنظيف الذكي يستخدم هذا المسار)
   DELETE /deliverables/:deliverableId
========================= */
router.delete(
  "/:deliverableId",
  authenticateToken,
  deliverablesController.deleteDeliverable
);

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
  upload.array("files"),
  deliverablesController.createDeliverable
);

/* =========================
   DELETE FILE FROM DELIVERABLE
   DELETE /deliverables/:deliverableId/files/:fileId
========================= */
router.delete(
  "/:deliverableId/files/:fileId",
  authenticateToken,
  deliverablesController.deleteFileFromDeliverable
);

module.exports = router;