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
const Task = require("../models/Task");
const { sendNotification } = require("./notifications.service");
const Notification = require("../models/Notification");

let isProcessing = false;

const calculateNextRun = (frequency, lastNextRun) => {
  const now = new Date();
  // نضمن أن البداية هي الوقت الحالي لنتجنب أي تاريخ قديم عالق
  let nextDate = lastNextRun ? new Date(lastNextRun) : new Date();

  // إذا كان التاريخ المحسوب لا يزال في الماضي، نقفز للمستقبل بناءً على التكرار
  while (nextDate <= now) {
    if (frequency === "daily") nextDate.setDate(nextDate.getDate() + 1);
    else if (frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
    else if (frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
    else return null;
  }
  return nextDate;
};

const checkScheduledTasks = async () => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date();

    // 1. البحث عن "قالب" واحد فقط مستحق
    // أضفنا شرط isLocked و status لضمان عدم لمس المهام التنفيذية
    const template = await Task.findOneAndUpdate(
      {
        isScheduled: true,
        nextRun: { $lte: now },
        isLocked: { $ne: true }, // حماية من النسخ الأخرى
        frequency: { $ne: "none" } 
      },
      { $set: { isLocked: true } }, // قفل المهمة فوراً
      { new: true }
    );

    if (!template) {
      isProcessing = false;
      return;
    }

    // 2. حساب الموعد القادم (سيقفز دائماً للمستقبل)
    const nextRunDate = calculateNextRun(template.frequency, template.nextRun);

    // 3. التحديث الحاسم: نغير موعد القالب "قبل" خلق النسخة الجديدة
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

    // 4. إنشاء النسخة التنفيذية (الآن هي آمنة ولن تتكرر)
    const newInstanceId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
    const newTask = await Task.create({
      ...template.toObject(),
      _id: undefined, // ترك مونجو ينشئ ID جديد
      id: newInstanceId,
      isScheduled: false, // 🛑 أهم سطر: النسخة الناتجة ليست جدولاً
      isLocked: false,
      status: "Pending",
      createdAt: new Date().toISOString(),
      nextRun: null // النسخة التنفيذية لا تملك موعداً قادماً
    });

    if (newTask) {
      console.log(`✅ [Scheduler] Created instance: ${newTask.title}`);
      // إرسال الإشعارات مرة واحدة فقط
      await Notification.create({
        recipientId: newTask.workerId,
        title: "⏰ مهمة مجدولة",
        body: `تذكير: موعد تنفيذ "${newTask.title}"`,
        url: `/tasks/view/${newTask.id}`
      });
      
      sendNotification(newTask.workerId, {
        title: "⏰ مهمة مجدولة جديدة",
        body: newTask.title,
        url: `/tasks/view/${newTask.id}`
      }).catch(() => {});
    }

  } catch (error) {
    console.error("❌ Scheduler Error:", error);
    await Task.updateMany({ isLocked: true }, { $set: { isLocked: false } });
  } finally {
    isProcessing = false;
  }
};

// تشغيل كل دقيقة فقط
setInterval(checkScheduledTasks, 60000);
module.exports = { checkScheduledTasks };
// إعدادات التشغيل
setInterval(checkScheduledTasks, 60000); 
setTimeout(checkScheduledTasks, 10000); // زيادة المهلة لـ 10 ثوانٍ لضمان استقرار السيرفر

module.exports = { checkScheduledTasks };