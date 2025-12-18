const mongoose = require("mongoose");

const deliverableSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      index: true,
    },

    submittedById: {
      type: String,
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
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
        },
        originalName: {
          type: String,
        },
        mimeType: {
          type: String,
        },
        size: {
          type: Number,
        },
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("Deliverable", deliverableSchema);
