const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");

const router = express.Router();

/* =========================
   CREATE TASK
   ========================= */
router.post(
  "/tasks",
  authenticateToken,
  authorize(["Admin"]),
  async (req, res) => {
    const worker = await User.findOne({ id: Number(req.body.workerId) });

    const task = {
      id: Math.floor(Date.now() / 1000),
      ...req.body,
      workerName: worker?.name || "Unknown",
      createdAt: new Date().toISOString(),
    };

    await Task.create(task);
    res.json(task);
  }
);

/* =========================
   GET ALL TASKS
   ========================= */
router.get("/tasks", authenticateToken, async (req, res) => {
  if (req.user.role === "Employee") {
    return res.json(
      await Task.find({ workerId: req.user.id }, { _id: 0 })
    );
  }

  res.json(await Task.find({}, { _id: 0 }));
});

/* =========================
   GET TASK BY ID
   ========================= */
router.get("/tasks/:id", authenticateToken, async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId))
    return res.status(400).json({ message: "Invalid task id" });

  const task = await Task.findOne({ id: taskId }, { _id: 0 });
  if (!task)
    return res.status(404).json({ message: "Task not found" });

  res.json(task);
});

/* =========================
   UPDATE TASK
   ========================= */
router.put("/tasks/:id", authenticateToken, async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId))
    return res.status(400).json({ message: "Invalid task id" });

  const updated = await Task.findOneAndUpdate(
    { id: taskId },
    req.body,
    { new: true, projection: { _id: 0 } }
  );

  if (!updated)
    return res.status(404).json({ message: "Task not found" });

  res.json(updated);
});

/* =========================
   SAVE TIME
   ========================= */
router.put("/tasks/:id/time", authenticateToken, async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId))
    return res.status(400).json({ message: "Invalid task id" });

  const updated = await Task.findOneAndUpdate(
    { id: taskId },
    { timeSpent: req.body.timeSpent },
    { new: true, projection: { _id: 0 } }
  );

  if (!updated)
    return res.status(404).json({ message: "Task not found" });

  res.json(updated);
});

/* =========================
   DELETE TASK
   ========================= */
router.delete(
  "/tasks/:id",
  authenticateToken,
  authorize(["Admin"]),
  async (req, res) => {
    const taskId = Number(req.params.id);
    if (isNaN(taskId))
      return res.status(400).json({ message: "Invalid task id" });

    const deleted = await Task.findOneAndDelete({ id: taskId });
    if (!deleted)
      return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  }
);

module.exports = router;
