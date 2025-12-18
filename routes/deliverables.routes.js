const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authenticateToken");
const upload = require("../middlewares/upload");

const deliverablesController = require(
  "../controllers/deliverables.controller"
);

/*
  GET /deliverables
*/
router.get(
  "/",
  authenticateToken,
  deliverablesController.getAllDeliverables
);

/*
  POST /deliverables
*/
router.post(
  "/",
  authenticateToken,
  upload.array("files", 10),
  deliverablesController.createDeliverable
);

module.exports = router;
