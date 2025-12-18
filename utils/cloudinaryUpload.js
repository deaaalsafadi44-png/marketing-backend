const cloudinary = require("../config/cloudinary");

/**
 * Upload single file to Cloudinary
 * @param {Object} file - multer file
 */
const uploadToCloudinary = async (file) => {
  try {
    if (!file) {
      throw new Error("No file provided to Cloudinary uploader");
    }

    // ✅ تحديد نوع المورد
    let resourceType = "raw";
    if (file.mimetype?.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype?.startsWith("video/")) {
      resourceType = "video";
    }

    // ✅ تأكد أن الملف Buffer (multer memoryStorage)
    if (!file.buffer) {
      throw new Error("File buffer is missing (multer storage misconfigured)");
    }

    // ✅ تحويل buffer إلى base64 (آمن مع Render)
    const base64 = file.buffer.toString("base64");
    const dataUri = `data:${file.mimetype};base64,${base64}`;

    // ✅ رفع فعلي إلى Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: resourceType,
      folder: "task-deliverables",
      use_filename: true,
      unique_filename: true,
    });

    // ✅ رجوع بيانات نظيفة تُحفظ في Mongo
    return {
      url: result.secure_url,
      originalName: file.originalname,
      publicId: result.public_id,
      mimeType: file.mimetype,
      size: file.size,
      type:
        resourceType === "image"
          ? "image"
          : resourceType === "video"
          ? "video"
          : "file",
    };
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error.message);
    throw error; // ⛔ مهم: لا نكمل حفظ التاسك بدون ملف
  }
};

module.exports = uploadToCloudinary;
