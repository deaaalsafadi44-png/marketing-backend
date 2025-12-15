const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
  {},
  {
    strict: false,
    versionKey: false,
  }
);

module.exports = mongoose.model("SystemSettings", SettingsSchema);
