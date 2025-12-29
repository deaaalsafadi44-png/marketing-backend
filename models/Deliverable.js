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

      
        mimeType: { type: String },
        resource_type: { type: String },
        format: { type: String },
        size: { type: Number },
      },
    ],

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    ratedById: {
      type: Number,
      default: null,
    },

    ratedByName: {
      type: String,
      default: null,
    },

    ratedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deliverable", DeliverableSchema);
