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

/* RESUME TIMER */
router.post(
  "/:id/timer/resume",
  authenticateToken,
  tasksController.resumeTaskTimer
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