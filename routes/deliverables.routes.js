const express = require("express");
const deliverablesController = require("../controllers/deliverables.controller");
const authenticateToken = require("../middlewares/authenticateToken");

// ✅ إذا عندك multer middleware استورده هنا
// مثال (عدّل حسب مشروعك):
// const upload = require("../middlewares/upload"); 
// أو: const upload = require("../config/multer");

const router = express.Router();

/* =========================
   GET ALL DELIVERABLES
   GET /deliverables?taskId=...
========================= */
router.get("/", authenticateToken, deliverablesController.getAllDeliverables);

/* =========================
   CREATE DELIVERABLE
   POST /deliverables
========================= */
// ✅ ضع middleware الرفع الموجود عندك بدل التعليق
// router.post("/", authenticateToken, upload.array("files"), deliverablesController.createDeliverable);

router.post("/", authenticateToken, deliverablesController.createDeliverable);

module.exports = router;
