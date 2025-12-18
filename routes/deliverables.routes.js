const express = require("express");
const router = express.Router();

const {
  getAllDeliverables,
  createDeliverable,
} = require("../controllers/deliverables.controller");

// ❌ احذف أو علّق auth
// const auth = require("../middlewares/auth");

router.get("/", getAllDeliverables);
router.post("/", createDeliverable);

module.exports = router;
