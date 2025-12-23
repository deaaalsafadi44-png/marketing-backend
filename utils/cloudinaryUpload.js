const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (file) => {
  try {
    let resourceType = "raw";

    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    } else if (file.mimetype === "application/pdf") {
      resourceType = "image"; // ⭐ مهم جدًا
    }

    const base64 = file.buffer.toString("base64");
    const dataUri = `data:${file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "task-deliverables",
      resource_type: resourceType,

      // ✅ الحل الحاسم
      flags: "attachment:false",
      use_filename: true,
      unique_filename: false,
    });

    return {
      url: result.secure_url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,

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
