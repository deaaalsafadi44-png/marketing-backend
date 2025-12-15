const optionsService = require("../services/options.service");

/* =========================
   GET OPTIONS
   ========================= */
const getOptions = async (req, res) => {
  try {
    const options = await optionsService.getOptions();
    res.json(options);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load options" });
  }
};

/* =========================
   SAVE OPTIONS
   ========================= */
const saveOptions = async (req, res) => {
  try {
    await optionsService.saveOptions(req.body);
    res.json({ message: "Options saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save options" });
  }
};

module.exports = {
  getOptions,
  saveOptions,
};
