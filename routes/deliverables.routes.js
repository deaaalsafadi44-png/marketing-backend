const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const deliverablesController = require("../controllers/deliverables.controller");

const router = express.Router();

// ✅ GET /deliverables
router.get(
  "/",
  authenticateToken,
  deliverablesController.getAllDeliverables
);

// ✅ POST /deliverables
router.post(
  "/",
  authenticateToken,
  deliverablesController.createDeliverable
);

module.exports = router;
