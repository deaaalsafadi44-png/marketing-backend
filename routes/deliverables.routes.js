const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const deliverablesController = require("../controllers/deliverables.controller");
const upload = require("../middlewares/upload"); // ✅ ADDED

const router = express.Router();

/*
  Deliverables Routes
  This file handles task submissions (deliverables)
  Upload logic will be added later step-by-step
*/

/*
  GET /deliverables
  Used for the page that shows boxes of submitted tasks
*/
router.get(
  "/",
  authenticateToken,
  deliverablesController.getAllDeliverables
);

/*
  POST /deliverables
  Will be used later to submit task files
*/
router.post(
  "/",
  authenticateToken,
  upload.array("files", 10), // ✅ ADDED (max 10 files)
  deliverablesController.createDeliverable
);

module.exports = router;
