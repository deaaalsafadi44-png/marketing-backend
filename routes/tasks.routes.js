const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const tasksController = require("../controllers/tasks.controller");

const router = express.Router();

/* =========================
   CREATE TASK
   ========================= */
router.post(
  "/tasks",
  authenticateToken,
  authorize(["Admin"]),
  tasksController.createTask
);

/* =========================
   GET ALL TASKS
   ========================= */
router.get(
  "/tasks",
  authenticateToken,
  tasksController.getAllTasks
);

/* =========================
   GET TASK BY ID
   ========================= */
router.get(
  "/tasks/:id",
  authenticateToken,
  tasksController.getTaskById
);

/* =========================
   UPDATE TASK
   ========================= */
router.put(
  "/tasks/:id",
  authenticateToken,
  tasksController.updateTask
);

/* =========================
   SAVE TIME
   ========================= */
router.put(
  "/tasks/:id/time",
  authenticateToken,
  tasksController.saveTaskTime
);

/* =========================
   DELETE TASK
   ========================= */
router.delete(
  "/tasks/:id",
  authenticateToken,
  authorize(["Admin", "Manager"]),
  tasksController.deleteTask
);


module.exports = router;
