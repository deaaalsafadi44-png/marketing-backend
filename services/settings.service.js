const SystemSettings = require("../models/SystemSettings");

/* =========================
   GET SETTINGS
   ========================= */
const getSettings = async () => {
  return (await SystemSettings.findOne({}, { _id: 0 })) || {};
};

/* =========================
   SAVE SETTINGS
   ========================= */
const saveSettings = async (data) => {
  await SystemSettings.findOneAndUpdate(
    {},
    data,
    { upsert: true }
  );
};

module.exports = {
  getSettings,
  saveSettings,
};
