const Options = require("../models/Options");

/* =========================
   GET OPTIONS
   ========================= */
const getOptions = async () => {
  const options = await Options.findOne({}, { _id: 0 });
  return (
    options || {
      priority: [],
      status: [],
      companies: [],
    }
  );
};

/* =========================
   SAVE OPTIONS
   ========================= */
const saveOptions = async (data) => {
  await Options.deleteMany({});
  await Options.create(data);
  return true;
};

module.exports = {
  getOptions,
  saveOptions,
};
