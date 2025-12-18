const deliverablesService = require("../services/deliverables.service");
const uploadToCloudinary = require("../utils/cloudinaryUpload");

exports.getAllDeliverables = async (req, res) => {
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
    console.log("FILES LENGTH:", req.files?.length || 0);
    console.log("USER:", req.user);
    console.log("====================================");

    const { taskId, notes } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    // ✅ 1) Upload files to Cloudinary
    let uploadedFiles = [];

    if (req.files && req.files.length > 0) {
      const results = await Promise.all(
        req.files.map(async (file) => {
          // uploadToCloudinary لازم يدعم buffer
          const uploadRes = await uploadToCloudinary(file);

          return {
            url: uploadRes.secure_url || uploadRes.url,
            publicId: uploadRes.public_id,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          };
        })
      );

      uploadedFiles = results;
    }

    // ✅ 2) Save deliverable with files
    const newDeliverable = await deliverablesService.createDeliverable({
      taskId: String(taskId),
      notes: notes || "",
      submittedById: req.user.id,
      submittedByName: req.user.name || req.user.username || "Unknown",
      files: uploadedFiles,
    });

    res.status(201).json(newDeliverable);
  } catch (err) {
    console.error("CREATE DELIVERABLE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
