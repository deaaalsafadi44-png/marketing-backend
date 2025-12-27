const { sendNotification } = require("../services/notifications.service");
const tasksService = require("../services/tasks.service");

/* =========================
   CREATE TASK
========================= */
const createTask = async (req, res) => {
  try {
    const task = await tasksService.createTask(req.body);
    
    // --- كود الإشعارات الجديد ---
    // إذا تمت عملية إنشاء التاسك بنجاح وكان هناك موظف مسند إليه
    if (task && task.workerId) {
      sendNotification(task.workerId, {
        title: "مهمة جديدة! 📋",
        body: `تم إسناد مهمة جديدة لك: ${task.title}`,
        url: `/tasks/${task.id}` // اختياري: لفتح المهمة عند الضغط
      }).catch(err => console.error("Notification Error:", err)); 
      // استخدمنا .catch لضمان أن فشل الإشعار لا يعطل رد السيرفر للمستخدم
    }
    // -------------------------

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
   UPDATE TASK (MODIFIED)
========================= */
const updateTask = async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId))
    return res.status(400).json({ message: "Invalid task id" });

  try {
    // 1. جلب المهمة الأصلية من قاعدة البيانات للتأكد من الموظف المسند إليه
    const existingTask = await tasksService.getTaskById(taskId);
    if (!existingTask)
      return res.status(404).json({ message: "Task not found" });

    const userRole = req.user?.role;
    const userId = req.user?.id; // أو الاسم حسب نظام التوثيق لديك

    // 2. تحديد ما إذا كان المستخدم أدمن أو مدير
    const isAdminOrManager = userRole === "Admin" || userRole === "Manager";
    
    // 3. تحديد ما إذا كانت المهمة مسندة لهذا المستخدم
    const isAssignedWorker = existingTask.workerId === userId || existingTask.workerName === req.user?.username;

    let dataToUpdate = {};

    if (isAdminOrManager) {
      // الأدمن والمدير يمكنهم تعديل كل شيء
      dataToUpdate = req.body;
    } else if (isAssignedWorker) {
      // الموظف المسند إليه المهمة يمكنه تعديل الحالة فقط
      // نقوم باستخراج الحالة فقط من الجسم المرسل وتجاهل أي شيء آخر
      if (req.body.status) {
        dataToUpdate = { status: req.body.status };
      } else {
        return res.status(400).json({ message: "You can only update the status of this task" });
      }
    } else {
      // أي شخص آخر ليس له صلاحية
      return res.status(403).json({ message: "You don't have permission to update this task" });
    }

    // 4. تنفيذ التحديث بالبيانات المسموح بها فقط
    const updated = await tasksService.updateTask(taskId, dataToUpdate);
    res.json(updated);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update task" });
  }
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
/* =====================================================
    ⭐ NEW — RESET TASK TIMER
    POST /tasks/:id/timer/reset
===================================================== */
const resetTaskTimer = async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId))
    return res.status(400).json({ message: "Invalid task id" });

  try {
    const updated = await tasksService.resetTaskTimer(taskId);

    if (!updated)
      return res.status(404).json({ message: "Task not found" });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reset timer" });
  }
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
  resetTaskTimer,
};