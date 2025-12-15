const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");

const router = express.Router();

/* =========================
   GET ALL USERS
   ========================= */
router.get(
  "/users",
  authenticateToken,
  authorize(["Admin"]),
  async (req, res) => {
    const users = await User.find(
      {},
      { _id: 0, password: 0, refreshToken: 0 }
    );
    res.json(users);
  }
);

/* =========================
   GET USER BY ID
   ========================= */
router.get(
  "/users/:id",
  authenticateToken,
  authorize(["Admin"]),
  async (req, res) => {
    const user = await User.findOne(
      { id: Number(req.params.id) },
      { _id: 0 }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  }
);

/* =========================
   UPDATE USER
   ========================= */
router.put(
  "/users/:id",
  authenticateToken,
  authorize(["Admin"]),
  async (req, res) => {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    } else {
      delete req.body.password;
    }

    const updated = await User.findOneAndUpdate(
      { id: Number(req.params.id) },
      req.body,
      { new: true, projection: { _id: 0 } }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updated);
  }
);

/* =========================
   ADD USER
   ========================= */
router.post(
  "/users",
  authenticateToken,
  authorize(["Admin"]),
  async (req, res) => {
    const { name, email, password, role, dept } = req.body;

    if (!name || !email || !password || !role || !dept) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newUser = await User.create({
      id: Math.floor(Date.now() / 1000),
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      dept,
      createdAt: new Date().toISOString(),
      refreshToken: null,
    });

    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      dept: newUser.dept,
    });
  }
);

module.exports = router;
