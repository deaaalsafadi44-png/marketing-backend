const deliverablesService = require("../services/deliverables.service");
const uploadToCloudinary = require("../utils/cloudinaryUpload");

/*
  GET /deliverables
  Returns all deliverables (for boxes page)
*/
const getAllDeliverables = async (req, res) => {
  try {
    const data = await deliverablesService.getAllDeliverables();
    res.json(data);
  } catch (error) {
    console.error("Get deliverables error:", error);
    res.status(500).json({ message: "Failed to load deliverables" });
  }
};

/*
  POST /deliverables
  Create deliverable with uploaded files
*/
const createDeliverable = async (req, res) => {
  try {
    const { taskId, notes } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    let uploadedFiles = [];

    // ✅ إذا كان هناك ملفات مرفوعة
    if (req.files && req.files.length > 0) {
      uploadedFiles = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file))
      );
    }

    const deliverable = await deliverablesService.createDeliverable({
      taskId: Number(taskId),
      submittedById: Number(req.user.id),
      submittedByName: req.user.name,
      notes,
      files: uploadedFiles, // ✅ حفظ الملفات فعليًا
    });

    res.json(deliverable);
  } catch (error) {
    console.error("Create deliverable error:", error);
    res.status(500).json({ message: "Failed to create deliverable" });
  }
};

module.exports = {
  getAllDeliverables,
  createDeliverable,
};
