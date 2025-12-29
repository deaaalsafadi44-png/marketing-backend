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
 * وظيفة لحساب تاريخ التنفيذ القادم (تضمن القفز للمستقبل)
 */
const calculateNextRun = (frequency, lastNextRun) => {
  const now = new Date();
  let nextDate = lastNextRun ? new Date(lastNextRun) : new Date();

  // طالما أن التاريخ المحسوب في الماضي، أضف الوقت حسب التكرار
  while (nextDate <= now) {
    if (frequency === "daily") {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (frequency === "weekly") {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (frequency === "monthly") {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      return null; 
    }
  }
  return nextDate;
};

/**
 * المحرك الرئيسي لفحص المهام المجدولة
 */
const checkScheduledTasks = async () => {
  console.log(`🔍 [Scheduler] Checking tasks at: ${new Date().toLocaleString()}`);
  try {
    const now = new Date();
    
    // 1. جلب القوالب التي حان موعدها
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
      let nextRunDate = null;
      let shouldStillBeScheduled = true;

      // حساب الموعد القادم
      if (template.frequency === "none" || !template.frequency) {
        shouldStillBeScheduled = false;
        nextRunDate = null;
      } else {
        nextRunDate = calculateNextRun(template.frequency, template.nextRun);
      }

      // 🛑 تحديث القالب فوراً لكسر حلقة التكرار
      await Task.updateOne(
        { _id: template._id },
        { 
          $set: { 
            nextRun: nextRunDate, 
            isScheduled: shouldStillBeScheduled 
          } 
        }
      );

      // 2. إنشاء النسخة التنفيذية
      const newInstance = await createInstanceFromTemplate(template);

      // 3. إرسال الإشعارات
      if (newInstance) {
        // إشعار الجرس
        await Notification.create({
          recipientId: newInstance.workerId,
          title: "⏰ موعد مهمة مجدولة",
          body: `تذكير: حان موعد تنفيذ "${newInstance.title}"`,
          url: `/tasks/view/${newInstance.id}`
        }).catch(err => console.error("❌ Notification Error:", err));

        // إشعار الـ Push
        sendNotification(newInstance.workerId, {
          title: "⏰ مهمة مجدولة جديدة",
          body: `المهمة: ${newInstance.title}\nالشركة: ${newInstance.company}`,
          url: `/tasks/view/${newInstance.id}`
        }).catch(err => console.error("❌ Push Error:", err));
      }
      console.log(`✅ [Scheduler] Processed: ${template.title}`);
    }
  } catch (error) {
    console.error("❌ [Scheduler] Engine error:", error);
  }
};

// --- إعدادات التشغيل ---

// تشغيل الفحص الدوري كل دقيقة واحدة
setInterval(checkScheduledTasks, 60000);

// تشغيل أولي بعد 5 ثوانٍ من تشغيل السيرفر للتأكد من استقرار الاتصال
setTimeout(checkScheduledTasks, 5000);

module.exports = { checkScheduledTasks };