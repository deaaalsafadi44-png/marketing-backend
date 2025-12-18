const cloudinary = require("../config/cloudinary");

/*
  Upload file to Cloudinary using base64 (Render-safe)
*/
const uploadToCloudinary = async (file) => {
  const resourceType = file.mimetype.startsWith("image/")
    ? "image"
    : file.mimetype.startsWith("video/")
    ? "video"
    : "raw";

  const base64 = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;

  const result = await cloudinary.uploader.upload(base64, {
    resource_type: resourceType,
    folder: "task-deliverables",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
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
};

module.exports = uploadToCloudinary;
