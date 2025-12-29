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

    // الخطوة 1: "اصطياد" مهمة واحدة فقط وتحديثها فوراً (Atomic Operation)
    // هذا يضمن أن نسخة واحدة فقط من السيرفر ستمسك بالمهمة
    const template = await Task.findOneAndUpdate(
      {
        isScheduled: true,
        nextRun: { $lte: now },
        nextRun: { $ne: null },
        // إضافة شرط إضافي لضمان عدم دخول أي نسخة أخرى
        isLocked: { $ne: true } 
      },
      { 
        $set: { isLocked: true } // قفل المهمة مؤقتاً أثناء المعالجة
      },
      { new: true }
    );

    if (!template) {
      isProcessing = false;
      return; // لا يوجد مهام مستحقة حالياً
    }

    console.log(`🚀 [Scheduler] Instance ${process.env.RENDER_INSTANCE_ID || 'Local'} grabbed: ${template.title}`);

    try {
      let nextRunDate = null;
      let shouldStillBeScheduled = true;

      if (!template.frequency || template.frequency === "none") {
        shouldStillBeScheduled = false;
      } else {
        nextRunDate = calculateNextRun(template.frequency, template.nextRun);
      }

      // الخطوة 2: إنشاء النسخة التنفيذية
      const newInstance = await createInstanceFromTemplate(template);

      // الخطوة 3: تحديث الموعد القادم وفتح القفل
      await Task.updateOne(
        { _id: template._id },
        { 
          $set: { 
            nextRun: nextRunDate, 
            isScheduled: shouldStillBeScheduled,
            isLocked: false // فتح القفل للمرة القادمة
          } 
        }
      );

      if (newInstance) {
        // إرسال الإشعارات (مرة واحدة فقط لأننا في نسخة سيرفر واحدة فائزة)
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
    } catch (innerError) {
      // في حال حدث خطأ، يجب فتح القفل لكي تحاول النسخة القادمة معالجتها
      await Task.updateOne({ _id: template._id }, { $set: { isLocked: false } });
      throw innerError;
    }

  } catch (error) {
    console.error("❌ [Scheduler] Engine error:", error);
  } finally {
    isProcessing = false;
    // إعادة تشغيل الفحص فوراً للتأكد من عدم وجود مهام أخرى مستحقة
    // (لأننا عالجنا مهمة واحدة فقط لضمان الأمان)
    setTimeout(checkScheduledTasks, 1000); 
  }
};
// إعدادات التشغيل
setInterval(checkScheduledTasks, 60000); 
setTimeout(checkScheduledTasks, 10000); // زيادة المهلة لـ 10 ثوانٍ لضمان استقرار السيرفر

module.exports = { checkScheduledTasks };