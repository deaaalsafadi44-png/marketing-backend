const cloudinary = require("../config/cloudinary");

/*
  Upload file to Cloudinary using base64 (Render-safe)
*/
const uploadToCloudinary = async (file) => {
  const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: "task-deliverables",
    resource_type: "auto",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    type: file.mimetype.startsWith("image")
      ? "image"
      : file.mimetype.startsWith("video")
      ? "video"
      : "file",
  };
};

module.exports = uploadToCloudinary;
