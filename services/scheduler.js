const Task = require("../models/Task"); // T كبيرة لتطابق اسم الملف Task.js
const User = require("../models/User"); // U كبيرة لتطابق اسم الملف User.js

/**
 * وظيفة لاستنساخ مهمة من القالب المجدول
 * تأخذ القالب (Template) وتنشئ منه مهمة جديدة للموظف
 */
const createInstanceFromTemplate = async (template) => {
  try {
    const newTaskId = Math.floor(Date.now() / 1000);
    
    // إنشاء كائن المهمة الجديدة بناءً على بيانات القالب
    const newTaskData = {
      id: newTaskId,
      title: template.title,
      description: template.description,
      type: template.type,
      priority: template.priority,
      status: "Pending", // دائماً تبدأ بـ Pending
      company: template.company,
      workerId: template.workerId,
      workerName: template.workerName,
      workerJobTitle: template.workerJobTitle,
      createdAt: new Date().toISOString(),
      isScheduled: false, // المهمة الجديدة ليست قالباً بل مهمة حقيقية
      isLocked: false,
      timer: {
        totalSeconds: 0,
        isRunning: false,
        startedAt: null,
      }
    };

    const newTask = await Task.create(newTaskData);
    console.log(`✅ [Scheduler] New task created for ${template.workerName}: ${template.title}`);
    return newTask;
  } catch (error) {
    console.error("❌ [Scheduler] Error creating task instance:", error);
  }
};

/**
 * وظيفة لحساب تاريخ التنفيذ القادم بناءً على الوتيرة (Frequency)
 */
const calculateNextRun = (frequency) => {
  const now = new Date();
  let nextDate = new Date(now);

  if (frequency === "daily") {
    nextDate.setDate(now.getDate() + 1);
  } else if (frequency === "weekly") {
    nextDate.setDate(now.getDate() + 7);
  } else if (frequency === "monthly") {
    nextDate.setMonth(now.getMonth() + 1);
  } else {
    return null;
  }
  return nextDate;
};

/**
 * المحرك الرئيسي (The Engine)
 * يبحث عن المهام التي حان موعد تنفيذها
 */
const checkScheduledTasks = async () => {
  console.log("🔍 [Scheduler] Checking for scheduled tasks...");
  try {
    const now = new Date();
    
    // البحث عن القوالب المجدولة التي حان موعدها أو فات موعدها
    const scheduledTemplates = await Task.find({
      isScheduled: true,
      nextRun: { $lte: now },
      frequency: { $ne: "none" }
    });

    for (const template of scheduledTemplates) {
      // 1. إنشاء المهمة الفعلية للموظف
      await createInstanceFromTemplate(template);

      // 2. تحديث موعد التنفيذ القادم للقالب
      const nextRunDate = calculateNextRun(template.frequency);
      template.nextRun = nextRunDate;
      await template.save();
      
      console.log(`📅 [Scheduler] Next run for "${template.title}" set to: ${nextRunDate}`);
    }
  } catch (error) {
    console.error("❌ [Scheduler] Error in checkScheduledTasks:", error);
  }
};

// تشغيل المحرك كل ساعة
setInterval(checkScheduledTasks, 3600000);

module.exports = { checkScheduledTasks };