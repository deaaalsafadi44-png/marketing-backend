const multer = require("multer");

/*
  Multer configuration
  - Memory storage (we will send files to Cloudinary later)
  - Limits file size to protect server
*/

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB per file
  },
});

module.exports = upload;
