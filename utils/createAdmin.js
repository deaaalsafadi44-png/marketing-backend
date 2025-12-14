const User = require("../models/User");
const bcrypt = require("bcryptjs");

const createAdminIfNotExists = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("👤 Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = new User({
      name: "System Admin",
      email: "admin@system.com",
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();

    console.log("✅ Admin account created successfully");
    console.log("📧 Email: admin@system.com");
    console.log("🔑 Password: Admin@123");
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
  }
};

module.exports = createAdminIfNotExists;
