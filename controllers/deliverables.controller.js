const deliverablesService = require("../services/deliverables.service");
const uploadToCloudinary = require("../utils/cloudinaryUpload"); // ✅ ADDED

/*
  GET /deliverables
  Returns all deliverables (for boxes page later)
*/
const getAllDeliverables = async (req, res) => {
  try {
    const data = await deliverablesService.getAllDeliverables();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to load deliverables" });
  }
};

/*
  POST /deliverables
  Create deliverable (with optional files)
*/
const createDeliverable = async (req, res) => {
  try {
    const { taskId, notes } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    let uploadedFiles = [];

    // ✅ If files are sent, upload them to Cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadToCloudinary(file);
        uploadedFiles.push(uploaded);
      }
    }

    const deliverable = await deliverablesService.createDeliverable({
      taskId,
      submittedById: req.user.id,
      submittedByName: req.user.name,
      notes,
      files: uploadedFiles, // ✅ ADDED
    });

    res.json(deliverable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create deliverable" });
  }
};

module.exports = {
  getAllDeliverables,
  createDeliverable,
};
