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

    /* =====================================================
       ⭐ NEW — PUSH NOTIFICATIONS SUBSCRIPTION
       تخزين بيانات المتصفح لإرسال الإشعارات وهو مغلق
    ===================================================== */
    pushSubscription: {
      type: Object,
      default: null
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("User", UserSchema);