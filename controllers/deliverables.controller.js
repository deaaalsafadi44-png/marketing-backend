const deliverablesService = require("../services/deliverables.service");

exports.getAllDeliverables = async (req, res) => {
  try {
    const data = await deliverablesService.getAllDeliverables();
    res.json(data);
  } catch (error) {
    console.error("Get deliverables error:", error);
    res.status(500).json({ message: "Failed to load deliverables" });
  }
};

exports.createDeliverable = async (req, res) => {
  try {
    console.log("========== NEW DELIVERABLE ==========");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    console.log("USER:", req.user);
    console.log("====================================");

    const { taskId, notes } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    const newDeliverable =
      await deliverablesService.createDeliverable({
        taskId,
        notes: notes || "",
        submittedById: req.user.id,
        submittedByName: req.user.name || req.user.username || "Unknown",
        files: [], // مؤقتًا
      });

    res.status(201).json(newDeliverable);
  } catch (err) {
    console.error("CREATE DELIVERABLE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
