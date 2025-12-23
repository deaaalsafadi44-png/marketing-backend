const mongoose = require("mongoose");

const DeliverableSchema = new mongoose.Schema(
  {
    taskId: {
      type: Number,
      required: true,
      index: true,
    },

    submittedById: {
      type: Number,
      required: true,
    },

    submittedByName: {
      type: String,
      required: true,
    },

    notes: {
      type: String,
      default: "",
    },

    files: [
      {
        // الحقول الأصلية (لم نغيّرها)
        url: { type: String, required: true },
        originalName: { type: String, required: true },
        publicId: { type: String, required: true },

        // ⬇️ الحقول المضافة (لدعم العرض)
        mimeType: { type: String },
        size: { type: Number },
        resource_type: { type: String }, // image | video | raw
        format: { type: String },        // png | jpg | mp4 | pdf
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deliverable", DeliverableSchema);
