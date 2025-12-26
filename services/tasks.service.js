const Task = require("../models/Task");
const User = require("../models/User");
const Deliverable = require("../models/Deliverable"); // ✅ تم التعديل لاستدعاء الموديل الصحيح الموجود في كودك

// ⭐ دالة مساعدة (Helper) لحساب الوقت الحي لضمان المزامنة بين الأجهزة
// هذه الدالة لا تغير البيانات في القاعدة، بل تحسب الوقت الفعلي للعرض فقط
const calculateLiveTime = (task) => {
  if (task && task.timer && task.timer.isRunning && task.timer.startedAt) {
    const now = new Date();
    const startTime = new Date(task.timer.startedAt);
    const diffSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    
    // نحدث القيمة للعرض فقط دون عمل save هنا
    task.timer.totalSeconds += diffSeconds;
  }
  return task;
};

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
  let tasks;
  if (user.role === "Employee") {
    tasks = await Task.find({ workerId: user.id }, { _id: 0 });
  } else {
    tasks = await Task.find({}, { _id: 0 });
  }

  // مخرجات معدلة لضمان ظهور الوقت الصحيح في القائمة حتى لو التايمر يعمل
  return tasks.map(task => {
    const taskObj = task.toObject();
    return calculateLiveTime(taskObj);
  });
};

/* =========================
   GET TASK BY ID
========================= */
const getTaskById = async (taskId) => {
  const task = await Task.findOne({ id: taskId }, { _id: 0 });
  if (!task) return null;

  // تحويل لـ Object وحساب الوقت الحي قبل الإرسال للفرونت إيند
  const taskObj = task.toObject();
  return calculateLiveTime(taskObj);
};

/* =========================
   UPDATE TASK (MODIFIED)
   تحديث المهمة مع ضمان تحديث اسم الموظف الجديد
========================= */
const updateTask = async (taskId, data) => {
  // ✅ إذا كان التعديل يحتوي على تغيير للموظف، نجلب اسمه الجديد ونحدثه
  if (data.workerId) {
    const worker = await User.findOne({ id: Number(data.workerId) });
    if (worker) {
      data.workerName = worker.name;
    }
  }

  return await Task.findOneAndUpdate(
    { id: taskId },
    { $set: data }, // استخدام $set لضمان تحديث الحقول المرسلة فقط
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
   ⭐ START TASK TIMER (MODIFIED FOR SYNC)
===================================================== */
const startTaskTimer = async (taskId) => {
  const task = await Task.findOne({ id: taskId });
  if (!task) return null;

  if (task.timer.isRunning) return calculateLiveTime(task.toObject());

  task.timer.isRunning = true;
  task.timer.startedAt = new Date();
  task.timer.lastUpdatedAt = new Date();

  await task.save();
  return calculateLiveTime(task.toObject());
};

/* =====================================================
   ⭐ PAUSE TASK TIMER (MODIFIED FOR SYNC)
===================================================== */
const pauseTaskTimer = async (taskId) => {
  const task = await Task.findOne({ id: taskId });
  if (!task) return null;

  if (!task.timer.isRunning || !task.timer.startedAt) {
    return calculateLiveTime(task.toObject());
  }

  const now = new Date();
  const startTime = new Date(task.timer.startedAt);
  const diffSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

  // تثبيت الوقت المستهلك في القاعدة
  task.timer.totalSeconds += diffSeconds;
  task.timer.isRunning = false;
  task.timer.pausedAt = now;
  task.timer.startedAt = null;
  task.timer.lastUpdatedAt = now;

  await task.save();
  return task.toObject();
};

/* =====================================================
   ⭐ RESUME TASK TIMER
===================================================== */
const resumeTaskTimer = async (taskId) => {
  // المنطق الموحد للـ Resume هو نفسه الـ Start لضمان عدم تصفير البيانات
  return await startTaskTimer(taskId);
};
/* =====================================================
   ⭐ RESET TASK TIMER (NEW)
   تصفير العداد تماماً في قاعدة البيانات
==================================================== */
const resetTaskTimer = async (taskId) => {
  const task = await Task.findOne({ id: taskId });
  if (!task) return null;

  // إعادة ضبط كائن التايمر للقيم الابتدائية
  task.timer.totalSeconds = 0;
  task.timer.isRunning = false;
  task.timer.startedAt = null;
  task.timer.pausedAt = null;
  task.timer.lastUpdatedAt = new Date();

  await task.save();
  return task.toObject();
};
/* =========================
   DELETE TASK (MODIFIED)
========================= */
const deleteTask = async (taskId) => {
  // 1. حذف جميع التسليمات المرتبطة بالتاسك من جدول الـ Deliverables
  await Deliverable.deleteMany({ taskId: taskId });
  
  // 2. حذف التاسك نفسه
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
  resetTaskTimer, 
};