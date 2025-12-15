const settingsService = require("../services/settings.service");

/* =========================
   GET SETTINGS
   ========================= */
const getSettings = async (req, res) => {
  try {
    const settings = await settingsService.getSettings();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load settings" });
  }
};

/* =========================
   SAVE SETTINGS
   ========================= */
const saveSettings = async (req, res) => {
  try {
    await settingsService.saveSettings(req.body);
    res.json({ message: "Settings saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save settings" });
  }
};

module.exports = {
  getSettings,
  saveSettings,
};
