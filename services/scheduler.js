const Task = require("../models/Task"); 
const User = require("../models/User"); 

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
const checkScheduledTasks = async () => {
  console.log(`🔍 [Scheduler] Checking tasks at: ${new Date().toLocaleString()}`);
  try {
    const now = new Date();
    
    // 1. جلب القوالب التي حان موعدها (nextRun <= الآن) 
    // أزلنا شرط frequency: { $ne: "none" } للسماح بتنفيذ المهام غير المكررة
    const scheduledTemplates = await Task.find({
      isScheduled: true,
      nextRun: { $lte: now },
      nextRun: { $ne: null }
    });

    if (scheduledTemplates.length === 0) {
      console.log("ℹ️ [Scheduler] No tasks due for execution.");
      return;
    }

    for (const template of scheduledTemplates) {
      // 2. إنشاء النسخة التنفيذية المسندة للموظف
      await createInstanceFromTemplate(template);

      // 3. إدارة منطق ما بعد التنفيذ (تكرار أم إيقاف)
      if (template.frequency === "none" || !template.frequency) {
        // إذا كانت المهمة لمرة واحدة فقط، نغلق القالب المجدول
        template.isScheduled = false;
        template.nextRun = null;
        console.log(`✅ [Scheduler] Task "${template.title}" executed once and schedule finished.`);
      } else {
        // إذا كانت مكررة (يومي/أسبوعي/شهري)، نحسب التاريخ القادم
        const nextRunDate = calculateNextRun(template.frequency, template.nextRun);
        template.nextRun = nextRunDate;
        console.log(`📅 [Scheduler] Task "${template.title}" updated for next recurrence: ${nextRunDate}`);
      }

      // حفظ حالة القالب الجديدة في قاعدة البيانات
      await template.save();
    }
  } catch (error) {
    console.error("❌ [Scheduler] Critical engine error:", error);
  }
};

// تشغيل الفحص فوراً عند بدء تشغيل السيرفر
checkScheduledTasks();

// ثم ضبط التكرار كل ساعة
setInterval(checkScheduledTasks, 3600000);

module.exports = { checkScheduledTasks };