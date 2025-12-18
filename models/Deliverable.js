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
        url: { type: String, required: true },
        originalName: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deliverable", DeliverableSchema);
