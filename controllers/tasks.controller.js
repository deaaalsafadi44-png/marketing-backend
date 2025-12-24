const tasksService = require("../services/tasks.service");

/* =========================
   CREATE TASK
========================= */
const createTask = async (req, res) => {
  try {
    const task = await tasksService.createTask(req.body);
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create task" });
  }
};

/* =========================
   GET ALL TASKS
========================= */
const getAllTasks = async (req, res) => {
  try {
    const tasks = await tasksService.getAllTasks(req.user);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load tasks" });
  }
};

/* =========================
   GET TASK BY ID
========================= */
const getTaskById = async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId))
    return res.status(400).json({ message: "Invalid task id" });

  const task = await tasksService.getTaskById(taskId);
  if (!task)
    return res.status(404).json({ message: "Task not found" });

  res.json(task);
};

/* =========================
   UPDATE TASK
========================= */
const updateTask = async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId))
    return res.status(400).json({ message: "Invalid task id" });

  const updated = await tasksService.updateTask(taskId, req.body);
  if (!updated)
    return res.status(404).json({ message: "Task not found" });

  res.json(updated);
};

/* =========================
   SAVE TASK TIME (LEGACY)
   ⚠️ نتركه كما هو
========================= */
const saveTaskTime = async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId))
    return res.status(400).json({ message: "Invalid task id" });

  const updated = await tasksService.saveTaskTime(
    taskId,
    req.body.timeSpent
  );

  if (!updated)
    return res.status(404).json({ message: "Task not found" });

  res.json(updated);
};

/* =====================================================
   ⭐ NEW — START TASK TIMER
   POST /tasks/:id/timer/start
===================================================== */
const startTaskTimer = async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId))
    return res.status(400).json({ message: "Invalid task id" });

  const updated = await tasksService.startTaskTimer(taskId);

  if (!updated)
    return res.status(404).json({ message: "Task not found" });

  res.json(updated);
};

/* =====================================================
   ⭐ NEW — PAUSE TASK TIMER
   POST /tasks/:id/timer/pause
===================================================== */
const pauseTaskTimer = async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId))
    return res.status(400).json({ message: "Invalid task id" });

  const updated = await tasksService.pauseTaskTimer(taskId);

  if (!updated)
    return res.status(404).json({ message: "Task not found" });

  res.json(updated);
};

/* =====================================================
   ⭐ NEW — RESUME TASK TIMER
   POST /tasks/:id/timer/resume
===================================================== */
const resumeTaskTimer = async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId))
    return res.status(400).json({ message: "Invalid task id" });

  const updated = await tasksService.resumeTaskTimer(taskId);

  if (!updated)
    return res.status(404).json({ message: "Task not found" });

  res.json(updated);
};

/* =========================
   DELETE TASK
========================= */
const deleteTask = async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId))
    return res.status(400).json({ message: "Invalid task id" });

  const deleted = await tasksService.deleteTask(taskId);
  if (!deleted)
    return res.status(404).json({ message: "Task not found" });

  res.json({ message: "Task deleted successfully" });
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  saveTaskTime,
  deleteTask,

  // ⭐ NEW EXPORTS
  startTaskTimer,
  pauseTaskTimer,
  resumeTaskTimer,
};
