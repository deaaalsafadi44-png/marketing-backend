const Task = require("../models/Task"); 
const User = require("../models/User"); 
const { sendNotification } = require("./notifications.service"); 
const Notification = require("../models/Notification"); 

// 🛑 قفل داخلي لمنع تشغيل دالتين في نفس الوقت داخل نفس السيرفر
let isProcessing = false;

/**
 * وظيفة لحساب تاريخ التنفيذ القادم (تضمن القفز للمستقبل)
 */
const calculateNextRun = (frequency, lastNextRun) => {
  const now = new Date();
  // نضمن أن البداية هي الوقت الحالي لنتجنب أي تاريخ قديم عالق في الماضي
  let nextDate = lastNextRun ? new Date(lastNextRun) : new Date();

  // القفز بالوقت حتى نصل لموعد مستقبلي تماماً بالنسبة للوقت الحالي
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
  // منع التداخل إذا كانت الدورة السابقة لا تزال تعمل
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date();

    // 1. 🛡️ القفل الذري (Atomic Lock):
    // نبحث عن "قالب" واحد مستحق ونقفله فوراً قبل أي معالجة
    // هذا يمنع السيرفرات الأخرى من الإمساك بنفس المهمة
    const template = await Task.findOneAndUpdate(
      {
        isScheduled: true,
        nextRun: { $lte: now },
        nextRun: { $ne: null },
        isLocked: { $ne: true }, // التأكد أن المهمة غير محجوزة حالياً
        frequency: { $ne: "none" }
      },
      { $set: { isLocked: true } },
      { new: true }
    );

    // إذا لم نجد مهام مستحقة حالياً
    if (!template) {
      isProcessing = false;
      return;
    }

    console.log(`🚀 [Scheduler] Processing template: ${template.title}`);

    // 2. حساب الموعد القادم للمهمة القالب
    const nextRunDate = calculateNextRun(template.frequency, template.nextRun);

    // 3. التحديث الحاسم: نغير موعد القالب ونفتح القفل "قبل" خلق النسخة الجديدة
    // هذا يضمن أنه حتى لو تعطل السيرفر لاحقاً، فإن القالب تم تحديثه للمستقبل
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

    // 4. إنشاء النسخة التنفيذية (المهمة التي ستظهر للموظف)
    const newInstanceId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
    
    // ننسخ بيانات القالب ونحولها لمهمة عادية غير مجدولة
    const newTaskData = {
      ...template.toObject(),
      _id: undefined, // ترك MongoDB ينشئ معرف فريد جديد
      id: newInstanceId,
      isScheduled: false, // 🛑 حاسم: النسخة الناتجة ليست قالب جدول لمنع التكرار
      isLocked: false,
      status: "Pending",
      createdAt: new Date().toISOString(),
      nextRun: null, // النسخة لا تحتاج لموعد قادم
      timer: {
        totalSeconds: 0,
        isRunning: false,
        startedAt: null,
      }
    };

    const newTask = await Task.create(newTaskData);

    if (newTask) {
      console.log(`✅ [Scheduler] Instance created successfully: ${newTask.title}`);

      // 5. إرسال الإشعارات (الجرس والـ Push)
      await Promise.allSettled([
        Notification.create({
          recipientId: newTask.workerId,
          title: "⏰ موعد مهمة مجدولة",
          body: `تذكير: حان موعد تنفيذ "${newTask.title}"`,
          url: `/tasks/view/${newTask.id}`
        }),
        sendNotification(newTask.workerId, {
          title: "⏰ مهمة مجدولة جديدة",
          body: `المهمة: ${newTask.title}`,
          url: `/tasks/view/${newTask.id}`
        })
      ]);
    }

  } catch (error) {
    console.error("❌ [Scheduler] Error:", error);
    // في حالة حدوث خطأ كارثي، نحاول فك القفل عن المهام العالقة
    await Task.updateMany({ isLocked: true }, { $set: { isLocked: false } });
  } finally {
    isProcessing = false;
  }
};

/**
 * إعدادات التشغيل
 */
// الفحص الدوري كل دقيقة واحدة (كافية جداً للمهام المجدولة)
setInterval(checkScheduledTasks, 60000); 

// فحص أولي بعد 10 ثوانٍ من تشغيل السيرفر
setTimeout(checkScheduledTasks, 10000); 

module.exports = { checkScheduledTasks };