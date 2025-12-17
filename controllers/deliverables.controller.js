const deliverablesService = require("../services/deliverables.service");

/*
  GET /deliverables
  Returns all deliverables (for boxes page later)
*/
const getAllDeliverables = async (req, res) => {
  try {
    const data = await deliverablesService.getAllDeliverables();
    res.json(data);
  } catch (error) {
    console.error("Get deliverables error:", error);
    res.status(500).json({ message: "Failed to load deliverables" });
  }
};

/*
  POST /deliverables
  Create deliverable (files will be added later)
*/
const createDeliverable = async (req, res) => {
  try {
    const { taskId, notes } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    const deliverable = await deliverablesService.createDeliverable({
      taskId: Number(taskId),                 // ✅ FIX
      submittedById: Number(req.user.id),     // ✅ FIX
      submittedByName: req.user.name,
      notes,
      files: [],
    });

    res.json(deliverable);
  } catch (error) {
    console.error("Create deliverable error:", error);
    res.status(500).json({ message: "Failed to create deliverable" });
  }
};

module.exports = {
  getAllDeliverables,
  createDeliverable,
};
