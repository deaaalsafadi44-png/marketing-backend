const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadToCloudinary = require("../utils/cloudinaryUpload");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/cloudinary-test", upload.single("file"), async (req, res) => {
  console.log("☁️ CLOUDINARY TEST ROUTE HIT");

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file received" });
    }

    const result = await uploadToCloudinary(req.file);

    res.json({
      ok: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("❌ CLOUDINARY TEST ERROR:", err);
    res.status(500).json({
      ok: false,
      error: err.message || err,
    });
  }
});

module.exports = router;
