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
  },
  { versionKey: false }
);

module.exports = mongoose.model("Task", TaskSchema);
