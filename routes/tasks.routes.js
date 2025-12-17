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
========================= */
router.put(
  "/:id",
  authenticateToken,
  authorize(["Admin", "Manager"]),
  tasksController.updateTask
);

/* =========================
   SAVE TIME
   PUT /tasks/:id/time
========================= */
router.put(
  "/:id/time",
  authenticateToken,
  tasksController.saveTaskTime
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
