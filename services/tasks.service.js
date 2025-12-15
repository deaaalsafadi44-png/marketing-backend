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
   SAVE TASK TIME
   ========================= */
const saveTaskTime = async (taskId, timeSpent) => {
  return await Task.findOneAndUpdate(
    { id: taskId },
    { timeSpent },
    { new: true, projection: { _id: 0 } }
  );
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
  saveTaskTime,
  deleteTask,
};
