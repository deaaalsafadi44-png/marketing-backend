const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authenticateToken");
const deliverablesController = require("../controllers/deliverables.controller");
const upload = require("../middlewares/upload");

/*
  Deliverables Routes
*/

// GET /deliverables
router.get(
  "/",
  authenticateToken,
  deliverablesController.getAllDeliverables
);

// POST /deliverables
router.post(
  "/",
  authenticateToken,
  upload.array("files", 10), // max 10 files
  deliverablesController.createDeliverable
);

module.exports = router;
