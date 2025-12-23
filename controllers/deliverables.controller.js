const deliverablesService = require("../services/deliverables.service");
const uploadToCloudinary = require("../utils/cloudinaryUpload");
const cloudinary = require("cloudinary").v2;

/* =========================
   GET ALL DELIVERABLES
========================= */
exports.getAllDeliverables = async (req, res) => {
  try {
    const { taskId } = req.query;
    const data = await deliverablesService.getAllDeliverables(taskId);
    res.json(data);
  } catch (error) {
    console.error("Get deliverables error:", error);
    res.status(500).json({ message: "Failed to load deliverables" });
  }
};

/* =========================
   CREATE DELIVERABLE
========================= */
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

    // 1) احفظ التسليم فورًا (بدون ملفات)
    deliverable = await deliverablesService.createDeliverable({
      taskId: String(taskId),
      notes: notes || "",
      submittedById: req.user.id,
      submittedByName: req.user.name || req.user.username || "Unknown",
      files: [],
    });

    console.log("🧪 [CONTROLLER] deliverable._id =", deliverable?._id);

    // رد فوري
    res.status(201).json(deliverable);
  } catch (err) {
    console.error("CREATE DELIVERABLE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }

  // 2) رفع وربط الملفات بعد الرد
  try {
    if (req.files && req.files.length > 0) {
      const uploadedFiles = await Promise.all(
        req.files.map(async (file) => {
          const uploadRes = await uploadToCloudinary(file);

          return {
            url: uploadRes.url,
            publicId: uploadRes.public_id,
            originalName: uploadRes.originalName,
            mimeType: uploadRes.mimeType,
            size: uploadRes.size,
            resource_type: uploadRes.resource_type,
            format: uploadRes.format,
          };
        })
      );

      await deliverablesService.updateDeliverableFiles(
        deliverable._id,
        uploadedFiles
      );

      console.log("✅ Files uploaded & linked to deliverable");
    }
  } catch (fileErr) {
    console.error("⚠️ FILE UPLOAD FAILED:", fileErr);
  }
};

/* =========================
   DELETE FILE FROM DELIVERABLE ✅ NEW
   DELETE /deliverables/:deliverableId/files/:fileId
========================= */
exports.deleteFileFromDeliverable = async (req, res) => {
  try {
    const { deliverableId, fileId } = req.params;

    // 1) احصل على الـ deliverable
    const deliverable =
      await deliverablesService.getDeliverableById(deliverableId);

    if (!deliverable) {
      return res.status(404).json({ message: "Deliverable not found" });
    }

    // 2) ابحث عن الملف
    const file = deliverable.files.find(
      (f) => String(f._id) === String(fileId)
    );

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // 3) حذف من Cloudinary
    if (file.publicId) {
      await cloudinary.uploader.destroy(file.publicId, {
        resource_type: file.resource_type || "image",
      });
    }

    // 4) حذف من قاعدة البيانات
    await deliverablesService.removeFileFromDeliverable(
      deliverableId,
      fileId
    );

    return res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("DELETE FILE ERROR:", err);
    res.status(500).json({ message: "Failed to delete file" });
  }
};
