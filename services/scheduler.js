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
      const newInstance = await createInstanceFromTemplate(template);

      // ✨ [إضافة جديدة] إرسال الإشعارات الآن لأن المهمة ظهرت للموظف فعلياً
      if (newInstance) {
        // أ- إشعار الجرس (Database Notification)
        await Notification.create({
          recipientId: newInstance.workerId,
          title: "⏰ موعد مهمة مجدولة",
          body: `تذكير: حان موعد تنفيذ "${newInstance.title}"`,
          url: `/tasks/view/${newInstance.id}`
        }).catch(err => console.error("❌ Database Notification Error:", err));

        // ب- إشعار الـ Push للمتصفح
        sendNotification(newInstance.workerId, {
          title: "⏰ مهمة مجدولة جديدة",
          body: `المهمة: ${newInstance.title}\nالشركة: ${newInstance.company}`,
          url: `/tasks/view/${newInstance.id}`
        }).catch(err => console.error("❌ Push Notification Error:", err));
      }

      // 3. إدارة منطق ما بعد التنفيذ (تكرار أم إيقاف)
      if (template.frequency === "none" || !template.frequency) {
        template.isScheduled = false;
        template.nextRun = null;
        console.log(`✅ [Scheduler] Task "${template.title}" executed once and schedule finished.`);
      } else {
        const nextRunDate = calculateNextRun(template.frequency, template.nextRun);
        template.nextRun = nextRunDate;
        console.log(`📅 [Scheduler] Task "${template.title}" updated for next recurrence: ${nextRunDate}`);
      }

      await template.save();
    }
  } catch (error) {
    console.error("❌ [Scheduler] Critical engine error:", error);
  }
};

// تشغيل الفحص فوراً عند بدء تشغيل السيرفر
checkScheduledTasks();

// ثم ضبط التكرار كل ساعة
// --- التعديل هنا ---

// بدلاً من 3600000 (ساعة)
// نجعلها 60000 (التي تعادل 60 ثانية / دقيقة واحدة)
setInterval(checkScheduledTasks, 60000); 

module.exports = { checkScheduledTasks };