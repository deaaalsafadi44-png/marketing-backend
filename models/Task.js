const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    title: String,
    description: String,
    type: String,
    priority: String,
    status: String,
    company: String,
    workerId: Number,
    workerName: String,
    timeSpent: Number,
    createdAt: String,

    /* =====================================================
        ⭐ NEW — PROFESSIONAL TIMER
    ===================================================== */
    timer: {
      totalSeconds: { type: Number, default: 0 },
      isRunning: { type: Boolean, default: false },
      startedAt: { type: Date, default: null },
      pausedAt: { type: Date, default: null },
      lastUpdatedAt: { type: Date, default: null },
    },

    // 🔒 التعديل الجديد هنا:
    isLocked: { type: Boolean, default: false }, 

    /* =====================================================
        ⭐ NEW — COMMENTS ARRAY (Admin & Manager)
        ✅ إضافة حقل التعليقات دون المساس بالبيانات القديمة
    ===================================================== */
    comments: [
      {
        text: { type: String, required: true }, // نص التعليق
        author: { type: String, required: true }, // اسم الكاتب (Admin/Manager)
        role: { type: String }, // دور الكاتب للتأكيد
        createdAt: { type: Date, default: Date.now }, // وقت التعليق تلقائياً
      }
    ],
  },
  { versionKey: false }
);

module.exports = mongoose.model("Task", TaskSchema);