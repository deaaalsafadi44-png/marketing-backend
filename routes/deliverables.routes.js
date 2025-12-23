const express = require("express");
const deliverablesController = require("../controllers/deliverables.controller");
const authenticateToken = require("../middlewares/authenticateToken");
const upload = require("../middlewares/upload"); // ✅ موجود كما هو

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
   🆕 GET SUBMISSIONS (GROUPED BY TASK)
   GET /deliverables/submissions
========================= */
router.get(
  "/submissions",
  authenticateToken,
  deliverablesController.getSubmissionsGroupedByTask
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
   DELETE FILE FROM DELIVERABLE ✅ (NEW)
   DELETE /deliverables/:deliverableId/files/:fileId
========================= */
router.delete(
  "/:deliverableId/files/:fileId",
  authenticateToken,
  deliverablesController.deleteFileFromDeliverable
);

module.exports = router;
