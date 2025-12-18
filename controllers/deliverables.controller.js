const deliverablesService = require("../services/deliverables.service");
const uploadToCloudinary = require("../utils/cloudinaryUpload"); // موجود بس لن نستخدمه الآن

const getAllDeliverables = async (req, res) => {
  try {
    const data = await deliverablesService.getAllDeliverables();
    res.json(data);
  } catch (error) {
    console.error("Get deliverables error:", error);
    res.status(500).json({ message: "Failed to load deliverables" });
  }
};

const createDeliverable = async (req, res) => {
  try {
    console.log("---- DEBUG /deliverables ----");
    console.log("body:", req.body);
    console.log("user:", req.user?.id, req.user?.name);
    console.log("files exists?", !!req.files);
    console.log("files length:", req.files?.length);

    return res.json({
      ok: true,
      body: req.body,
      user: req.user ? { id: req.user.id, name: req.user.name } : null,
      filesCount: req.files?.length || 0,
      file0: req.files?.[0]
        ? {
            originalname: req.files[0].originalname,
            mimetype: req.files[0].mimetype,
            size: req.files[0].size,
          }
        : null,
    });
  } catch (error) {
    console.error("DEBUG ERROR:", error);
    return res.status(500).json({
      message: "debug failed",
      error: error?.message || "Unknown error",
    });
  }
};

module.exports = {
  getAllDeliverables,
  createDeliverable,
};
