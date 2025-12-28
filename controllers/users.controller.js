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
   UPDATE USER (Corrected Path)
========================= */
const updateUser = async (req, res) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

  try {
    // 1. جلب الاسم القديم قبل التعديل
    const oldUser = await usersService.getUserById(userId);
    if (!oldUser) return res.status(404).json({ message: "User not found" });

    // 2. تحديث بيانات المستخدم (هذا الجزء ينجح في تغيير الباسورد)
    const updated = await usersService.updateUser(userId, req.body);

    // 3. تحديث التاسكات (تم تصحيح المسار هنا بناءً على الصورة)
    try {
      // لاحظ المسار: تم تغييره إلى Task ليتوافق مع الملف الموجود في مجلد models
      const Task = require("../models/Task"); 

      if (req.body.jobTitle || req.body.name) {
        await Task.updateMany(
          { workerName: oldUser.name }, 
          { 
            workerJobTitle: updated.jobTitle || oldUser.jobTitle,
            workerName: updated.name || oldUser.name 
          }
        );
        console.log("Sync success: Tasks updated for", updated.name);
      }
    } catch (syncErr) {
      // نضعها في catch منفصلة لكي لا ينهار السيرفر إذا فشل التزامن
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
  deleteUser, // ✅ مهم جدًا
};
