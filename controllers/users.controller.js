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
   UPDATE USER (النسخة النهائية لحل مشكلة التاسكات القديمة)
========================= */
/* =========================
   UPDATE USER (النسخة النهائية الفعالة 100%)
========================= */
const updateUser = async (req, res) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

  try {
    // 1. جلب بيانات المستخدم القديمة قبل أي تعديل
    const oldUser = await usersService.getUserById(userId);
    if (!oldUser) return res.status(404).json({ message: "User not found" });

    // 2. تحديث بيانات المستخدم في جدول المستخدمين
    const updated = await usersService.updateUser(userId, req.body);
    if (!updated) return res.status(404).json({ message: "User not found" });

    // 3. تحديث التاسكات المرتبطة (بأسلوب هجومي ومباشر)
    try {
      const Task = require("../models/Task"); 
      
      const newName = req.body.name || oldUser.name;
      const newJobTitle = req.body.jobTitle || oldUser.jobTitle;

      // تحديث كافة المهام التي تخص هذا الموظف
      // استخدمنا strict: false لإجبار قاعدة البيانات على قبول الحقل حتى لو لم يكن في السكيما
      const result = await Task.updateMany(
        { 
          $or: [
            { workerName: oldUser.name },
            { workerName: oldUser.name.trim() } // تجربة البحث بالاسم بدون مسافات
          ]
        }, 
        { 
          $set: { 
            workerName: newName,
            workerJobTitle: newJobTitle 
          } 
        },
        { strict: false, upsert: false }
      );

      console.log(`Sync Report for ${oldUser.name}: Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

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