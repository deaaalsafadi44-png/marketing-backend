const { sendNotification } = require("../services/notifications.service");
const tasksService = require("../services/tasks.service");
const Notification = require("../models/Notification"); // ✅ التأكد من وجود الاستدعاء في الأعلى

/* =========================
   CREATE TASK (UPDATED)
========================= */
const createTask = async (req, res) => {
  try {
    const task = await tasksService.createTask(req.body);
    
    if (task && task.workerId) {
      // ✅ 1. حفظ الإشعار في قاعدة البيانات ليظهر في العداد (الميزة الجديدة)
      // هذا السجل هو ما سيجعلك ترى رقم 1 أو 2 فوق أيقونة الجرس لاحقاً
      await Notification.create({
        recipientId: task.workerId,
        title: "مهمة جديدة! 📋",
        body: `📌 المهمة: ${task.title}\n🏢 الشركة: ${task.company || 'غير محدد'}`,
        url: `/tasks/view/${task.id}`
      });

      // 2. إرسال إشعار الـ Push للمتصفح (ليظهر التنبيه في ويندوز حتى والمتصفح مغلق)
      sendNotification(task.workerId, {
        title: "مهمة جديدة! 📋",
        body: `📌 المهمة: ${task.title}\n🏢 الشركة: ${task.company || 'غير محدد'}\n⏳ الأولوية: ${task.priority || 'عادية'}`,
        url: `/tasks/view/${task.id}`
      }).catch(err => console.error("Notification Error:", err)); 
    }

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
// أضف هذا السطر في أعلى الملف تماماً إذا لم يكن موجوداً
const Task = require("../models/Task"); 

const addTaskComment = async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId)) return res.status(400).json({ message: "Invalid task id" });

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text is required" });

    // ✅ الحل الأضمن: استخدام findOneAndUpdate لإضافة التعليق مباشرة للمصفوفة
    const newComment = {
      text: text,
      author: req.user.name || req.user.username || "Admin", 
      role: req.user.role,
      createdAt: new Date()
    };

    const updatedTask = await Task.findOneAndUpdate(
      { id: taskId }, // البحث برقم الـ id المخصص في مشروعك
      { $push: { comments: newComment } }, // إضافة التعليق للمصفوفة
      { new: true } // إعادة البيانات بعد التحديث
    );

    if (!updatedTask) return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Comment added successfully", comment: newComment });
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ message: "Failed to add comment", error: err.message });
  }
};
/* =====================================================
    ⭐ DELETE TASK COMMENT
    حذف تعليق معين من مصفوفة التعليقات
===================================================== */
const deleteTaskComment = async (req, res) => {
  const taskId = Number(req.params.id);
  const { commentId } = req.params; // سنرسل معرف التعليق في الرابط

  try {
    const updatedTask = await Task.findOneAndUpdate(
      { id: taskId },
      { $pull: { comments: { _id: commentId } } }, // $pull تقوم بحذف العنصر المطابق للـ id من المصفوفة
      { new: true }
    );

    if (!updatedTask) return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};
/* =====================================================
    🔒 NEW — LOCK TASK
    POST /tasks/:id/lock
===================================================== */
const lockTask = async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId)) return res.status(400).json({ message: "Invalid task id" });

  try {
    const updated = await tasksService.lockTask(taskId);
    if (!updated) return res.status(404).json({ message: "Task not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to lock task" });
  }
};

/* =========================
    🔓 UNLOCK TASK (Admin Only)
========================= */
const unlockTask = async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId)) return res.status(400).json({ message: "Invalid task id" });

  // ✅ التصحيح: يجب إنهاء الدالة بـ return إذا لم يكن المستخدم أدمن
  if (req.user.role.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Only Admin can unlock tasks" });
  }

  try {
    const updated = await tasksService.unlockTask(taskId);
    if (!updated) return res.status(404).json({ message: "Task not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to unlock task" });
  }
};
/* =====================================================
    📅 GET ALL SCHEDULED TEMPLATES
    GET /tasks/scheduled/all
===================================================== */
const getScheduledTasks = async (req, res) => {
  try {
    // البحث فقط عن المهام التي تم تحديدها كقوالب مجدولة
    const templates = await Task.find({ isScheduled: true });
    
    // إرسال البيانات للفرونت إند
    res.json(templates);
  } catch (err) {
    console.error("Error fetching scheduled tasks:", err);
    res.status(500).json({ message: "Failed to load scheduled templates" });
  }
};
// لا تنسى إضافة deleteTaskComment إلى module.exports في نهاية الملف
module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  saveTaskTime,
  deleteTask,
  getScheduledTasks,

  // ⭐ NEW EXPORTS
  startTaskTimer,
  pauseTaskTimer,
  resumeTaskTimer,
  resetTaskTimer,
  addTaskComment,
  deleteTaskComment,
  lockTask,   // ✅ إضافة هذه
  unlockTask, // ✅ إضافة هذه
};