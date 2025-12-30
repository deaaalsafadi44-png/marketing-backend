const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const tasksController = require("../controllers/tasks.controller");

const router = express.Router();

/* =========================
   CREATE TASK
   POST /tasks
========================= */
router.post(
  "/",
  authenticateToken,
  authorize(["Admin", "Manager"]),
  tasksController.createTask
);
// جلب جميع القوالب المجدولة (للأدمن والمدير فقط)
/* =========================
   جلب جميع القوالب المجدولة
   يجب أن يكون هذا المسار فوق مسارات الـ :id لتجنب التداخل
========================= */
/* =====================================================
   📅 UPDATE SCHEDULED TEMPLATE
   يجب أن يكون للأدمن والمدير فقط
===================================================== */
router.put(
  '/scheduled/:id', 
  authenticateToken, 
  authorize(["Admin", "Manager"]), 
  tasksController.updateScheduledTask // تأكد من وجود حرف s هنا
);


router.get(
  "/scheduled/all", 
  authenticateToken, 
  authorize(["Admin", "Manager"]), 
  tasksController.getScheduledTasks // ✅ الربط المباشر مع الدالة في الـ Controller
);
/* =========================
   GET ALL TASKS
   GET /tasks
========================= */
router.get(
  "/",
  authenticateToken,
  tasksController.getAllTasks
);

/* =========================
   GET TASK BY ID
   GET /tasks/:id
========================= */
router.get(
  "/:id",
  authenticateToken,
  tasksController.getTaskById
);

/* =========================
   UPDATE TASK
   PUT /tasks/:id
   ✅ تم إزالة authorize هنا للسماح للموظف بالوصول، 
   والتحقق يتم داخل Controller للسماح له بتعديل الحالة فقط.
========================= */
router.put(
  "/:id",
  authenticateToken,
  tasksController.updateTask
);

/* =========================
   SAVE TIME (LEGACY)
   PUT /tasks/:id/time
========================= */
router.put(
  "/:id/time",
  authenticateToken,
  tasksController.saveTaskTime
);

/* =====================================================
   ⭐ TIMER ROUTES (NEW)
   Start / Pause / Resume
===================================================== */

/* START TIMER */
router.post(
  "/:id/timer/start",
  authenticateToken,
  tasksController.startTaskTimer
);

/* PAUSE TIMER */
router.post(
  "/:id/timer/pause",
  authenticateToken,
  tasksController.pauseTaskTimer
);
/* LOCK TASK (الموظف ينهي المهمة ويقفل التايمر) */
router.post(
  "/:id/lock",
  authenticateToken,
  tasksController.lockTask
);

/* UNLOCK TASK (الأدمن فقط يفك القفل) */
router.post(
  "/:id/unlock",
  authenticateToken,
  authorize(["Admin"]),
  tasksController.unlockTask
);

/* RESUME TIMER */
router.post(
  "/:id/timer/resume",
  authenticateToken,
  tasksController.resumeTaskTimer
);
/* RESET TIMER */
router.post(
  "/:id/timer/reset",
  authenticateToken,
  tasksController.resetTaskTimer
);
/* =====================================================
    ⭐ COMMENTS (NEW)
    POST /tasks/:id/comments
    يسمح للأدمن والمانجر فقط بإضافة تعليق
===================================================== */
router.post(
  "/:id/comments",
  authenticateToken,
  authorize(["Admin", "Manager"]),
  tasksController.addTaskComment
);
/* DELETE COMMENT */
router.delete(
  "/:id/comments/:commentId",
  authenticateToken,
  authorize(["Admin", "Manager"]),
  tasksController.deleteTaskComment
);
/* =========================
   DELETE TASK
   DELETE /tasks/:id
========================= */
router.delete(
  "/:id",
  authenticateToken,
  authorize(["Admin", "Manager"]),
  tasksController.deleteTask
);

module.exports = router;