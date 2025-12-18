console.log("GET ALL DELIVERABLES HIT");

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

exports.createDeliverable = async (req, res) => {
  try {
    console.log("========== NEW DELIVERABLE ==========");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    console.log("====================================");

    const { taskId, notes } = req.body;

    if (!taskId) {
      console.log("❌ taskId MISSING");
      return res.status(400).json({ message: "taskId is required" });
    }

    // لا تغيّر أي منطق آخر الآن
    // فقط دعنا نرى ماذا يصل

    res.status(200).json({
      message: "Debug mode – check server logs",
    });
  } catch (err) {
    console.error("CREATE DELIVERABLE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  getAllDeliverables,
  createDeliverable,
};
