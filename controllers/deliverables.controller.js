const deliverablesService = require("../services/deliverables.service");
const uploadToCloudinary = require("../utils/cloudinaryUpload");

exports.getAllDeliverables = async (req, res) => {
  try {
    // ✅ قراءة taskId من query
    const { taskId } = req.query;

    const data = await deliverablesService.getAllDeliverables(taskId);
    res.json(data);
  } catch (error) {
    console.error("Get deliverables error:", error);
    res.status(500).json({ message: "Failed to load deliverables" });
  }
};

exports.createDeliverable = async (req, res) => {
  let deliverable;

  try {
    console.log("========== NEW DELIVERABLE ==========");
    console.log("BODY:", req.body);
    console.log("FILES COUNT:", req.files?.length || 0);
    console.log("USER:", req.user);
    console.log("====================================");

    const { taskId, notes } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    // ✅ 1) احفظ التسليم فورًا (بدون ملفات)
    deliverable = await deliverablesService.createDeliverable({
      taskId: String(taskId),
      notes: notes || "",
      submittedById: req.user.id,
      submittedByName: req.user.name || req.user.username || "Unknown",
      files: [],
    });

    // 🧪 LOG 4: ما الذي عاد من السيرفس
    console.log("🧪 [CONTROLLER] deliverable =", deliverable);
    console.log("🧪 [CONTROLLER] deliverable._id =", deliverable?._id);

    // ✅ رد فوري للواجهة (لا ننتظر Cloudinary)
    res.status(201).json(deliverable);
  } catch (err) {
    console.error("CREATE DELIVERABLE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }

  // ===============================
  // 🟡 المرحلة الثانية (غير مدمِّرة)
  // ===============================
  try {
    if (req.files && req.files.length > 0) {
      const uploadedFiles = await Promise.all(
        req.files.map(async (file) => {
          const uploadRes = await uploadToCloudinary(file);

          return {
            url: uploadRes.secure_url,
            publicId: uploadRes.public_id,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          };
        })
      );

      // 🧪 LOG 5: قبل التحديث
      console.log(
        "🧪 [CONTROLLER] calling updateDeliverableFiles with _id =",
        deliverable?._id
      );

      // ✅ تحديث التسليم بالملفات
      await deliverablesService.updateDeliverableFiles(
  deliverable.deliverableId,
  uploadedFiles
);


      console.log("✅ Files uploaded & linked to deliverable");
    }
  } catch (fileErr) {
    console.error("⚠️ FILE UPLOAD FAILED (deliverable محفوظ):", fileErr);
    // ❗ لا نرمي error
  }
};
