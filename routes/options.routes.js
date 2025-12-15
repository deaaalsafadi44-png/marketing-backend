const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const optionsController = require("../controllers/options.controller");

const router = express.Router();

/* =========================
   GET OPTIONS
   ========================= */
router.get(
  "/options",
  authenticateToken,
  optionsController.getOptions
);

/* =========================
   SAVE OPTIONS
   ========================= */
router.put(
  "/options",
  authenticateToken,
  authorize(["Admin"]),
  optionsController.saveOptions
);

module.exports = router;
