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
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });
  try {
    const user = await usersService.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load user" });
  }
};

/* ========================================================
   UPDATE USER (النسخة النهائية لتوحيد الحقول type و workerJobTitle)
======================================================== */
const updateUser = async (req, res) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

  try {
    // 1. جلب بيانات المستخدم قبل التعديل
    const oldUser = await usersService.getUserById(userId);
    if (!oldUser) return res.status(404).json({ message: "User not found" });

    // 2. تحديث بيانات المستخدم في جدول الـ Users
    const updated = await usersService.updateUser(userId, req.body);
    if (!updated) return res.status(404).json({ message: "User not found" });

    // 3. مزامنة التاسكات القديمة (الحل السحري)
    try {
      const Task = require("../models/Task"); 
      
      const newName = req.body.name || oldUser.name;
      // نستخدم dept أو jobTitle حسب ما يرسله الفرونت إند
      const newJobTitle = req.body.dept || req.body.jobTitle || oldUser.dept;

      // تحديث كافة الحقول الممكنة لضمان الظهور في الفرونت إند والبحث
      const syncResult = await Task.updateMany(
        { 
          $or: [
            { workerId: userId },
            { workerName: oldUser.name }
          ]
        }, 
        { 
          $set: { 
            workerName: newName,
            workerJobTitle: newJobTitle, // للعرض في جدول التاسكات
            type: newJobTitle           // ليعمل نظام البحث (Search) والفلترة
          } 
        }
      );

      console.log(`[Sync Success] Updated ${syncResult.modifiedCount} tasks to Job Title: ${newJobTitle}`);

    } catch (syncErr) {
      console.error("Task Sync Error:", syncErr.message);
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
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create user" });
  }
};

/* =========================
   DELETE USER
========================= */
const deleteUser = async (req, res) => {
  const userId = Number(req.params.id);
  try {
    const deleted = await usersService.deleteUser(userId);
    if (!deleted) return res.status(404).json({ message: "User not found" });
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