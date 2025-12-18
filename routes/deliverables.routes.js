const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const deliverablesController = require("../controllers/deliverables.controller");
const upload = require("../middlewares/upload");

const router = express.Router();

/**
 * GET /deliverables
 * Used by Submissions page
 */
router.get(
  "/",
  authenticateToken,
  deliverablesController.getAllDeliverables
);

/**
 * POST /deliverables
 * Submit task deliverables
 */
router.post(
  "/",
  authenticateToken,
  upload.array("files", 10),
  (req, res, next) => {
    console.log("🚀 POST /deliverables HIT");
    console.log("📦 req.body:", req.body);
    console.log("📁 req.files:", req.files);
    next();
  },
  deliverablesController.createDeliverable
);

module.exports = router;
