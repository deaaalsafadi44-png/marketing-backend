const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    name: String,
    email: String,
    password: String,
    role: String,
    dept: String,
    createdAt: String,
    refreshToken: String,
  },
  { versionKey: false }
);

module.exports = mongoose.model("User", UserSchema);
