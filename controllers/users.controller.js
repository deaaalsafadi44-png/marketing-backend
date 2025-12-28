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
   UPDATE USER (النسخة الاحترافية - حل مشكلة المزامنة نهائياً)
======================================================== */
const updateUser = async (req, res) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

  try {
    // 1. جلب بيانات المستخدم الأصلية قبل التعديل
    const oldUser = await usersService.getUserById(userId);
    if (!oldUser) return res.status(404).json({ message: "User not found" });

    // 2. تحديث بيانات المستخدم في قاعدة البيانات (Users Collection)
    const updated = await usersService.updateUser(userId, req.body);
    if (!updated) return res.status(404).json({ message: "User not found" });

    // 3. مزامنة التاسكات القديمة
    try {
      const Task = require("../models/Task"); 
      
      const newName = req.body.name || oldUser.name;
      const newJobTitle = req.body.jobTitle || oldUser.jobTitle;

      // البحث عن التاسكات باستخدام الاسم (بشكل مرن) أو باستخدام الـ ID
      const syncResult = await Task.updateMany(
        { 
          $or: [
            { workerName: oldUser.name },
            { workerName: oldUser.name.trim() },
            { workerId: userId } // الاعتماد على الـ ID لأنه لا يتغير أبداً
          ]
        }, 
        { 
          $set: { 
            workerName: newName,
            workerJobTitle: newJobTitle 
          } 
        }
      );

      console.log(`[Sync Success] User: ${oldUser.name} | Tasks Found: ${syncResult.matchedCount} | Tasks Updated: ${syncResult.modifiedCount}`);

    } catch (syncErr) {
      console.error("Critical Task Sync Error:", syncErr.message);
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