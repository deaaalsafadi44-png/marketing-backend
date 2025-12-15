const mongoose = require("mongoose");

const OptionsSchema = new mongoose.Schema(
  {
    priority: Array,
    status: Array,
    companies: Array,
  },
  { versionKey: false }
);

module.exports = mongoose.model("Options", OptionsSchema);
