const express = require("express");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const usersController = require("../controllers/users.controller");

const router = express.Router();

/* =========================
   GET ALL USERS
   GET /users
========================= */
router.get(
  "/",
  authenticateToken,
  authorize(["Admin", "Manager"]),
  usersController.getAllUsers
);

/* =========================
   GET USER BY ID
   GET /users/:id
========================= */
router.get(
  "/:id",
  authenticateToken,
  authorize(["Admin"]),
  usersController.getUserById
);

/* =========================
   UPDATE USER
   PUT /users/:id
========================= */
router.put(
  "/:id",
  authenticateToken,
  authorize(["Admin"]),
  usersController.updateUser
);

/* =========================
   ADD USER
   POST /users
========================= */
router.post(
  "/",
  authenticateToken,
  authorize(["Admin"]),
  usersController.createUser
);

module.exports = router;
