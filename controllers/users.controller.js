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
   UPDATE USER (النسخة النهائية لحل اختفاء الجوب)
========================= */
const updateUser = async (req, res) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

  try {
    // 1. جلب البيانات قبل التعديل (لنحصل على الاسم القديم المسجل في التاسكات)
    const oldUser = await usersService.getUserById(userId);
    if (!oldUser) return res.status(404).json({ message: "User not found" });

    // 2. تحديث بيانات المستخدم في قاعدة بيانات المستخدمين
    const updated = await usersService.updateUser(userId, req.body);
    if (!updated) return res.status(404).json({ message: "User not found" });

    // 3. تحديث التاسكات المرتبطة
    try {
      const Task = require("../models/Task"); 

      // القيم الجديدة من طلب التعديل
      const newName = req.body.name || oldUser.name;
      const newJobTitle = req.body.jobTitle || oldUser.jobTitle;

      // تنفيذ التحديث الجماعي لجميع التاسكات التي تحمل اسم الموظف القديم
      const syncResult = await Task.updateMany(
        { workerName: oldUser.name }, 
        { 
          $set: { 
            workerName: newName,
            workerJobTitle: newJobTitle 
          } 
        }
      );
      
      console.log(`Sync Report: Found ${syncResult.matchedCount} tasks, updated ${syncResult.modifiedCount}`);
      
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
   DELETE USER
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