const Task = require("../models/Task"); 
const User = require("../models/User"); 
const { sendNotification } = require("./notifications.service"); 
const Notification = require("../models/Notification"); 

// 🛑 قفل لمنع التداخل داخل نفس السيرفر
let isProcessing = false;

/**
 * وظيفة لاستنساخ مهمة من القالب المجدول
 */
const createInstanceFromTemplate = async (template) => {
  try {
    // استخدام timestamp فريد جداً للمهمة الجديدة
    const newTaskId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
    
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
    return newTask;
  } catch (error) {
    console.error("❌ [Scheduler] Error creating instance:", error);
    return null;
  }
};

/**
 * وظيفة لحساب تاريخ التنفيذ القادم (تضمن القفز للمستقبل)
 */
const calculateNextRun = (frequency, lastNextRun) => {
  const now = new Date();
  let nextDate = lastNextRun ? new Date(lastNextRun) : new Date();

  // القفز بالوقت حتى نصل لموعد مستقبلي تماماً
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
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date();
    
    // 1. جلب المهام المستحقة فقط
    const scheduledTemplates = await Task.find({
      isScheduled: true,
      nextRun: { $lte: now },
      nextRun: { $ne: null }
    });

    if (scheduledTemplates.length === 0) return;

    for (const template of scheduledTemplates) {
      try {
        let nextRunDate = null;
        let shouldStillBeScheduled = true;

        if (!template.frequency || template.frequency === "none") {
          shouldStillBeScheduled = false;
        } else {
          nextRunDate = calculateNextRun(template.frequency, template.nextRun);
        }

        // 2. 🛡️ القفل الذري (Atomic Lock):
        // نحاول تحديث المهمة بشرط أن التاريخ لم يتغير منذ أن قرأناه
        // إذا نجحت نسخة واحدة من السيرفر في التحديث، ستفشل النسخة الأخرى
        const updatedTemplate = await Task.findOneAndUpdate(
          { 
            _id: template._id, 
            nextRun: template.nextRun, // أهم شرط لمنع التكرار
            isScheduled: true 
          },
          { 
            $set: { 
              nextRun: nextRunDate, 
              isScheduled: shouldStillBeScheduled 
            } 
          },
          { new: true }
        );

        // إذا كان updatedTemplate فارغاً، فهذا يعني أن نسخة سيرفر أخرى سبقتنا
        if (!updatedTemplate) {
          console.log(`⚠️ [Scheduler] Skipping ${template.title} - processed by another instance.`);
          continue; 
        }

        // 3. إنشاء النسخة التنفيذية (تتم مرة واحدة فقط الآن)
        const newInstance = await createInstanceFromTemplate(template);

        if (newInstance) {
          console.log(`✅ [Scheduler] Created: ${template.title}`);

          // إشعار الجرس والـ Push
          await Promise.allSettled([
            Notification.create({
              recipientId: newInstance.workerId,
              title: "⏰ موعد مهمة مجدولة",
              body: `تذكير: حان موعد تنفيذ "${newInstance.title}"`,
              url: `/tasks/view/${newInstance.id}`
            }),
            sendNotification(newInstance.workerId, {
              title: "⏰ مهمة مجدولة جديدة",
              body: `المهمة: ${newInstance.title}`,
              url: `/tasks/view/${newInstance.id}`
            })
          ]);
        }
      } catch (loopError) {
        console.error("❌ Loop Error:", loopError);
      }
    }
  } catch (error) {
    console.error("❌ Engine error:", error);
  } finally {
    isProcessing = false;
  }
};

// إعدادات التشغيل
setInterval(checkScheduledTasks, 60000); 
setTimeout(checkScheduledTasks, 10000); // زيادة المهلة لـ 10 ثوانٍ لضمان استقرار السيرفر

module.exports = { checkScheduledTasks };