const User = require("../models/User");
const bcrypt = require("bcryptjs");

/* =========================
   GET ALL USERS
========================= */
const getAllUsers = async () => {
  return await User.find(
    {},
    { _id: 0, password: 0, refreshToken: 0 }
  );
};

/* =========================
   GET USER BY ID
========================= */
const getUserById = async (id) => {
  return await User.findOne(
    { id },
    { _id: 0, password: 0, refreshToken: 0 }
  );
};

/* =========================
   UPDATE USER
========================= */
const updateUser = async (id, data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  } else {
    delete data.password;
  }

  return await User.findOneAndUpdate(
    { id },
    data,
    { new: true, projection: { _id: 0 } }
  );
};

/* =========================
   DELETE USER ✅ (الحل هنا)
========================= */
const deleteUser = async (id) => {
  const result = await User.findOneAndDelete({ id });
  return result;
};

/* =========================
   CREATE USER
========================= */
const createUser = async (data) => {
  const exists = await User.findOne({ email: data.email });
  if (exists) throw new Error("Email already exists");

  return await User.create({
    id: Math.floor(Date.now() / 1000),
    name: data.name,
    email: data.email,
    password: await bcrypt.hash(data.password, 10),
    role: data.role,
    dept: data.dept,
    createdAt: new Date().toISOString(),
    refreshToken: null,
  });
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser, // ✅ مهم جدًا
  createUser,
};
