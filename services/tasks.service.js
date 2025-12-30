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
   CREATE TASK (Modified for Precise Scheduling)
========================= */
const createTask = async (data) => {
  // 1. جلب بيانات الموظف
  const worker = await User.findOne({ id: Number(data.workerId) });

  // 2. حساب موعد التنفيذ الأول (nextRun) بناءً على النظام الديناميكي الجديد
  let calculatedNextRun = null;

  if (data.isScheduled && data.frequencyDetails) {
    const { value, unit } = data.frequencyDetails;
    const amount = Number(value);
    
    // نقطة البداية هي التاريخ الذي اخترته في الواجهة
    const startDate = new Date(data.startDate || Date.now());
    calculatedNextRun = new Date(startDate);

    // تطبيق المعادلة: (الكمية × النوع)
    // ملاحظة: نزيد الكمية على تاريخ البداية المختار
    if (unit === "hours") {
      calculatedNextRun.setHours(calculatedNextRun.getHours() + amount);
    } else if (unit === "days") {
      calculatedNextRun.setDate(calculatedNextRun.getDate() + amount);
    } else if (unit === "weeks") {
      calculatedNextRun.setDate(calculatedNextRun.getDate() + (amount * 7));
    } else if (unit === "months") {
      calculatedNextRun.setMonth(calculatedNextRun.getMonth() + amount);
    }
  } else if (data.isScheduled && data.startDate) {
    // حالة احتياطية إذا لم تتوفر details نأخذ تاريخ البداية مباشرة
    calculatedNextRun = new Date(data.startDate);
  }

  // 3. تجهيز كائن المهمة للحفظ
  const task = {
    id: Math.floor(Date.now() / 1000),
    ...data,
    workerName: worker?.name || "Unknown",
    workerJobTitle: worker?.dept || "No Job Title",
    createdAt: new Date().toISOString(),
    
    // إدارة حقول الجدولة الجديدة
    isScheduled: data.isScheduled || false,
    frequency: data.frequency || "none", // سيخزن النص مثل "كل 7 ساعة"
    
    // تخزين البيانات التفصيلية لسهولة الحساب لاحقاً في سكريبت الأتمتة
    frequencyDetails: data.frequencyDetails || null,
    
    // الموعد القادم المحسوب بدقة
    nextRun: calculatedNextRun,
    
    // الاحتفاظ بتاريخ البداية الأصلي للتوثيق
    scheduledStartDate: data.startDate || null
  };

  return await Task.create(task);
};
/* =========================
   GET ALL TASKS (المعدلة لإخفاء القوالب)
========================= */
const getAllTasks = async (user) => {
  let tasks;
  
  // أضفنا شرط { isScheduled: { $ne: true } }
  // وتعني: جلب المهام التي حقل isScheduled فيها "ليس" true
  if (user.role === "Employee") {
    tasks = await Task.find({ 
      workerId: user.id, 
      isScheduled: { $ne: true } 
    }, { _id: 0 });
  } else {
    tasks = await Task.find({ 
      isScheduled: { $ne: true } 
    }, { _id: 0 });
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
  // أزلنا الـ { _id: 0 } لضمان جلب كل الحقول بدون استثناء
  const task = await Task.findOne({ id: taskId }); 
  if (!task) return null;

  const taskObj = task.toObject();
  
  // تأمين وجود القيمة حتى لو لم تكن في الداتا القديمة
  if (taskObj.isLocked === undefined) {
      taskObj.isLocked = taskObj.status === "Completed";
  }

  return calculateLiveTime(taskObj);
};

/* =========================
   UPDATE TASK (Updated for Scheduling)
========================= */
const updateTask = async (taskId, data) => {
  // ✅ إذا تم تغيير الموظف (workerId)، نحدث الاسم والمسمى الوظيفي معاً
  if (data.workerId) {
    const worker = await User.findOne({ id: Number(data.workerId) });
    if (worker) {
      data.workerName = worker.name;
      data.workerJobTitle = worker.dept; 
    }
  }

  // الحقول الجديدة سيتم استلامها تلقائياً عبر {...data} ولكننا نمررها ضمن $set للتأكيد
  return await Task.findOneAndUpdate(
    { id: taskId },
    { $set: data },
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
  if (task.isLocked) return task.toObject ? task.toObject() : task;

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
  if (task.isLocked) return task.toObject ? task.toObject() : task;

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
  if (task.isLocked) return task.toObject ? task.toObject() : task;

  // إعادة ضبط كائن التايمر للقيم الابتدائية
  task.timer.totalSeconds = 0;
  task.timer.isRunning = false;
  task.timer.startedAt = null;
  task.timer.pausedAt = null;
  task.timer.lastUpdatedAt = new Date();

  await task.save();
  return task.toObject();
};
const lockTask = async (taskId) => {
  const task = await Task.findOne({ id: taskId });
  if (!task) return null;

  // 1. حساب الوقت المتبقي إذا كان العداد يعمل
  if (task.timer.isRunning && task.timer.startedAt) {
    const now = new Date();
    const startTime = new Date(task.timer.startedAt);
    const diffSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    task.timer.totalSeconds += diffSeconds;
    task.timer.isRunning = false;
    task.timer.startedAt = null;
  }

  // 2. ✨ الخطوة الأهم: مزامنة الوقت مع حقل التقارير
  // نقوم بتحويل الثواني الكلية إلى دقائق لأن حقل timeSpent غالباً ما يعتمد الدقائق في نظامك
  task.timeSpent = task.timer.totalSeconds / 60; 

  // 3. قفل المهمة وتغيير حالتها
  task.isLocked = true;
  task.status = "Completed";

  await task.save();
  return task.toObject();
};

const unlockTask = async (taskId) => {
  const task = await Task.findOne({ id: taskId });
  if (!task) return null;
  task.isLocked = false;
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
/* =========================
   GET ALL SCHEDULED TEMPLATES (Admin Only)
========================= */
const getScheduledTemplates = async () => {
  // نجلب فقط المهام التي تعمل كـ "قوالب مجدولة"
  return await Task.find({ isScheduled: true }, { _id: 0 });
};
/* =====================================================
    📅 UPDATE SCHEDULED TEMPLATE (NEW)
    تحديث القالب المجدول مباشرة في قاعدة البيانات
===================================================== */
const updateScheduledTask = async (taskId, data) => {
  // إذا كان هناك موظف جديد، نحدث بياناته
  if (data.assignedTo) {
    const worker = await User.findOne({ id: Number(data.assignedTo) });
    if (worker) {
      data.workerId = worker.id;
      data.workerName = worker.name;
      data.workerJobTitle = worker.dept;
    }
  }

  // إذا تم تغيير التاريخ، نحدث nextRun
  if (data.startDate) {
    data.nextRun = new Date(data.startDate);
  }

  return await Task.findOneAndUpdate(
    { id: taskId, isScheduled: true },
    { $set: data },
    { new: true }
  );
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
  lockTask,
  unlockTask,
  getScheduledTemplates,
  updateScheduledTask,
};