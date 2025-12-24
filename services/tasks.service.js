const Task = require("../models/Task");
const User = require("../models/User");

/* =========================
   CREATE TASK
========================= */
const createTask = async (data) => {
  const worker = await User.findOne({ id: Number(data.workerId) });

  const task = {
    id: Math.floor(Date.now() / 1000),
    ...data,
    workerName: worker?.name || "Unknown",
    createdAt: new Date().toISOString(),
  };

  return await Task.create(task);
};

/* =========================
   GET ALL TASKS
========================= */
const getAllTasks = async (user) => {
  if (user.role === "Employee") {
    return await Task.find({ workerId: user.id }, { _id: 0 });
  }

  return await Task.find({}, { _id: 0 });
};

/* =========================
   GET TASK BY ID
========================= */
const getTaskById = async (taskId) => {
  return await Task.findOne({ id: taskId }, { _id: 0 });
};

/* =========================
   UPDATE TASK
========================= */
const updateTask = async (taskId, data) => {
  return await Task.findOneAndUpdate(
    { id: taskId },
    data,
    { new: true, projection: { _id: 0 } }
  );
};

/* =========================
   SAVE TASK TIME (LEGACY)
   ⚠️ لا نلمسه
========================= */
const saveTaskTime = async (taskId, timeSpent) => {
  return await Task.findOneAndUpdate(
    { id: taskId },
    { timeSpent },
    { new: true, projection: { _id: 0 } }
  );
};

/* =====================================================
   ⭐ START TASK TIMER
===================================================== */
const startTaskTimer = async (taskId) => {
  const task = await Task.findOne({ id: taskId });
  if (!task) return null;

  if (task.timer.isRunning) return task;

  task.timer.isRunning = true;
  task.timer.startedAt = new Date();
  task.timer.lastUpdatedAt = new Date();

  await task.save();
  return task;
};

/* =====================================================
   ⭐ PAUSE TASK TIMER
===================================================== */
const pauseTaskTimer = async (taskId) => {
  const task = await Task.findOne({ id: taskId });
  if (!task) return null;

  if (!task.timer.isRunning || !task.timer.startedAt) return task;

  const now = new Date();
  const diffSeconds = Math.floor(
    (now.getTime() - task.timer.startedAt.getTime()) / 1000
  );

  task.timer.totalSeconds += diffSeconds;
  task.timer.isRunning = false;
  task.timer.pausedAt = now;
  task.timer.startedAt = null;
  task.timer.lastUpdatedAt = now;

  await task.save();
  return task;
};

/* =====================================================
   ⭐ RESUME TASK TIMER
===================================================== */
const resumeTaskTimer = async (taskId) => {
  const task = await Task.findOne({ id: taskId });
  if (!task) return null;

  if (task.timer.isRunning) return task;

  task.timer.isRunning = true;
  task.timer.startedAt = new Date();
  task.timer.lastUpdatedAt = new Date();

  await task.save();
  return task;
};

/* =========================
   DELETE TASK
========================= */
const deleteTask = async (taskId) => {
  return await Task.findOneAndDelete({ id: taskId });
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  saveTaskTime, // 🔒 لم نلمسه
  deleteTask,

  // ⭐ TIMER EXPORTS
  startTaskTimer,
  pauseTaskTimer,
  resumeTaskTimer,
};
