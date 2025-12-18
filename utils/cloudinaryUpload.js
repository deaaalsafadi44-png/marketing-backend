const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (file) => {
  try {
    let resourceType = "raw";

    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    }

    // ✅ Convert buffer to base64
    const base64 = file.buffer.toString("base64");
    const dataUri = `data:${file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: resourceType,
      folder: "task-deliverables",
    });

    return {
      url: result.secure_url,
      originalName: file.originalname,
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
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

module.exports = uploadToCloudinary;
