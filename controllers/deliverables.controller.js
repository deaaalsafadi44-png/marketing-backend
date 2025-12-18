const deliverablesService = require("../services/deliverables.service");
const uploadToCloudinary = require("../utils/cloudinaryUpload");

const createDeliverable = async (req, res) => {
  try {
    const { taskId, notes } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    let uploadedFiles = [];

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
      files: uploadedFiles,
    });

    res.json(deliverable);
  } catch (error) {
    console.error("Create deliverable error:", error);
    res.status(500).json({
      message: "Failed to create deliverable",
      error: error.message,
    });
  }
};

module.exports = {
  createDeliverable,
};
