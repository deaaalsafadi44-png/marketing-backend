const Task = require("../models/Task"); 
const User = require("../models/User"); 
const { sendNotification } = require("./notifications.service"); // خدمة الـ Push
const Notification = require("../models/Notification"); // موديل إشعارات الجرس
/**
 * وظيفة لاستنساخ مهمة من القالب المجدول
 */
const createInstanceFromTemplate = async (template) => {
  try {
    const newTaskId = Math.floor(Date.now() / 1000);
    
    const newTaskData = {
      id: newTaskId,
      title: template.title,
      description: template.description,
      type: template.type,
      priority: template.priority,
      status: "Pending",
      company: template.company,
      workerId: template.workerId,
      workerName: template.workerName,
      workerJobTitle: template.workerJobTitle,
      createdAt: new Date().toISOString(),
      isScheduled: false, // مهمة تنفيذية وليست قالباً
      isLocked: false,
      timer: {
        totalSeconds: 0,
        isRunning: false,
        startedAt: null,
      }
    };

    const newTask = await Task.create(newTaskData);
    console.log(`✅ [Scheduler] New instance created: ${template.title} for ${template.workerName}`);
    return newTask;
  } catch (error) {
    console.error("❌ [Scheduler] Error creating instance:", error);
  }
};

/**
 * وظيفة لحساب تاريخ التنفيذ القادم
 */
const calculateNextRun = (frequency, lastNextRun) => {
  // نستخدم تاريخ آخر تنفيذ كقاعدة للحساب لضمان عدم زحف المواعيد
  const baseDate = lastNextRun ? new Date(lastNextRun) : new Date();
  let nextDate = new Date(baseDate);

  if (frequency === "daily") {
    nextDate.setDate(baseDate.getDate() + 1);
  } else if (frequency === "weekly") {
    nextDate.setDate(baseDate.getDate() + 7);
  } else if (frequency === "monthly") {
    nextDate.setMonth(baseDate.getMonth() + 1);
  } else {
    return null;
  }
  return nextDate;
};

/**
 * المحرك الرئيسي
 */
/**
 * المحرك الرئيسي المطور
 * يدعم التنفيذ لمرة واحدة أو التكرار بناءً على تاريخ محدد
 */
const calculateNextRun = (frequency, lastNextRun) => {
  const now = new Date();
  // إذا لم يكن هناك تاريخ سابق، نبدأ من الآن
  let nextDate = lastNextRun ? new Date(lastNextRun) : new Date();

  // 🛑 أهم تعديل: طالما أن التاريخ المحسوب أصغر من أو يساوي "الآن"
  // استمر في إضافة الوقت حسب التكرار حتى نصل لموعد مستقبلي
  while (nextDate <= now) {
    if (frequency === "daily") {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (frequency === "weekly") {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (frequency === "monthly") {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      return null; // في حال كانت frequency غير معروفة
    }
  }
  return nextDate;
};

// تشغيل الفحص فوراً عند بدء تشغيل السيرفر
checkScheduledTasks();

// ثم ضبط التكرار كل ساعة
// --- التعديل هنا ---

// بدلاً من 3600000 (ساعة)
// نجعلها 60000 (التي تعادل 60 ثانية / دقيقة واحدة)
setInterval(checkScheduledTasks, 60000); 

module.exports = { checkScheduledTasks };