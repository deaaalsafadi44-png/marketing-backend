const mongoose = require("mongoose");

const OptionsSchema = new mongoose.Schema(
  {
    priority: [String],
    status: [String],
    companies: [String],
    jobTitles: [String], // 🔥 هذا هو السطر الذي ينقصك
    frequencies: [
      {
        label: String,
        value: Number,
        unit: String
      }
    ],
  },
  { versionKey: false }
);

module.exports = mongoose.model("Options", OptionsSchema);