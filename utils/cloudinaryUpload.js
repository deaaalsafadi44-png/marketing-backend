const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (file) => {
  try {
    let resourceType = "raw";

    // صور
    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    }

    // فيديو
    else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    }

    // ✅ PDF يُعامل كـ image (الإضافة المطلوبة فقط)
    else if (file.mimetype === "application/pdf") {
      resourceType = "image";
    }

    const base64 = file.buffer.toString("base64");
    const dataUri = `data:${file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "task-deliverables",
      resource_type: resourceType,

      // ⭐ الإضافة الوحيدة الضرورية (بدون تغيير أي منطق)
      type: "upload",
    });

    // ⬇️ لم نحذف أو نغيّر أي شيء هنا
    return {
      // الحقول الأصلية (كما هي)
      url: result.secure_url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      type: resourceType,

      // الحقول المضافة سابقًا (كما هي)
      resource_type: result.resource_type,
      format: result.format,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    throw error;
  }
};

module.exports = uploadToCloudinary;
