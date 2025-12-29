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
    workerJobTitle: { type: String, default: "" },

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
    ===================================================== */
    comments: [
      {
        text: { type: String, required: true },
        author: { type: String, required: true },
        role: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    /* =====================================================
        🕒 NEW — SCHEDULED TASKS CONFIGURATION
    ===================================================== */
    isScheduled: { type: Boolean, default: false }, 
    frequency: { 
      type: String, 
      enum: ["none", "daily", "weekly", "monthly"], 
      default: "none" 
    }, 
    nextRun: { type: Date, default: null }, 
    scheduledDay: { type: Number, default: null },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Task", TaskSchema);