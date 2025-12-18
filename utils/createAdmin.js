const deliverablesService = require("../services/deliverables.service");
const cloudinary = require("../utils/cloudinary");

exports.createDeliverable = async (req, res) => {
  try {
    const { taskId, notes } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    const uploadedFiles = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "task-deliverables",
        });

        uploadedFiles.push({
          url: result.secure_url,
          originalName: file.originalname,
          publicId: result.public_id,
        });
      }
    }

    const deliverable = await deliverablesService.createDeliverable({
      taskId: Number(taskId),
      notes: notes || "",
      submittedById: req.user.id,
      submittedByName:
        req.user.name || req.user.username || "Unknown",
      files: uploadedFiles, // ✅ هنا الإصلاح
    });

    res.status(201).json(deliverable);
  } catch (err) {
    console.error("CREATE DELIVERABLE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
