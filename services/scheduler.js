const Task = require("../models/Task"); 
const User = require("../models/User"); 
const { sendNotification } = require("./notifications.service"); 
const Notification = require("../models/Notification"); 

let isProcessing = false;

/**
 * دالة حساب الموعد القادم - تضمن دائماً القفز للمستقبل
 */
const calculateNextRun = (frequency, lastNextRun) => {
  const now = new Date();
  let nextDate = lastNextRun ? new Date(lastNextRun) : new Date();

  // القفز بالوقت حتى يتجاوز الوقت الحالي حتماً
  while (nextDate <= now) {
    if (frequency === "daily") nextDate.setDate(nextDate.getDate() + 1);
    else if (frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
    else if (frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
    else return null; 
  }
  return nextDate;
};

/**
 * المحرك الرئيسي - معالج القفل الذري ومنع التكرار
 */
const checkScheduledTasks = async () => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date();

    // 1. البحث عن القالب الأصلي فقط (نستخدم حقل إضافي كفلتر لزيادة الأمان)
    const template = await Task.findOneAndUpdate(
      {
        isScheduled: true,
        nextRun: { $lte: now },
        isLocked: { $ne: true },
        frequency: { $ne: "none" }
      },
      { $set: { isLocked: true } }, // قفل المهمة فوراً لمنع السيرفرات الأخرى
      { new: true }
    );

    if (!template) {
      isProcessing = false;
      return;
    }

    console.log(`🚀 [Scheduler] Processing: ${template.title}`);

    // 2. تحديث موعد القالب "قبل" أي إجراء آخر (للمستقبل)
    const nextRunDate = calculateNextRun(template.frequency, template.nextRun);
    
    await Task.updateOne(
      { _id: template._id },
      { 
        $set: { 
          nextRun: nextRunDate, 
          isScheduled: nextRunDate !== null,
          isLocked: false 
        } 
      }
    );

    // 3. إنشاء نسخة تنفيذية "نظيفة" (ليست مجدولة)
    const newTaskId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
    
    // ننسخ البيانات مع تصفير حقول الجدولة في النسخة الجديدة
    const instanceData = {
      ...template.toObject(),
      _id: undefined, 
      id: newTaskId,
      isScheduled: false, // 🛑 أهم سطر: لكي لا يراها المحرك مرة أخرى
      isLocked: false,
      nextRun: null,      // النسخة التنفيذية لا تملك موعداً مستقبلياً
      status: "Pending",
      createdAt: new Date().toISOString(),
      timer: { totalSeconds: 0, isRunning: false, startedAt: null }
    };

    const newInstance = await Task.create(instanceData);

    if (newInstance) {
      console.log(`✅ [Scheduler] Instance created: ${newInstance.title}`);

      // 4. إرسال الإشعارات
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

  } catch (error) {
    console.error("❌ [Scheduler] Critical Error:", error);
    // فك القفل في حال حدوث خطأ
    await Task.updateMany({ isLocked: true }, { $set: { isLocked: false } });
  } finally {
    isProcessing = false;
  }
};

// فحص كل دقيقة (كافية جداً)
setInterval(checkScheduledTasks, 60000); 

module.exports = { checkScheduledTasks };