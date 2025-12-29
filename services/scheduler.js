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
    // زيادة هامش الأمان لضمان عدم تكرار المهام في نفس الدقيقة
    const safetyMargin = new Date(now.getTime() + 2000); 

    // 1. البحث عن مهمة واحدة مستحقة تماماً
    const template = await Task.findOne({
      isScheduled: true,
      nextRun: { $lte: now },
      nextRun: { $ne: null },
      isLocked: { $ne: true }
    });

    if (!template) {
      isProcessing = false;
      return;
    }

    // 2. حساب الموعد القادم "فوراً" وقبل أي إجراء آخر
    // نمرر التاريخ الحالي + يوم لضمان القفز الفعلي للمستقبل
    const nextRunDate = calculateNextRun(template.frequency, new Date());

    // 3. 🔒 التحديث الذري: تغيير الموعد في قاعدة البيانات "قبل" إنشاء النسخة
    // هذا هو أهم سطر لمنع الـ 22 نسخة
    const updated = await Task.findOneAndUpdate(
      { 
        _id: template._id, 
        nextRun: template.nextRun // التأكد أننا لا زلنا في نفس الدورة
      },
      { 
        $set: { 
          nextRun: nextRunDate, 
          isScheduled: nextRunDate !== null,
          isLocked: false 
        } 
      },
      { new: true }
    );

    // إذا فشل التحديث أو لم يجد المهمة، نخرج فوراً دون عمل أي شيء
    if (!updated) {
      isProcessing = false;
      return;
    }

    // 4. الآن فقط، وبعد أن ضمنا أن الموعد في قاعدة البيانات أصبح في "المستقبل"
    // نقوم بإنشاء النسخة وإرسال الإشعارات
    console.log(`✅ [Scheduler] Success: Next run for ${template.title} set to ${nextRunDate}`);
    
    const newInstance = await createInstanceFromTemplate(template);
    if (newInstance) {
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
    console.error("❌ [Scheduler] Error:", error);
  } finally {
    isProcessing = false;
    // اجعل المهلة أطول قليلاً (مثلاً 30 ثانية) لتجنب الضغط على السيرفر
    setTimeout(checkScheduledTasks, 30000); 
  }
};
// إعدادات التشغيل
setInterval(checkScheduledTasks, 60000); 
setTimeout(checkScheduledTasks, 10000); // زيادة المهلة لـ 10 ثوانٍ لضمان استقرار السيرفر

module.exports = { checkScheduledTasks };