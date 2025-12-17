const mongoose = require("mongoose");

/*
  Each deliverable represents
  what a user submitted for a task
*/

const DeliverableFileSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },          // Cloudinary URL
    originalName: { type: String, required: true }, // File name
    mimeType: { type: String, required: true },     // image/png, video/mp4, etc
    size: { type: Number, required: true },         // bytes
    type: {
      type: String,
      enum: ["image", "video", "file"],
      required: true
    }
  },
  { _id: false }
);

const DeliverableSchema = new mongoose.Schema(
  {
    // Link to task
    taskId: { type: Number, required: true },

    // User who submitted
    submittedById: { type: Number, required: true },
    submittedByName: { type: String, required: true },

    // Optional description
    notes: { type: String, default: "" },

    // Uploaded files
    files: { type: [DeliverableFileSchema], default: [] },

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

module.exports = mongoose.model("Deliverable", DeliverableSchema);
