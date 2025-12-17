const cloudinary = require("../config/cloudinary");

/*
  Upload file buffer to Cloudinary
  - Images -> image
  - Videos -> video
  - Other files -> raw
*/

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    let resourceType = "raw";

    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    }

    cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: "task-deliverables",
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
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
        });
      }
    ).end(file.buffer);
  });
};

module.exports = uploadToCloudinary;
