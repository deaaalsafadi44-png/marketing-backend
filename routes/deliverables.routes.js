const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ ok: true, message: "deliverables route works" });
});

module.exports = router;
