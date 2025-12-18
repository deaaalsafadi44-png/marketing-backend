const express = require("express");
const router = express.Router();

const {
  getAllDeliverables,
  createDeliverable,
} = require("../controllers/deliverables.controller");

const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload"); // multer

router.get("/", auth, getAllDeliverables);

router.post(
  "/",
  auth,
  upload.array("files"), // ⚠️ مهم جدًا
  createDeliverable
);

module.exports = router;
