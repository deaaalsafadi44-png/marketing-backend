const deliverablesService = require("../services/deliverables.service");
const uploadToCloudinary = require("../utils/cloudinaryUpload");

/*
  GET /deliverables
  Returns all deliverables (for submissions page)
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
  Create deliverable + upload files to Cloudinary + save in DB
*/
const createDeliverable = async (req, res) => {
  try {
    const { taskId, notes } = req.body;

    // 🔴 validation
    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ upload files to Cloudinary (if any)
    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadToCloudinary(file);
        uploadedFiles.push(uploaded);
      }
    }

    // ✅ save deliverable in DB
    const deliverable = await deliverablesService.createDeliverable({
      taskId: Number(taskId),
      submittedById: Number(req.user.id),
      submittedByName: req.user.name,
      notes: notes || "",
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
  getAllDeliverables,
  createDeliverable,
};
