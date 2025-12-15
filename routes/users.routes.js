const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const usersController = require("../controllers/users.controller");

const router = express.Router();

/* =========================
   GET ALL USERS
   ========================= */
router.get(
  "/users",
  authenticateToken,
  authorize(["Admin"]),
  usersController.getAllUsers
);

/* =========================
   GET USER BY ID
   ========================= */
router.get(
  "/users/:id",
  authenticateToken,
  authorize(["Admin"]),
  usersController.getUserById
);

/* =========================
   UPDATE USER
   ========================= */
router.put(
  "/users/:id",
  authenticateToken,
  authorize(["Admin"]),
  usersController.updateUser
);

/* =========================
   ADD USER
   ========================= */
router.post(
  "/users",
  authenticateToken,
  authorize(["Admin"]),
  usersController.createUser
);

module.exports = router;
