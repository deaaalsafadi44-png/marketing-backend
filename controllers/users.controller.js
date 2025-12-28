const usersService = require("../services/users.service");

/* =========================
   GET ALL USERS
========================= */
const getAllUsers = async (req, res) => {
  try {
    const users = await usersService.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load users" });
  }
};

/* =========================
   GET USER BY ID
========================= */
const getUserById = async (req, res) => {
  const userId = Number(req.params.id);
  if (isNaN(userId))
    return res.status(400).json({ message: "Invalid user id" });

  try {
    const user = await usersService.getUserById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load user" });
  }
};

/* =========================
   UPDATE USER (Corrected Sync with $set)
========================= */
const updateUser = async (req, res) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

  try {
    // 1. جلب بيانات المستخدم القديمة قبل التعديل للبحث بها في التاسكات
    const oldUser = await usersService.getUserById(userId);
    if (!oldUser) return res.status(404).json({ message: "User not found" });

    // 2. تحديث بيانات المستخدم (مثل الباسورد والجوب الجديد)
    const updated = await usersService.updateUser(userId, req.body);
    if (!updated) return res.status(404).json({ message: "User not found" });

    // 3. تحديث التاسكات المرتبطة لضمان عدم اختفاء الجوب
    try {
      const Task = require("../models/Task"); 

      // نأخذ القيم الجديدة من req.body لضمان الدقة العالية
      const newName = req.body.name || oldUser.name;
      const newJobTitle = req.body.jobTitle || oldUser.jobTitle;

      if (req.body.jobTitle || req.body.name) {
        await Task.updateMany(
          { workerName: oldUser.name }, // البحث بالاسم القديم
          { 
            $set: { 
              workerName: newName,
              workerJobTitle: newJobTitle 
            } 
          }
        );
        console.log(`Sync success: Updated tasks for ${newName}`);
      }
    } catch (syncErr) {
      console.error("Sync failed, but user was updated:", syncErr.message);
    }

    res.json(updated);
  } catch (err) {
    console.error("Master Update Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================
   CREATE USER
========================= */
const createUser = async (req, res) => {
  try {
    const user = await usersService.createUser(req.body);
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept: user.dept,
    });
  } catch (err) {
    if (err.message === "Email already exists") {
      return res.status(400).json({ message: err.message });
    }

    console.error(err);
    res.status(500).json({ message: "Failed to create user" });
  }
};

/* =========================
   DELETE USER ✅ (المضاف)
========================= */
const deleteUser = async (req, res) => {
  const userId = Number(req.params.id);
  if (isNaN(userId))
    return res.status(400).json({ message: "Invalid user id" });

  try {
    const deleted = await usersService.deleteUser(userId);
    if (!deleted)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  createUser,
  deleteUser,
};