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
       ⭐ NEW — PROFESSIONAL TIMER (Start / Pause / Resume)
       ✅ بدون تغيير أي منطق قديم — فقط إضافة حقول جديدة
    ===================================================== */
    timer: {
      totalSeconds: { type: Number, default: 0 }, // مجموع الوقت المثبت
      isRunning: { type: Boolean, default: false }, // هل التايمر شغال
      startedAt: { type: Date, default: null }, // آخر وقت بدأ فيه (أو تم Resume)
      pausedAt: { type: Date, default: null }, // آخر وقت Pause
      lastUpdatedAt: { type: Date, default: null }, // للتتبع/الحماية
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Task", TaskSchema);
