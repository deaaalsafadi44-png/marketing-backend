const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const tasksController = require("../controllers/tasks.controller");

const router = express.Router();

/* =========================
   CREATE TASK
   =========================
   Admin + Manager
*/
router.post(
  "/tasks",
  authenticateToken,
  authorize(["Admin", "Manager"]),
  tasksController.createTask
);

/* =========================
   GET ALL TASKS
   =========================
*/
router.get(
  "/tasks",
  authenticateToken,
  tasksController.getAllTasks
);

/* =========================
   GET TASK BY ID
   =========================
*/
router.get(
  "/tasks/:id",
  authenticateToken,
  tasksController.getTaskById
);

/* =========================
   UPDATE TASK
   =========================
   Admin + Manager
*/
router.put(
  "/tasks/:id",
  authenticateToken,
  authorize(["Admin", "Manager"]),
  tasksController.updateTask
);

/* =========================
   SAVE TIME
   =========================
*/
router.put(
  "/tasks/:id/time",
  authenticateToken,
  tasksController.saveTaskTime
);

/* =========================
   DELETE TASK
   =========================
   Admin + Manager
*/
router.delete(
  "/tasks/:id",
  authenticateToken,
  authorize(["Admin", "Manager"]),
  tasksController.deleteTask
);

module.exports = router;
