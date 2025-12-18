const express = require("express");
const router = express.Router();

/**
 * TEST ROUTE (NO AUTH, NO UPLOAD, NO CONTROLLER)
 */
router.post("/", (req, res) => {
  return res.json({
    ok: true,
    message: "DELIVERABLES ROUTE WORKS",
  });
});

module.exports = router;
