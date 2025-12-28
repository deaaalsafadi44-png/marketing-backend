const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const optionsController = require("../controllers/options.controller");

const router = express.Router();

/* =========================
   GET OPTIONS
   GET /options
========================= */
router.get(
  "/",
  authenticateToken,
  optionsController.getOptions
);

/* =========================
   SAVE OPTIONS
   PUT /options
========================= */
router.put(
  "/",
  authenticateToken,
authorize(["Admin", "Manager"]),
  optionsController.saveOptions
  
);

module.exports = router;
