const Task = require("../models/Task"); 
const User = require("../models/User"); 
const { sendNotification } = require("./notifications.service"); // خدمة الـ Push
const Notification = require("../models/Notification"); // موديل إشعارات الجرس

// 🛑 متغير لمنع التداخل داخل نفس نسخة السيرفر
let isProcessing = false;

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
      isScheduled: false, 
      isLocked: false,
      timer: {
        totalSeconds: 0,
        isRunning: false,
        startedAt: null,
      }
    };

    const newTask = await Task.create(newTaskData);
    console.log(`✅ [Scheduler] New instance created: ${template.title}`);
    return newTask;
  } catch (error) {
    console.error("❌ [Scheduler] Error creating instance:", error);
  }
};

/**
 * وظيفة لحساب تاريخ التنفيذ القادم
 */
const calculateNextRun = (frequency, lastNextRun) => {
  const now = new Date();
  let nextDate = lastNextRun ? new Date(lastNextRun) : new Date();

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
 * المحرك الرئيسي
 */
const checkScheduledTasks = async () => {
  // 🛑 منع التشغيل إذا كان هناك فحص جارٍ بالفعل
  if (isProcessing) {
    console.log("⏳ [Scheduler] Check already in progress, skipping...");
    return;
  }

  isProcessing = true;
  console.log(`🔍 [Scheduler] Checking tasks at: ${new Date().toLocaleString()}`);

  try {
    const now = new Date();
    
    const scheduledTemplates = await Task.find({
      isScheduled: true,
      nextRun: { $lte: now },
      nextRun: { $ne: null }
    });

    if (scheduledTemplates.length === 0) {
      isProcessing = false;
      return;
    }

    for (const template of scheduledTemplates) {
      try {
        let nextRunDate = null;
        let shouldStillBeScheduled = true;

        if (!template.frequency || template.frequency === "none") {
          shouldStillBeScheduled = false;
        } else {
          nextRunDate = calculateNextRun(template.frequency, template.nextRun);
        }

        // 🛑 التحديث في قاعدة البيانات أولاً وقبل أي شيء لكسر حلقة التكرار بين النسخ
        const updatedTemplate = await Task.findOneAndUpdate(
          { 
            _id: template._id, 
            nextRun: template.nextRun // شرط لضمان عدم معالجتها من نسخة سيرفر أخرى
          },
          { 
            $set: { 
              nextRun: nextRunDate, 
              isScheduled: shouldStillBeScheduled 
            } 
          },
          { new: true }
        );

        if (!updatedTemplate) {
          console.log(`⚠️ [Scheduler] Task ${template.title} already picked up by another instance.`);
          continue; 
        }

        const newInstance = await createInstanceFromTemplate(template);

        if (newInstance) {
          // إشعار الجرس
          await Notification.create({
            recipientId: newInstance.workerId,
            title: "⏰ موعد مهمة مجدولة",
            body: `تذكير: حان موعد تنفيذ "${newInstance.title}"`,
            url: `/tasks/view/${newInstance.id}`
          }).catch(err => {});

          // إشعار الـ Push
          sendNotification(newInstance.workerId, {
            title: "⏰ مهمة مجدولة جديدة",
            body: `المهمة: ${newInstance.title}`,
            url: `/tasks/view/${newInstance.id}`
          }).catch(err => {});
        }
      } catch (loopError) {
        console.error("❌ Loop Error:", loopError);
      }
    }
  } catch (error) {
    console.error("❌ Engine error:", error);
  } finally {
    isProcessing = false; // 🛑 فتح القفل دائماً عند الانتهاء
  }
};

// --- إعدادات التشغيل ---
setInterval(checkScheduledTasks, 60000);
setTimeout(checkScheduledTasks, 5000);

module.exports = { checkScheduledTasks };