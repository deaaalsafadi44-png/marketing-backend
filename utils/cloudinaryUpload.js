const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (file) => {
  try {
    let resourceType = "raw";

    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    }

    const base64 = file.buffer.toString("base64");
    const dataUri = `data:${file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "task-deliverables",
      resource_type: resourceType,
    });

    // ⬇️ تمت الإضافة هنا فقط بدون حذف أي شيء
    return {
      // الحقول الأصلية (كما هي)
      url: result.secure_url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      type: resourceType,

      // الحقول المضافة لدعم العرض في الفرونت
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
