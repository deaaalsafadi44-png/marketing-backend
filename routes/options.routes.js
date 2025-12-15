const express = require("express");
const Options = require("../models/Options");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");

const router = express.Router();

/* =========================
   GET OPTIONS
   ========================= */
router.get("/options", authenticateToken, async (req, res) => {
  res.json(
    (await Options.findOne({}, { _id: 0 })) || {
      priority: [],
      status: [],
      companies: [],
    }
  );
});

/* =========================
   SAVE OPTIONS
   ========================= */
router.put(
  "/options",
  authenticateToken,
  authorize(["Admin"]),
  async (req, res) => {
    await Options.deleteMany({});
    await Options.create(req.body);
    res.json({ message: "Options saved" });
  }
);

module.exports = router;
