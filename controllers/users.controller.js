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
   UPDATE USER (النسخة المصححة والمضمونة)
========================= */
const updateUser = async (req, res) => {
  const userId = Number(req.params.id);
  if (isNaN(userId))
    return res.status(400).json({ message: "Invalid user id" });

  try {
    // 1. جلب بيانات المستخدم "قبل التعديل" لمعرفة الاسم القديم المخزن في التاسكات
    const oldUser = await usersService.getUserById(userId);
    if (!oldUser)
      return res.status(404).json({ message: "User not found" });

    // 2. تحديث بيانات المستخدم في قاعدة البيانات (يرجع البيانات الجديدة)
    const updated = await usersService.updateUser(userId, req.body);

    // 3. تحديث كافة التاسكات المرتبطة بهذا الموظف
    const Task = require("../models/task.model"); // تأكد من صحة هذا المسار

    if (req.body.jobTitle || req.body.name) {
      // نبحث بالاسم القديم (oldUser.name) 
      // ونقوم بتحديثه للاسم الجديد والمسمى الجديد (من كائن updated)
      await Task.updateMany(
        { workerName: oldUser.name }, 
        { 
          workerJobTitle: updated.jobTitle,
          workerName: updated.name 
        }
      );
    }

    res.json(updated);
  } catch (err) {
    console.error("Update Sync Error:", err);
    res.status(500).json({ message: "Failed to update user and sync tasks" });
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
